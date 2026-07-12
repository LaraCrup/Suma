export const useHabits = () => {
    const client = useSupabaseClient()
    const { grantXP, revokeXP, revokeAllHabitsDaily, revokeWeeklyGoalXP, checkStreakMilestone, checkAllHabitsDaily, checkFirstHabitCreated, checkWeeklyGoalMet } = useExperience()


    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()

        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.')
        }

        return session.user.id
    }

    const createHabit = async (habitData) => {
        const userId = await getUserId()

        const habitRecord = {
            user_id: userId,
            name: habitData.name,
            icon: habitData.icon,
            when_where: habitData.when_where,
            identity: habitData.identity,
            unit: habitData.unit || null,
            goal_value: habitData.goal_value || 1,
            frequency_type: habitData.frequency_type,
            frequency_option: habitData.frequency_option,
            frequency_detail: habitData.frequency_detail || null,
            reminder_enabled: habitData.reminder_enabled || false,
        }

        const { data, error } = await client
            .from('habits')
            .insert([habitRecord])
            .select()

        if (error) {
            console.error('Error en Supabase:', error)
            throw error
        }

        await checkFirstHabitCreated()

        return data?.[0] || null
    }

    const getHabits = async () => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('habits')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return await enrichHabitsWithCompletedDays(data || [])
    }

    const getHabitsForDate = async (dateStr) => {
        const allHabits = await getHabits()

        const habitIds = allHabits.map(h => h.id)
        const { data: dateLogs } = await client
            .from('habit_logs')
            .select('habit_id, value')
            .in('habit_id', habitIds)
            .eq('date', dateStr)

        const logsByHabitId = {}
        dateLogs?.forEach(log => { logsByHabitId[log.habit_id] = log })

        return allHabits.map(habit => {
            const log = logsByHabitId[habit.id]
            return log ? { ...habit, progress_count: log.value } : { ...habit, progress_count: 0 }
        })
    }

    const getHabitById = async (habitId, date = null) => {
        const { data, error } = await client
            .from('habits')
            .select('*')
            .eq('id', habitId)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!data) return null

        const targetDate = date || getArgentineDate()
        const { data: targetLog } = await client
            .from('habit_logs')
            .select('value')
            .eq('habit_id', habitId)
            .eq('date', targetDate)
            .maybeSingle()

        data.progress_count = targetLog?.value ?? 0

        const enriched = await enrichHabitsWithCompletedDays([data])
        return enriched[0]
    }

    const updateHabit = async (habitId, updates) => {
        const { data, error } = await client
            .from('habits')
            .update(updates)
            .eq('id', habitId)
            .select()

        if (error) {
            throw error
        }

        if (!data?.[0]) return null

        const enriched = await enrichHabitsWithCompletedDays([data[0]])
        return enriched[0]
    }

    const deleteHabit = async (habitId) => {
        const { error } = await client
            .from('habits')
            .delete()
            .eq('id', habitId)

        if (error) {
            throw error
        }

        return true
    }

    const logHabitProgress = async (habitId, amount = 1, date = null) => {
        await getUserId()

        const habit = await getHabitById(habitId)
        if (!habit) {
            throw new Error('Hábito no encontrado')
        }

        const today = getArgentineDate()
        const targetDate = date || today
        const isPastDate = targetDate !== today

        const { data: existingLog, error: searchError } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .eq('date', targetDate)
            .maybeSingle()

        if (searchError) {
            console.error('Error buscando log existente:', searchError)
            throw searchError
        }

        const baseProgress = existingLog?.value || 0
        let newProgressCount = baseProgress + amount
        newProgressCount = Math.max(0, newProgressCount)
        newProgressCount = Math.min(newProgressCount, habit.goal_value || 1)

        const isCompleted = newProgressCount >= (habit.goal_value || 1)

        if (existingLog) {
            const { error: updateLogError } = await client
                .from('habit_logs')
                .update({
                    value: newProgressCount,
                    completed: isCompleted
                })
                .eq('id', existingLog.id)

            if (updateLogError) {
                console.error('Error actualizando log de hábito:', updateLogError)
                throw updateLogError
            }
        } else {
            const { error: insertLogError } = await client
                .from('habit_logs')
                .insert([{
                    habit_id: habitId,
                    date: targetDate,
                    value: newProgressCount,
                    completed: isCompleted
                }])

            if (insertLogError) {
                console.error('Error creando log de hábito:', insertLogError)
                throw insertLogError
            }
        }

        let streakUpdate = {}
        let shouldGrantXP = false
        let shouldRevokeXP = false
        let streakForMilestone = 0
        const cadence = getStreakCadence(habit)

        if (cadence === 'weekly' || cadence === 'monthly') {
            const { start: pStart, end: pEnd } = getPeriodBounds(habit, targetDate)
            const { data: periodLogs } = await client
                .from('habit_logs')
                .select('id')
                .eq('habit_id', habitId)
                .gte('date', pStart)
                .lte('date', pEnd)
                .eq('completed', true)
            const completedCount = periodLogs?.length || 0
            const requiredCount = getPeriodQuota(habit, pStart)

            if (isCompleted && !existingLog?.completed) {
                if (requiredCount > 0 && completedCount === requiredCount) {
                    const newStreak = isPastDate
                        ? await calculateStreakUpTo(habit, targetDate)
                        : (habit.streak || 0) + 1
                    const longestStreak = Math.max(newStreak, habit.longest_streak || 0)
                    streakUpdate = { streak: newStreak, longest_streak: longestStreak }
                    shouldGrantXP = true
                    streakForMilestone = newStreak
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem(`streakGracePending_${habitId}`)
                    }
                }
            } else if (!isCompleted && existingLog?.completed) {
                if (requiredCount > 0 && completedCount === requiredCount - 1) {
                    shouldRevokeXP = true
                    if (isPastDate) {
                        const { start: curStart, end: curEnd } = getPeriodBounds(habit, today)
                        const currentComplete = await isPeriodComplete(habit, curStart, curEnd)
                        const anchorDate = currentComplete ? today : getPrevPeriodEndDate(habit, today)
                        const newStreak = await calculateStreakUpTo(habit, anchorDate)
                        streakUpdate = { streak: Math.max(0, newStreak) }
                    } else {
                        streakUpdate = { streak: Math.max(0, (habit.streak || 0) - 1) }
                    }
                }
            }
        } else {
            if (isCompleted && !existingLog?.completed) {
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(`streakGracePending_${habitId}`)
                }
                let newStreak
                if (isPastDate) {
                    const { data: latestCompleted } = await client
                        .from('habit_logs')
                        .select('date')
                        .eq('habit_id', habitId)
                        .eq('completed', true)
                        .order('date', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                    const anchorDate = latestCompleted?.date || targetDate
                    newStreak = await calculateStreakUpTo(habit, anchorDate)
                } else {
                    newStreak = (habit.streak || 0) + 1
                }
                const longestStreak = Math.max(newStreak, habit.longest_streak || 0)
                streakUpdate = { streak: newStreak, longest_streak: longestStreak }
                shouldGrantXP = true
                streakForMilestone = newStreak
            } else if (!isCompleted && existingLog?.completed) {
                shouldRevokeXP = true
                if (isPastDate) {
                    const { data: latestCompleted } = await client
                        .from('habit_logs')
                        .select('date')
                        .eq('habit_id', habitId)
                        .eq('completed', true)
                        .lte('date', today)
                        .order('date', { ascending: false })
                        .limit(1)
                        .maybeSingle()
                    const newStreak = latestCompleted?.date
                        ? await calculateStreakUpTo(habit, latestCompleted.date)
                        : 0
                    streakUpdate = { streak: Math.max(0, newStreak) }
                } else {
                    streakUpdate = { streak: Math.max(0, (habit.streak || 0) - 1) }
                }
            }
        }

        const habitUpdate = isPastDate
            ? { ...streakUpdate, updated_at: new Date().toISOString() }
            : { progress_count: newProgressCount, ...streakUpdate, updated_at: new Date().toISOString() }

        const { data: updatedHabit, error: habitError } = await client
            .from('habits')
            .update(habitUpdate)
            .eq('id', habitId)
            .select()

        if (habitError) {
            console.error('Error actualizando hábito:', habitError)
            throw habitError
        }

        if (!updatedHabit?.[0]) return null

        const enriched = await enrichHabitsWithCompletedDays([updatedHabit[0]])

        if (shouldGrantXP) {
            try {
                await grantXP('habit_completed')
                await checkStreakMilestone(streakForMilestone)
            } catch (xpError) {
                console.error('Error otorgando XP:', xpError)
            }
        }

        if (shouldRevokeXP) {
            try {
                await revokeXP('habit_completed')
            } catch (xpError) {
                console.error('Error revocando XP:', xpError)
            }
        }

        if (!isPastDate && isCompleted && !existingLog?.completed) {
            await checkAllHabitsDaily(getHabits, shouldShowHabitToday)
            await checkWeeklyGoalMet(getHabits)
        }

        if (!isPastDate && !isCompleted && existingLog?.completed) {
            await revokeAllHabitsDaily()
            await revokeWeeklyGoalXP()
        }

        if (isPastDate) {
            return { ...enriched[0], progress_count: newProgressCount }
        }

        return enriched[0]
    }

    const letterDayToNumber = (letterDay) => {
        const dayMap = {
            'D': 0,
            'L': 1,
            'M': 2,
            'X': 3,
            'J': 4,
            'V': 5,
            'S': 6
        }
        return dayMap[letterDay] !== undefined ? dayMap[letterDay] : -1
    }


    const letterDaysToNumbers = (letterDays) => {
        if (!Array.isArray(letterDays)) {
            return []
        }
        return letterDays.map(letterDayToNumber).filter(day => day !== -1)
    }

    const getHabitLogByDate = async (habitId, date) => {
        const { data, error } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .eq('date', date)
            .maybeSingle()

        if (error) {
            console.error('Error obteniendo log del hábito:', error)
            return null
        }

        return data
    }

    const argentineTodayAsDate = () => {
        const [year, month, day] = getArgentineDate().split('-').map(Number)
        return new Date(year, month - 1, day)
    }

    const getWeekStart = (date = argentineTodayAsDate()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const result = new Date(d.setDate(diff))
        return getDateString(result)
    }

    const getWeekEnd = (date = argentineTodayAsDate()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? 0 : 7)
        const result = new Date(d.setDate(diff))
        return getDateString(result)
    }

    const getWeekCompletedDays = async (habitId) => {
        const todayStr = getArgentineDate()
        const [year, month, day] = todayStr.split('-').map(Number)
        const today = new Date(year, month - 1, day)
        const weekStart = getWeekStart(today)
        const weekEnd = getWeekEnd(today)

        const { data: weekLogs } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .gte('date', weekStart)
            .lte('date', weekEnd)
            .eq('completed', true)

        return weekLogs?.length || 0
    }

    const getMonthCompletedDays = async (habitId) => {
        const todayStr = getArgentineDate()
        const [year, month] = todayStr.split('-').map(Number)
        const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        const { data: monthLogs } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .gte('date', monthStart)
            .lte('date', monthEnd)
            .eq('completed', true)

        return monthLogs?.length || 0
    }

    const enrichHabitsWithCompletedDays = async (habits) => {
        const enriched = await Promise.all(
            habits.map(async (habit) => {
                const enrichedHabit = { ...habit }

                if (habit.frequency_option === 'cantidad_dias_semana' || habit.frequency_option === 'dias_especificos_semana') {
                    enrichedHabit.weekCompletedDays = await getWeekCompletedDays(habit.id)
                } else if (habit.frequency_option === 'cantidad_dias_mes' || habit.frequency_option === 'dias_especificos_mes') {
                    enrichedHabit.monthCompletedDays = await getMonthCompletedDays(habit.id)
                }

                return enrichedHabit
            })
        )

        return enriched
    }

    const getDateString = (date) => {
        if (!date) return getArgentineDate()
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getYesterdayString = () => {
        const today = getArgentineDate()
        const [year, month, day] = today.split('-').map(Number)
        const yesterday = new Date(year, month - 1, day - 1)
        return getDateString(yesterday)
    }

    const getStreakCadence = (habit) => {
        if (habit.frequency_type === 'semanal') return 'weekly'
        if (habit.frequency_type === 'mensual') return 'monthly'
        return 'daily'
    }

    const getHabitPeriodGranularity = (habit) => {
        const o = habit.frequency_option
        if (habit.frequency_type === 'semanal' || o === 'cantidad_dias_semana' || o === 'dias_especificos_semana') return 'week'
        if (habit.frequency_type === 'mensual' || o === 'cantidad_dias_mes' || o === 'dias_especificos_mes') return 'month'
        return 'day'
    }

    const getGraceBreakMode = (habit) => {
        const cadence = getStreakCadence(habit)
        if (cadence === 'weekly') return 'week'
        if (cadence === 'monthly') return 'month'
        const o = habit.frequency_option
        if (o === 'cantidad_dias_semana') return 'week'
        if (o === 'cantidad_dias_mes') return 'month'
        return 'scheduled'
    }

    const isHabitScheduledOn = (habit, dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const dow = new Date(y, m - 1, d).getDay()
        switch (habit.frequency_option) {
            case 'dias_especificos_semana':
                return letterDaysToNumbers(habit.frequency_detail?.weekDays || []).includes(dow)
            case 'dias_especificos_mes':
                return (habit.frequency_detail?.monthDays || []).includes(d)
            default:
                return true
        }
    }

    const getPeriodBounds = (habit, dateStr) => {
        const gran = getHabitPeriodGranularity(habit)
        const [y, m, d] = dateStr.split('-').map(Number)
        if (gran === 'week') {
            const dObj = new Date(y, m - 1, d)
            return { start: getWeekStart(dObj), end: getWeekEnd(dObj) }
        }
        if (gran === 'month') {
            const lastDay = new Date(y, m, 0).getDate()
            return {
                start: `${y}-${String(m).padStart(2, '0')}-01`,
                end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
            }
        }
        return { start: dateStr, end: dateStr }
    }

    const getPeriodQuota = (habit, startDate) => {
        switch (habit.frequency_option) {
            case 'dias_especificos_semana':
                return habit.frequency_detail?.weekDays?.length || 0
            case 'dias_especificos_mes':
                return habit.frequency_detail?.monthDays?.length || 0
            case 'cantidad_dias_semana':
            case 'cantidad_dias_mes':
                return habit.frequency_detail?.counter || 0
            case 'todos':
            default:
                if (habit.frequency_type === 'semanal') return 7
                if (habit.frequency_type === 'mensual') {
                    const [y, m] = startDate.split('-').map(Number)
                    return new Date(y, m, 0).getDate()
                }
                return 1
        }
    }

    const getPrevPeriodEndDate = (habit, dateStr) => {
        const { start } = getPeriodBounds(habit, dateStr)
        const [y, m, d] = start.split('-').map(Number)
        return getDateString(new Date(y, m - 1, d - 1))
    }

    const findScheduledOnOrBefore = (habit, dateStr) => {
        let cur = dateStr
        for (let i = 0; i < 400; i++) {
            if (isHabitScheduledOn(habit, cur)) return cur
            const [y, m, d] = cur.split('-').map(Number)
            cur = getDateString(new Date(y, m - 1, d - 1))
        }
        return null
    }

    const findScheduledBefore = (habit, dateStr) => {
        const [y, m, d] = dateStr.split('-').map(Number)
        const prev = getDateString(new Date(y, m - 1, d - 1))
        return findScheduledOnOrBefore(habit, prev)
    }

    const isPeriodComplete = async (habit, startDate, endDate) => {
        const { data: logs, error } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habit.id)
            .gte('date', startDate)
            .lte('date', endDate)
            .eq('completed', true)

        if (error) {
            console.error('Error verificando período completo:', error)
            return false
        }

        let completedCount = logs?.length || 0
        if (typeof window !== 'undefined') {
            const forgivenDate = localStorage.getItem(`streakGraceForgiven_${habit.id}`)
            if (forgivenDate && forgivenDate >= startDate && forgivenDate <= endDate && !logs?.some(l => l.date === forgivenDate)) {
                completedCount += 1
            }
        }

        switch (habit.frequency_option) {
            case 'todos':
                if (habit.frequency_type === 'semanal') {
                    return completedCount >= 7
                } else if (habit.frequency_type === 'mensual') {
                    const [y, m] = startDate.split('-').map(Number)
                    const lastDay = new Date(y, m, 0).getDate()
                    return completedCount >= lastDay
                }
                return false

            case 'dias_especificos_semana':
            case 'dias_especificos_mes':
                const requiredDays = habit.frequency_detail?.weekDays?.length ||
                                    habit.frequency_detail?.monthDays?.length || 0
                return completedCount >= requiredDays

            case 'cantidad_dias_semana':
            case 'cantidad_dias_mes':
                const requiredCount = habit.frequency_detail?.counter || 0
                return completedCount >= requiredCount

            default:
                return false
        }
    }

    const calculateStreakUpTo = async (habit, dateStr) => {
        const cadence = getStreakCadence(habit)

        if (cadence === 'weekly') {
            const [y, m, d] = dateStr.split('-').map(Number)
            let cursor = new Date(y, m - 1, d)
            let streak = 0
            while (streak < 500) {
                const wStart = getWeekStart(cursor)
                const wEnd = getWeekEnd(cursor)
                if (!await isPeriodComplete(habit, wStart, wEnd)) break
                streak++
                const [wy, wm, wd] = wStart.split('-').map(Number)
                cursor = new Date(wy, wm - 1, wd - 1)
            }
            return streak
        }

        if (cadence === 'monthly') {
            const [y, m] = dateStr.split('-').map(Number)
            let yr = y, mo = m
            let streak = 0
            while (streak < 500) {
                const mStart = `${yr}-${String(mo).padStart(2, '0')}-01`
                const lastDay = new Date(yr, mo, 0).getDate()
                const mEnd = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                if (!await isPeriodComplete(habit, mStart, mEnd)) break
                streak++
                mo--
                if (mo === 0) { mo = 12; yr-- }
            }
            return streak
        }

        const { data: logs } = await client
            .from('habit_logs')
            .select('date')
            .eq('habit_id', habit.id)
            .eq('completed', true)
            .lte('date', dateStr)
            .order('date', { ascending: false })

        const completedDates = new Set((logs || []).map(l => l.date))
        if (typeof window !== 'undefined') {
            const forgivenDate = localStorage.getItem(`streakGraceForgiven_${habit.id}`)
            if (forgivenDate && forgivenDate <= dateStr) completedDates.add(forgivenDate)
        }
        if (completedDates.size === 0) return 0
        const earliest = [...completedDates].sort()[0]
        const option = habit.frequency_option

        if (option === 'cantidad_dias_semana' || option === 'cantidad_dias_mes') {
            const { start: curStart, end: curEnd } = getPeriodBounds(habit, dateStr)
            const curEndCapped = curEnd < dateStr ? curEnd : dateStr
            let streak = 0
            for (const dt of completedDates) {
                if (dt >= curStart && dt <= curEndCapped) streak++
            }
            let cursor = getPrevPeriodEndDate(habit, dateStr)
            let guard = 0
            while (streak < 500 && guard < 250) {
                guard++
                const { start: pStart, end: pEnd } = getPeriodBounds(habit, cursor)
                if (pEnd < earliest) break
                let completedInPeriod = 0
                for (const dt of completedDates) {
                    if (dt >= pStart && dt <= pEnd) completedInPeriod++
                }
                const quota = getPeriodQuota(habit, pStart)
                if (quota > 0 && completedInPeriod >= quota) {
                    streak += completedInPeriod
                    const [py, pm, pd] = pStart.split('-').map(Number)
                    cursor = getDateString(new Date(py, pm - 1, pd - 1))
                } else {
                    break
                }
            }
            return streak
        }

        const isSpecific = option === 'dias_especificos_semana' || option === 'dias_especificos_mes'
        let streak = 0
        let cur = dateStr
        let guard = 0
        while (guard < 1000) {
            guard++
            if (!isSpecific || isHabitScheduledOn(habit, cur)) {
                if (completedDates.has(cur)) {
                    streak++
                } else {
                    break
                }
            }
            const [cy, cm, cd] = cur.split('-').map(Number)
            cur = getDateString(new Date(cy, cm - 1, cd - 1))
            if (cur < earliest) break
        }
        return streak
    }

    const updateStreakForNewDay = async (habit) => {
        try {
            const todayStr = getArgentineDate()
            const currentMonth = todayStr.slice(0, 7)
            const graceAvailable = habit.streak_grace_used_month !== currentMonth
            const yesterday = getYesterdayString()

            const pendingKey = `streakGracePending_${habit.id}`
            const forgivenKey = `streakGraceForgiven_${habit.id}`
            const readLS = (k) => (typeof window !== 'undefined' ? localStorage.getItem(k) : null)
            const removeLS = (k) => { if (typeof window !== 'undefined') localStorage.removeItem(k) }
            const setLS = (k, v) => { if (typeof window !== 'undefined') localStorage.setItem(k, v) }

            const mode = getGraceBreakMode(habit)
            const periodBased = mode === 'week' || mode === 'month'

            let unitDate = null
            let unitSatisfied = false
            let gapIsOne = false

            if (periodBased) {
                const pToday = getPeriodBounds(habit, todayStr)
                const pYest = getPeriodBounds(habit, yesterday)
                if (pToday.start !== pYest.start) {
                    unitDate = yesterday
                    unitSatisfied = await isPeriodComplete(habit, pYest.start, pYest.end)
                    if (!unitSatisfied) {
                        const beforeEnd = getPrevPeriodEndDate(habit, yesterday)
                        const pBefore = getPeriodBounds(habit, beforeEnd)
                        gapIsOne = await isPeriodComplete(habit, pBefore.start, pBefore.end)
                    }
                }
            } else {
                const lastScheduled = findScheduledOnOrBefore(habit, yesterday)
                if (lastScheduled) {
                    unitDate = lastScheduled
                    const log = await getHabitLogByDate(habit.id, lastScheduled)
                    unitSatisfied = !!(log?.completed)
                    if (!unitSatisfied) {
                        const prevScheduled = findScheduledBefore(habit, lastScheduled)
                        if (prevScheduled) {
                            const plog = await getHabitLogByDate(habit.id, prevScheduled)
                            gapIsOne = !!(plog?.completed)
                        }
                    }
                }
            }

            const pendingRaw = readLS(pendingKey)
            if (pendingRaw) {
                let offeredForDate = null
                try { offeredForDate = JSON.parse(pendingRaw).offeredForDate } catch (e) { offeredForDate = null }
                const stillMissed = offeredForDate ? await isPeriodStillMissed(habit, offeredForDate) : false
                if (!stillMissed) {
                    removeLS(pendingKey)
                    removeLS(forgivenKey)
                    return
                }
                if (unitDate && unitDate !== offeredForDate) {
                    const fresh = await calculateStreakUpTo(habit, todayStr)
                    await updateHabit(habit.id, { streak: fresh })
                    removeLS(pendingKey)
                    removeLS(forgivenKey)
                }
                return
            }

            if (!unitDate) return

            if (unitSatisfied) {
                const forgiven = readLS(forgivenKey)
                if (forgiven && forgiven !== unitDate) removeLS(forgivenKey)
                return
            }

            const forgiven = readLS(forgivenKey)
            if (forgiven === unitDate) {
                return
            }

            if ((habit.streak || 0) > 0 && graceAvailable && gapIsOne) {
                setLS(pendingKey, JSON.stringify({ offeredForDate: unitDate }))
            } else {
                const fresh = await calculateStreakUpTo(habit, todayStr)
                await updateHabit(habit.id, { streak: fresh })
            }
        } catch (error) {
            console.error('Error actualizando racha:', error)
        }
    }

    const isPeriodStillMissed = async (habit, offeredForDate) => {
        const mode = getGraceBreakMode(habit)
        if (mode === 'week' || mode === 'month') {
            const { start, end } = getPeriodBounds(habit, offeredForDate)
            const complete = await isPeriodComplete(habit, start, end)
            return !complete
        }
        const log = await getHabitLogByDate(habit.id, offeredForDate)
        return !(log?.completed)
    }

    const applyStreakGrace = async (habitId) => {
        const currentMonth = getArgentineDate().slice(0, 7)
        await updateHabit(habitId, { streak_grace_used_month: currentMonth })
        if (typeof window !== 'undefined') {
            const pendingRaw = localStorage.getItem(`streakGracePending_${habitId}`)
            if (pendingRaw) {
                try {
                    const { offeredForDate } = JSON.parse(pendingRaw)
                    if (offeredForDate) localStorage.setItem(`streakGraceForgiven_${habitId}`, offeredForDate)
                } catch (e) {}
            }
            localStorage.removeItem(`streakGracePending_${habitId}`)
        }
    }

    const declineStreakGrace = async (habitId) => {
        await updateHabit(habitId, { streak: 0 })
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`streakGracePending_${habitId}`)
            localStorage.removeItem(`streakGraceForgiven_${habitId}`)
        }
    }

    const resetHabitsForNewDay = async () => {
        try {
            console.log('[RESET DIARIO] Iniciando reset de hábitos...')

            const habits = await getHabits()
            console.log('[RESET DIARIO] Hábitos obtenidos:', habits.length)

            for (const habit of habits) {
                console.log(`[RESET DIARIO] Reseteando "${habit.name}": ${habit.progress_count} → 0`)

                await updateHabit(habit.id, {
                    progress_count: 0,
                    updated_at: new Date().toISOString()
                })

                await updateStreakForNewDay(habit)
                console.log(`[RESET DIARIO] "${habit.name}" resetado correctamente`)
            }

            console.log('[RESET DIARIO] Reset completado exitosamente')

        } catch (error) {
            console.error('[RESET DIARIO] Error durante reset:', error)
            console.error('[RESET DIARIO] Stack:', error.stack)
        }
    }

    const shouldResetToday = async () => {
        if (typeof window === 'undefined') return false

        const today = getArgentineDate()
        const lastResetDate = localStorage.getItem('lastHabitResetDate')

        if (lastResetDate === today) return false

        localStorage.setItem('lastHabitResetDate', today)

        try {
            const userId = await getUserId()
            const { data: userHabits } = await client
                .from('habits')
                .select('id')
                .eq('user_id', userId)

            const habitIds = (userHabits || []).map(h => h.id)

            if (habitIds.length > 0) {
                const { data: todayLogs } = await client
                    .from('habit_logs')
                    .select('id')
                    .in('habit_id', habitIds)
                    .eq('date', today)
                    .limit(1)

                if (todayLogs && todayLogs.length > 0) {
                    console.log('[RESET DIARIO] Ya existen logs para hoy, omitiendo reset')
                    return false
                }
            }
        } catch (e) {
            console.error('[RESET DIARIO] Error verificando logs de hoy:', e)
        }

        console.log('[RESET DIARIO] Realizando reset del día')
        return true
    }

    const syncHabitsWithNewDay = async () => {
        if (await shouldResetToday()) {
            await resetHabitsForNewDay()
        }
    }

    const shouldShowHabitForDate = async (habit, dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const dateObj = new Date(year, month - 1, day)
        const dayOfWeek = dateObj.getDay()
        const dayOfMonth = dateObj.getDate()

        if (!habit.frequency_type) {
            return true
        }

        switch (habit.frequency_type) {
            case 'diario': {
                const option = habit.frequency_option || 'todos'
                if (option === 'dias_especificos_semana' || option === 'dias_especificos_mes') {
                    return isHabitScheduledOn(habit, dateStr)
                }
                if (option === 'cantidad_dias_semana' || option === 'cantidad_dias_mes') {
                    const { start, end } = getPeriodBounds(habit, dateStr)
                    const { data: periodLogs } = await client
                        .from('habit_logs')
                        .select('id')
                        .eq('habit_id', habit.id)
                        .gte('date', start)
                        .lte('date', end)
                        .eq('completed', true)
                    const completedCount = periodLogs?.length || 0
                    return completedCount < getPeriodQuota(habit, start)
                }
                return true
            }

            case 'semanal': {
                const weeklyOption = habit.frequency_option || 'todos'

                if (weeklyOption === 'todos') {
                    return true
                }

                if (weeklyOption === 'dias_especificos_semana') {
                    const selectedDays = habit.frequency_detail?.weekDays || []
                    const selectedDayNumbers = letterDaysToNumbers(selectedDays)
                    return selectedDayNumbers.includes(dayOfWeek)
                }

                if (weeklyOption === 'cantidad_dias_semana') {
                    const weekStart = getWeekStart(dateObj)
                    const weekEnd = getWeekEnd(dateObj)

                    const { data: weekLogs } = await client
                        .from('habit_logs')
                        .select('*')
                        .eq('habit_id', habit.id)
                        .gte('date', weekStart)
                        .lte('date', weekEnd)
                        .eq('completed', true)

                    const completedCount = weekLogs?.length || 0
                    const requiredCount = habit.frequency_detail?.counter || 0

                    return completedCount < requiredCount
                }

                return false
            }

            case 'mensual': {
                const monthlyOption = habit.frequency_option || 'todos'

                if (monthlyOption === 'todos') {
                    return true
                }

                if (monthlyOption === 'dias_especificos_mes') {
                    const selectedDays = habit.frequency_detail?.monthDays || []
                    return selectedDays.includes(dayOfMonth)
                }

                if (monthlyOption === 'cantidad_dias_mes') {
                    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
                    const lastDay = new Date(year, month, 0).getDate()
                    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

                    const { data: monthLogs } = await client
                        .from('habit_logs')
                        .select('*')
                        .eq('habit_id', habit.id)
                        .gte('date', monthStart)
                        .lte('date', monthEnd)
                        .eq('completed', true)

                    const completedCount = monthLogs?.length || 0
                    const requiredCount = habit.frequency_detail?.counter || 0

                    return completedCount < requiredCount
                }

                return false
            }

            default:
                return true
        }
    }

    const shouldShowHabitToday = (habit) => shouldShowHabitForDate(habit, getArgentineDate())

    return {
        createHabit,
        getHabits,
        getHabitsForDate,
        getHabitById,
        updateHabit,
        deleteHabit,
        logHabitProgress,
        shouldShowHabitToday,
        shouldShowHabitForDate,
        syncHabitsWithNewDay,
        getArgentineDate,
        applyStreakGrace,
        declineStreakGrace,
        isPeriodStillMissed
    }
}