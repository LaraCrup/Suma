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

        // Verificar si es el primer hábito creado para otorgar XP
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

        // Fetch all logs for this date in one batch query
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
            // habit_logs.value is the source of truth: it's never wiped by a daily reset
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

        // Override progress_count with the log value for the target date (habit_logs is source of truth)
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
        const isWeeklyPeriod = habit.frequency_type === 'semanal' || habit.frequency_option === 'cantidad_dias_semana' || habit.frequency_option === 'dias_especificos_semana'
        const isMonthlyPeriod = habit.frequency_type === 'mensual' || habit.frequency_option === 'cantidad_dias_mes' || habit.frequency_option === 'dias_especificos_mes'

        if (isWeeklyPeriod) {
            if (isCompleted && !existingLog?.completed) {
                const [y, m, d] = targetDate.split('-').map(Number)
                const todayDate = new Date(y, m - 1, d)
                const weekStart = getWeekStart(todayDate)
                const weekEnd = getWeekEnd(todayDate)

                const { data: weekLogs } = await client
                    .from('habit_logs')
                    .select('*')
                    .eq('habit_id', habitId)
                    .gte('date', weekStart)
                    .lte('date', weekEnd)
                    .eq('completed', true)

                const completedCount = weekLogs?.length || 0
                const requiredCount = habit.frequency_option === 'dias_especificos_semana'
                    ? (habit.frequency_detail?.weekDays?.length || 0)
                    : habit.frequency_option === 'todos'
                        ? 7
                        : (habit.frequency_detail?.counter || 0)

                if (completedCount === requiredCount) {
                    const newStreak = isPastDate
                        ? await calculateStreakUpTo(habit, targetDate)
                        : (habit.streak || 0) + 1
                    const longestStreak = Math.max(newStreak, habit.longest_streak || 0)
                    streakUpdate = { streak: newStreak, longest_streak: longestStreak }
                    shouldGrantXP = true
                    streakForMilestone = newStreak
                }
            } else if (!isCompleted && existingLog?.completed) {
                const [y, m, d] = targetDate.split('-').map(Number)
                const todayDate = new Date(y, m - 1, d)
                const weekStart = getWeekStart(todayDate)
                const weekEnd = getWeekEnd(todayDate)

                const { data: weekLogs } = await client
                    .from('habit_logs')
                    .select('*')
                    .eq('habit_id', habitId)
                    .gte('date', weekStart)
                    .lte('date', weekEnd)
                    .eq('completed', true)

                const completedCount = weekLogs?.length || 0
                const requiredCount = habit.frequency_option === 'dias_especificos_semana'
                    ? (habit.frequency_detail?.weekDays?.length || 0)
                    : habit.frequency_option === 'todos'
                        ? 7
                        : (habit.frequency_detail?.counter || 0)

                if (completedCount === requiredCount - 1) {
                    shouldRevokeXP = true
                    if (isPastDate) {
                        const [wsy, wsm, wsd] = weekStart.split('-').map(Number)
                        const dayBefore = new Date(wsy, wsm - 1, wsd - 1)
                        const prevEnd = `${dayBefore.getFullYear()}-${String(dayBefore.getMonth() + 1).padStart(2, '0')}-${String(dayBefore.getDate()).padStart(2, '0')}`
                        const newStreak = await calculateStreakUpTo(habit, prevEnd)
                        streakUpdate = { streak: Math.max(0, newStreak) }
                    } else {
                        streakUpdate = { streak: Math.max(0, (habit.streak || 0) - 1) }
                    }
                }
            }
        } else if (isMonthlyPeriod) {
            if (isCompleted && !existingLog?.completed) {
                const [y, m] = targetDate.split('-').map(Number)
                const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
                const lastDay = new Date(y, m, 0).getDate()
                const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

                const { data: monthLogs } = await client
                    .from('habit_logs')
                    .select('*')
                    .eq('habit_id', habitId)
                    .gte('date', monthStart)
                    .lte('date', monthEnd)
                    .eq('completed', true)

                const completedCount = monthLogs?.length || 0
                const requiredCount = habit.frequency_option === 'dias_especificos_mes'
                    ? (habit.frequency_detail?.monthDays?.length || 0)
                    : habit.frequency_option === 'todos'
                        ? lastDay
                        : (habit.frequency_detail?.counter || 0)

                if (completedCount === requiredCount) {
                    const newStreak = isPastDate
                        ? await calculateStreakUpTo(habit, targetDate)
                        : (habit.streak || 0) + 1
                    const longestStreak = Math.max(newStreak, habit.longest_streak || 0)
                    streakUpdate = { streak: newStreak, longest_streak: longestStreak }
                    shouldGrantXP = true
                    streakForMilestone = newStreak
                }
            } else if (!isCompleted && existingLog?.completed) {
                const [y, m] = targetDate.split('-').map(Number)
                const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
                const lastDay = new Date(y, m, 0).getDate()
                const monthEnd = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

                const { data: monthLogs } = await client
                    .from('habit_logs')
                    .select('*')
                    .eq('habit_id', habitId)
                    .gte('date', monthStart)
                    .lte('date', monthEnd)
                    .eq('completed', true)

                const completedCount = monthLogs?.length || 0
                const requiredCount = habit.frequency_option === 'dias_especificos_mes'
                    ? (habit.frequency_detail?.monthDays?.length || 0)
                    : habit.frequency_option === 'todos'
                        ? lastDay
                        : (habit.frequency_detail?.counter || 0)

                if (completedCount === requiredCount - 1) {
                    shouldRevokeXP = true
                    if (isPastDate) {
                        const lastDayPrevMonth = new Date(y, m - 1, 0)
                        const prevEnd = `${lastDayPrevMonth.getFullYear()}-${String(lastDayPrevMonth.getMonth() + 1).padStart(2, '0')}-${String(lastDayPrevMonth.getDate()).padStart(2, '0')}`
                        const newStreak = await calculateStreakUpTo(habit, prevEnd)
                        streakUpdate = { streak: Math.max(0, newStreak) }
                    } else {
                        streakUpdate = { streak: Math.max(0, (habit.streak || 0) - 1) }
                    }
                }
            }
        } else {
            // Racha diaria simple (frequency_option === 'todos' o default)
            if (isCompleted && !existingLog?.completed) {
                let newStreak
                if (isPastDate) {
                    // Completing a past gap: anchor from the most recent completed date
                    // (may be today or a day after targetDate, bridging the chain forward)
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
                    const [y, m, d] = targetDate.split('-').map(Number)
                    const prev = new Date(y, m - 1, d - 1)
                    const prevEnd = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
                    const newStreak = await calculateStreakUpTo(habit, prevEnd)
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

        // Otorgar XP y verificar milestones DESPUÉS de guardar la racha
        if (shouldGrantXP) {
            try {
                await grantXP('habit_completed')
                await checkStreakMilestone(streakForMilestone)
            } catch (xpError) {
                console.error('Error otorgando XP:', xpError)
            }
        }

        // Revocar XP si el hábito pasó de completado a no completado
        if (shouldRevokeXP) {
            try {
                await revokeXP('habit_completed')
            } catch (xpError) {
                console.error('Error revocando XP:', xpError)
            }
        }

        // Verificar si se completaron todos los hábitos del día (solo para hoy)
        if (!isPastDate && isCompleted && !existingLog?.completed) {
            await checkAllHabitsDaily(getHabits, shouldShowHabitToday)
            await checkWeeklyGoalMet(getHabits)
        }

        // Revocar bonos diario/semanal si se descompletó un hábito hoy
        if (!isPastDate && !isCompleted && existingLog?.completed) {
            await revokeAllHabitsDaily()
            await revokeWeeklyGoalXP()
        }

        // Para días pasados retornar objeto sintético con progress_count del log
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

    const getWeekStart = (date = new Date()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const result = new Date(d.setDate(diff))
        return getDateString(result)
    }

    const getWeekEnd = (date = new Date()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? 0 : 7)
        const result = new Date(d.setDate(diff))
        return getDateString(result)
    }

    const getArgentineDate = () => {
        const formatter = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
        const parts = formatter.formatToParts(new Date())
        const year = parts.find(p => p.type === 'year').value
        const month = parts.find(p => p.type === 'month').value
        const day = parts.find(p => p.type === 'day').value
        return `${year}-${month}-${day}`
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

    const getDateString = (date = new Date()) => {
        if (!date) return getArgentineDate()
        return date.toISOString().split('T')[0]
    }

    const getYesterdayString = () => {
        const today = getArgentineDate()
        const [year, month, day] = today.split('-').map(Number)
        const yesterday = new Date(year, month - 1, day - 1)
        return getDateString(yesterday)
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

        const completedCount = logs?.length || 0

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
        const isWeekly = habit.frequency_type === 'semanal' || habit.frequency_option === 'cantidad_dias_semana' || habit.frequency_option === 'dias_especificos_semana'
        const isMonthly = habit.frequency_type === 'mensual' || habit.frequency_option === 'cantidad_dias_mes' || habit.frequency_option === 'dias_especificos_mes'

        if (isWeekly) {
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

        if (isMonthly) {
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

        // Diario: obtener todos los logs completados ≤ dateStr y contar días consecutivos
        const { data: logs } = await client
            .from('habit_logs')
            .select('date')
            .eq('habit_id', habit.id)
            .eq('completed', true)
            .lte('date', dateStr)
            .order('date', { ascending: false })

        if (!logs || logs.length === 0) return 0

        const completedDates = new Set(logs.map(l => l.date))
        let streak = 0
        let cur = dateStr
        while (completedDates.has(cur)) {
            streak++
            const [cy, cm, cd] = cur.split('-').map(Number)
            const prev = new Date(cy, cm - 1, cd - 1)
            cur = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
        }
        return streak
    }

    const updateStreakForNewDay = async (habit) => {
        try {
            const todayStr = getArgentineDate()
            const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number)
            const today = new Date(todayYear, todayMonth - 1, todayDay)
            const dayOfWeek = today.getDay()
            const dayOfMonth = today.getDate()

            const isWeeklyPeriod = habit.frequency_type === 'semanal' || habit.frequency_option === 'cantidad_dias_semana' || habit.frequency_option === 'dias_especificos_semana'
            const isMonthlyPeriod = habit.frequency_type === 'mensual' || habit.frequency_option === 'cantidad_dias_mes' || habit.frequency_option === 'dias_especificos_mes'

            if (isWeeklyPeriod) {
                // Solo verificar los lunes
                if (dayOfWeek !== 1) return

                const yesterdayStr = getYesterdayString()
                const [yesterdayYear, yesterdayMonth, yesterdayDay] = yesterdayStr.split('-').map(Number)
                const yesterday = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay)

                const previousWeekStart = getWeekStart(yesterday)
                const previousWeekEnd = getWeekEnd(yesterday)

                const wasLastWeekComplete = await isPeriodComplete(habit, previousWeekStart, previousWeekEnd)

                if (!wasLastWeekComplete) {
                    await updateHabit(habit.id, { streak: 0 })
                }
                return
            }

            if (isMonthlyPeriod) {
                // Solo verificar el 1ro del mes
                if (dayOfMonth !== 1) return

                const yesterdayStr = getYesterdayString()
                const [yesterdayYear, yesterdayMonth, yesterdayDay] = yesterdayStr.split('-').map(Number)
                const yesterday = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay)

                const previousMonthNum = yesterday.getMonth() + 1
                const previousMonthYear = yesterday.getFullYear()

                const lastDay = new Date(previousMonthYear, previousMonthNum, 0).getDate()
                const previousMonthStart = `${previousMonthYear}-${String(previousMonthNum).padStart(2, '0')}-01`
                const previousMonthEnd = `${previousMonthYear}-${String(previousMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

                const wasLastMonthComplete = await isPeriodComplete(habit, previousMonthStart, previousMonthEnd)

                if (!wasLastMonthComplete) {
                    await updateHabit(habit.id, { streak: 0 })
                }
                return
            }

            // Racha diaria: verificar si se completó ayer
            const yesterday = getYesterdayString()
            const yesterdayLog = await getHabitLogByDate(habit.id, yesterday)
            const wasCompletedYesterday = yesterdayLog?.completed || false

            if (!wasCompletedYesterday) {
                await updateHabit(habit.id, { streak: 0 })
            }
        } catch (error) {
            console.error('Error actualizando racha:', error)
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

        // Esta sesión/dispositivo ya verificó hoy → no resetear
        if (lastResetDate === today) return false

        // Marcar inmediatamente (sincrónico) para evitar doble reset en llamadas concurrentes
        localStorage.setItem('lastHabitResetDate', today)

        // Si ya hay habit_logs para hoy, significa que otra sesión/dispositivo ya hizo el reset
        // y el usuario completó hábitos → no pisar ese progreso
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
            case 'diario':
                return true

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

            case 'flexible':
                return true

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
        enrichHabitsWithCompletedDays,
        getWeekCompletedDays,
        getMonthCompletedDays,
        getHabitLogByDate
    }
}