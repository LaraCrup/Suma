export const useHabits = () => {
    const client = useSupabaseClient()


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

    const getHabitById = async (habitId) => {
        const { data, error } = await client
            .from('habits')
            .select('*')
            .eq('id', habitId)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (!data) return null

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

    const logHabitProgress = async (habitId, amount = 1) => {
        await getUserId()

        const habit = await getHabitById(habitId)
        if (!habit) {
            throw new Error('Hábito no encontrado')
        }

        let newProgressCount = (habit.progress_count || 0) + amount
        newProgressCount = Math.max(0, newProgressCount)
        newProgressCount = Math.min(newProgressCount, habit.goal_value || 1)

        const isCompleted = newProgressCount >= (habit.goal_value || 1)

        const today = getArgentineDate()

        const { data: existingLog, error: searchError } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .eq('date', today)
            .maybeSingle()

        if (searchError) {
            console.error('Error buscando log existente:', searchError)
            throw searchError
        }

        if (existingLog) {
            const { error: updateLogError } = await client
                .from('habit_logs')
                .update({
                    value: existingLog.value + amount,
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
                    date: today,
                    value: amount,
                    completed: isCompleted
                }])

            if (insertLogError) {
                console.error('Error creando log de hábito:', insertLogError)
                throw insertLogError
            }
        }

        let streakUpdate = {}
        if (habit.frequency_type === 'diario') {
            if (isCompleted && !existingLog?.completed) {
                const newStreak = (habit.streak || 0) + 1
                const longestStreak = Math.max(newStreak, habit.longest_streak || 0)
                streakUpdate = {
                    streak: newStreak,
                    longest_streak: longestStreak
                }
            } else if (!isCompleted && existingLog?.completed) {
                streakUpdate = {
                    streak: Math.max(0, (habit.streak || 0) - 1)
                }
            }
        }

        const { data: updatedHabit, error: habitError } = await client
            .from('habits')
            .update({
                progress_count: newProgressCount,
                ...streakUpdate,
                updated_at: new Date().toISOString()
            })
            .eq('id', habitId)
            .select()

        if (habitError) {
            console.error('Error actualizando hábito:', habitError)
            throw habitError
        }

        if (!updatedHabit?.[0]) return null

        const enriched = await enrichHabitsWithCompletedDays([updatedHabit[0]])
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

                if (habit.frequency_option === 'cantidad_dias_semana') {
                    enrichedHabit.weekCompletedDays = await getWeekCompletedDays(habit.id)
                } else if (habit.frequency_option === 'cantidad_dias_mes') {
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

    const updateStreakForNewDay = async (habit) => {
        try {
            const todayStr = getArgentineDate()
            const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number)
            const today = new Date(todayYear, todayMonth - 1, todayDay)
            const dayOfWeek = today.getDay()
            const dayOfMonth = today.getDate()

            if (habit.frequency_type === 'diario') {
                const yesterday = getYesterdayString()
                const shouldShowToday = await shouldShowHabitToday(habit)

                const yesterdayLog = await getHabitLogByDate(habit.id, yesterday)
                const wasCompletedYesterday = yesterdayLog?.completed || false

                let streakUpdate = {}

                if (shouldShowToday) {
                    if (!wasCompletedYesterday) {
                        // Solo resetear la racha si NO se completó ayer
                        // NO incrementar aquí, eso debe ocurrir cuando el usuario complete el hábito hoy
                        streakUpdate = {
                            streak: 0
                        }
                    }
                    // Si se completó ayer, mantener la racha actual (no hacer nada)
                }

                if (Object.keys(streakUpdate).length > 0) {
                    await updateHabit(habit.id, streakUpdate)
                }
                return
            }

            if (habit.frequency_type === 'semanal') {
                if (dayOfWeek !== 1) {
                    return
                }

                const yesterdayStr = getYesterdayString()
                const [yesterdayYear, yesterdayMonth, yesterdayDay] = yesterdayStr.split('-').map(Number)
                const yesterday = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay)

                const previousWeekStart = getWeekStart(yesterday)
                const previousWeekEnd = getWeekEnd(yesterday)

                const wasLastWeekComplete = await isPeriodComplete(habit, previousWeekStart, previousWeekEnd)

                let streakUpdate = {}

                if (wasLastWeekComplete) {
                    streakUpdate = {
                        streak: (habit.streak || 0) + 1
                    }
                } else {
                    streakUpdate = {
                        streak: 0
                    }
                }

                if (Object.keys(streakUpdate).length > 0) {
                    await updateHabit(habit.id, streakUpdate)
                }
                return
            }

            if (habit.frequency_type === 'mensual') {
                if (dayOfMonth !== 1) {
                    return
                }

                const yesterdayStr = getYesterdayString()
                const [yesterdayYear, yesterdayMonth, yesterdayDay] = yesterdayStr.split('-').map(Number)
                const yesterday = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay)

                const previousMonthNum = yesterday.getMonth() + 1
                const previousMonthYear = yesterday.getFullYear()

                const lastDay = new Date(previousMonthYear, previousMonthNum, 0).getDate()
                const previousMonthStart = `${previousMonthYear}-${String(previousMonthNum).padStart(2, '0')}-01`
                const previousMonthEnd = `${previousMonthYear}-${String(previousMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

                const wasLastMonthComplete = await isPeriodComplete(habit, previousMonthStart, previousMonthEnd)

                let streakUpdate = {}

                if (wasLastMonthComplete) {
                    streakUpdate = {
                        streak: (habit.streak || 0) + 1
                    }
                } else {
                    streakUpdate = {
                        streak: 0
                    }
                }

                if (Object.keys(streakUpdate).length > 0) {
                    await updateHabit(habit.id, streakUpdate)
                }
                return
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

    const shouldResetToday = () => {
        if (typeof window === 'undefined') return false

        const lastResetDate = localStorage.getItem('lastHabitResetDate')
        const today = getArgentineDate()

        console.log('[RESET DIARIO] lastResetDate:', lastResetDate)
        console.log('[RESET DIARIO] today:', today)
        console.log('[RESET DIARIO] Should reset?', !lastResetDate || lastResetDate !== today)

        if (!lastResetDate || lastResetDate !== today) {
            localStorage.setItem('lastHabitResetDate', today)
            return true
        }

        return false
    }

    const syncHabitsWithNewDay = async () => {
        if (shouldResetToday()) {
            await resetHabitsForNewDay()
        }
    }

    const shouldShowHabitToday = async (habit) => {
        const todayStr = getArgentineDate()
        const [year, month, day] = todayStr.split('-').map(Number)
        const today = new Date(year, month - 1, day)
        const dayOfWeek = today.getDay()
        const dayOfMonth = today.getDate()

        if (!habit.frequency_type) {
            return true
        }

        switch (habit.frequency_type) {
            case 'diario':
                return true

            case 'semanal':
                const weeklyOption = habit.frequency_option || 'todos'

                if (weeklyOption === 'todos') {
                    return true
                }

                if (weeklyOption === 'dias_especificos_semana') {
                    const selectedDays = habit.frequency_detail?.weekDays || []
                    const selectedDayNumbers = letterDaysToNumbers(selectedDays)
                    const shouldShow = selectedDayNumbers.includes(dayOfWeek)
                    return shouldShow
                }

                if (weeklyOption === 'cantidad_dias_semana') {
                    const weekStart = getWeekStart(today)
                    const weekEnd = getWeekEnd(today)

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

            case 'mensual':
                const monthlyOption = habit.frequency_option || 'todos'

                if (monthlyOption === 'todos') {
                    return true
                }

                if (monthlyOption === 'dias_especificos_mes') {
                    const selectedDays = habit.frequency_detail?.monthDays || []
                    const shouldShow = selectedDays.includes(dayOfMonth)
                    return shouldShow
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

            case 'flexible':
                return true

            default:
                return true
        }
    }

    return {
        createHabit,
        getHabits,
        getHabitById,
        updateHabit,
        deleteHabit,
        logHabitProgress,
        shouldShowHabitToday,
        syncHabitsWithNewDay,
        getArgentineDate,
        enrichHabitsWithCompletedDays,
        getWeekCompletedDays,
        getMonthCompletedDays
    }
}