export const useHabits = () => {
    const client = useSupabaseClient()

    /**
     * Obtener el user_id de la sesión actual
     */
    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()

        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.')
        }

        return session.user.id
    }

    /**
     * Crear un nuevo hábito
     */
    const createHabit = async (habitData) => {
        const userId = await getUserId()

        const habitRecord = {
            user_id: userId,
            name: habitData.name,
            icon: habitData.icon,
            when_where: habitData.when_where || null,
            identity: habitData.identity || null,
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

    /**
     * Corrige combinaciones inválidas de frequency_type + frequency_option
     * Util cuando se cargan hábitos que tienen datos inconsistentes en la BD
     */
    const correctHabitFrequency = (habit) => {
        if (!habit) return habit

        const validOptionsPerType = {
            'diario': ['todos', 'dias_especificos_semana', 'cantidad_dias_semana', 'dias_especificos_mes', 'cantidad_dias_mes'],
            'semanal': ['todos', 'dias_especificos_semana'],
            'mensual': ['todos', 'dias_especificos_mes']
        }

        const type = habit.frequency_type
        const option = habit.frequency_option

        // Si la combinación es válida, devolver como está
        if (validOptionsPerType[type] && validOptionsPerType[type].includes(option)) {
            return habit
        }

        // Si no es válida, corregir
        let correctedType = type

        if (option === 'cantidad_dias_semana' || option === 'dias_especificos_semana') {
            if (option === 'cantidad_dias_semana') {
                correctedType = 'diario'
            }
        }

        if (option === 'cantidad_dias_mes' || option === 'dias_especificos_mes') {
            if (option === 'cantidad_dias_mes') {
                correctedType = 'diario'
            }
        }

        // Si cambió el tipo, actualizar en BD asincronamente
        if (correctedType !== type) {
            client
                .from('habits')
                .update({ frequency_type: correctedType })
                .eq('id', habit.id)
                .then(() => console.log(`[CORRECCIÓN FRECUENCIA OK] ${habit.name}: ${type} → ${correctedType}`))
                .catch(err => console.error(`[CORRECCIÓN FRECUENCIA ERROR] ${habit.name}:`, err))
        }

        return { ...habit, frequency_type: correctedType }
    }

    /**
     * Obtener todos los hábitos del usuario
     */
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

        const correctedData = (data || []).map(habit => correctHabitFrequency(habit))

        return correctedData
    }

    /**
     * Obtener un hábito por ID
     */
    const getHabitById = async (habitId) => {
        const { data, error } = await client
            .from('habits')
            .select('*')
            .eq('id', habitId)
            .maybeSingle()

        if (error) {
            throw error
        }

        if (data) {
            return correctHabitFrequency(data)
        }

        return data
    }

    /**
     * Actualizar un hábito
     */
    const updateHabit = async (habitId, updates) => {
        const { data, error } = await client
            .from('habits')
            .update(updates)
            .eq('id', habitId)
            .select()

        if (error) {
            throw error
        }

        return data?.[0] || null
    }

    /**
     * Eliminar un hábito (delete real)
     */
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

    /**
     * Registrar progreso en un hábito
     */
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
        // Solo actualizar racha para hábitos DIARIOS inmediatamente
        // Para hábitos SEMANALES y MENSUALES, la racha se actualiza en updateStreakForNewDay
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

        return updatedHabit?.[0] || null
    }

    /**
     * Convertir letra de día a número (0-6)
     * Correspondencia: D=0 (Domingo), L=1 (Lunes), M=2 (Martes), X=3 (Miércoles), J=4 (Jueves), V=5 (Viernes), S=6 (Sábado)
     */
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

    const getWeekNumber = (date = new Date()) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        const dayNum = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum)
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
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

    const hasWeekChanged = () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return getWeekNumber(today) !== getWeekNumber(yesterday)
    }

    const hasMonthChanged = () => {
        const todayStr = getArgentineDate()
        const yesterdayStr = getYesterdayString()
        const [, todayMonth] = todayStr.split('-').map(Number)
        const [, yesterdayMonth] = yesterdayStr.split('-').map(Number)
        return todayMonth !== yesterdayMonth
    }

    const getDayLetterFromDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const dayNum = date.getDay()
        const dayLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
        return dayLetters[dayNum]
    }

    const getWeekLogs = async (habitId, weekStartStr, weekEndStr) => {
        const { data, error } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .gte('date', weekStartStr)
            .lte('date', weekEndStr)

        if (error) {
            console.error('Error obteniendo logs de la semana:', error)
            return []
        }

        return data || []
    }

    const getMonthLogs = async (habitId, month, year) => {
        const startStr = `${year}-${String(month).padStart(2, '0')}-01`
        const lastDay = new Date(year, month, 0).getDate()
        const endStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

        const { data, error } = await client
            .from('habit_logs')
            .select('*')
            .eq('habit_id', habitId)
            .gte('date', startStr)
            .lte('date', endStr)

        if (error) {
            console.error('Error obteniendo logs del mes:', error)
            return []
        }

        return data || []
    }

    /**
     * Obtener la fecha actual en zona horaria de Argentina (UTC-3)
     */
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

    /**
     * Formato de fecha para comparación
     */
    const getDateString = (date = new Date()) => {
        if (!date) return getArgentineDate()
        return date.toISOString().split('T')[0]
    }

    /**
     * Obtener la fecha anterior en zona horaria de Argentina
     */
    const getYesterdayString = () => {
        const today = getArgentineDate()
        const [year, month, day] = today.split('-').map(Number)
        const yesterday = new Date(year, month - 1, day - 1)
        return getDateString(yesterday)
    }

    /**
     * Verificar si un período (semana/mes) está completo para un hábito
     * Compara los logs completados con el requisito del período
     */
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
                // Debe estar completado en TODOS los días específicos
                const requiredDays = habit.frequency_detail?.weekDays?.length ||
                                    habit.frequency_detail?.monthDays?.length || 0
                return completedCount >= requiredDays

            case 'cantidad_dias_semana':
            case 'cantidad_dias_mes':
                // Debe estar completado en la cantidad especificada de días
                const requiredCount = habit.frequency_detail?.counter || 0
                return completedCount >= requiredCount

            default:
                return false
        }
    }

    /**
     * Actualizar la racha al cambiar de período (semana/mes)
     * Lógica según tipo de frecuencia:
     * - DIARIO: compara día a día
     * - SEMANAL: compara semana a semana (incrementa cuando se completa la semana)
     * - MENSUAL: compara mes a mes (incrementa cuando se completa el mes)
     */
    const updateStreakForNewDay = async (habit) => {
        try {
            // Para hábitos diarios, usar lógica de día a día
            if (habit.frequency_type === 'diario') {
                const yesterday = getYesterdayString()
                const shouldShowToday = shouldShowHabitToday(habit)

                const yesterdayLog = await getHabitLogByDate(habit.id, yesterday)
                const wasCompletedYesterday = yesterdayLog?.completed || false

                let streakUpdate = {}

                if (shouldShowToday) {
                    if (wasCompletedYesterday) {
                        streakUpdate = {
                            streak: (habit.streak || 0) + 1
                        }
                    } else {
                        streakUpdate = {
                            streak: 0
                        }
                    }
                }

                if (Object.keys(streakUpdate).length > 0) {
                    await updateHabit(habit.id, streakUpdate)
                }
                return
            }

            if (habit.frequency_type === 'semanal') {
                const todayStr = getArgentineDate()
                const yesterdayStr = getYesterdayString()
                const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number)
                const today = new Date(todayYear, todayMonth - 1, todayDay)
                const [yesterdayYear, yesterdayMonth, yesterdayDay] = yesterdayStr.split('-').map(Number)
                const yesterday = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay)

                // Obtener la semana en la que está ayer (semana anterior a la actual)
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
                const yesterdayStr = getYesterdayString()
                const [yesterdayYear, yesterdayMonth, yesterdayDay] = yesterdayStr.split('-').map(Number)
                const yesterday = new Date(yesterdayYear, yesterdayMonth - 1, yesterdayDay)

                // Obtener mes anterior (mes en el que está ayer)
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

    const shouldShowHabitToday = (habit) => {
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
                    return true
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
                    return true
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
        resetHabitsForNewDay,
        updateStreakForNewDay,
        getHabitLogByDate,
        getDateString,
        getArgentineDate,
        getWeekStart,
        getWeekEnd,
        getWeekNumber,
        hasWeekChanged,
        hasMonthChanged,
        isPeriodComplete
    }
}