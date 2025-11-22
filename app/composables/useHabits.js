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

        console.log('Creando hábito con:', habitRecord)

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

        const migratedData = (data || []).map(habit => {
            if (habit.frequency_type === 'diario' && habit.frequency_option) {
                const option = habit.frequency_option.toLowerCase()

                if (option.includes('semana')) {
                    console.log(`[MIGRACIÓN] Corrigiendo ${habit.name}: frequency_type diario -> semanal`)
                    client
                        .from('habits')
                        .update({ frequency_type: 'semanal' })
                        .eq('id', habit.id)
                        .then(() => console.log(`[MIGRACIÓN OK] ${habit.name}`))
                        .catch(err => console.error(`[MIGRACIÓN ERROR] ${habit.name}:`, err))
                    return { ...habit, frequency_type: 'semanal' }
                }

                if (option.includes('mes')) {
                    console.log(`[MIGRACIÓN] Corrigiendo ${habit.name}: frequency_type diario -> mensual`)
                    client
                        .from('habits')
                        .update({ frequency_type: 'mensual' })
                        .eq('id', habit.id)
                        .then(() => console.log(`[MIGRACIÓN OK] ${habit.name}`))
                        .catch(err => console.error(`[MIGRACIÓN ERROR] ${habit.name}:`, err))
                    return { ...habit, frequency_type: 'mensual' }
                }
            }
            return habit
        })

        return migratedData
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

        if (data && data.frequency_type === 'diario' && data.frequency_option) {
            const option = data.frequency_option.toLowerCase()

            if (option.includes('semana')) {
                console.log(`[MIGRACIÓN] Corrigiendo ${data.name}: frequency_type diario -> semanal`)
                client
                    .from('habits')
                    .update({ frequency_type: 'semanal' })
                    .eq('id', habitId)
                    .then(() => console.log(`[MIGRACIÓN OK] ${data.name}`))
                    .catch(err => console.error(`[MIGRACIÓN ERROR] ${data.name}:`, err))
                return { ...data, frequency_type: 'semanal' }
            }

            if (option.includes('mes')) {
                console.log(`[MIGRACIÓN] Corrigiendo ${data.name}: frequency_type diario -> mensual`)
                client
                    .from('habits')
                    .update({ frequency_type: 'mensual' })
                    .eq('id', habitId)
                    .then(() => console.log(`[MIGRACIÓN OK] ${data.name}`))
                    .catch(err => console.error(`[MIGRACIÓN ERROR] ${data.name}:`, err))
                return { ...data, frequency_type: 'mensual' }
            }
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

        const today = new Date().toISOString().split('T')[0]

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

    /**
     * Convertir array de letras de días a números (0-6)
     */
    const letterDaysToNumbers = (letterDays) => {
        if (!Array.isArray(letterDays)) {
            return []
        }
        return letterDays.map(letterDayToNumber).filter(day => day !== -1)
    }

    /**
     * Obtener log del hábito para una fecha específica
     */
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

    /**
     * Obtener número de semana ISO
     */
    const getWeekNumber = (date = new Date()) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
        const dayNum = d.getUTCDay() || 7
        d.setUTCDate(d.getUTCDate() + 4 - dayNum)
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    }

    /**
     * Obtener fecha de inicio de la semana (lunes)
     */
    const getWeekStart = (date = new Date()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? -6 : 1)
        const result = new Date(d.setDate(diff))
        return getDateString(result)
    }

    /**
     * Obtener fecha de fin de la semana (domingo)
     */
    const getWeekEnd = (date = new Date()) => {
        const d = new Date(date)
        const day = d.getDay()
        const diff = d.getDate() - day + (day === 0 ? 0 : 7)
        const result = new Date(d.setDate(diff))
        return getDateString(result)
    }

    /**
     * Verificar si cambió de semana comparando con ayer
     */
    const hasWeekChanged = () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return getWeekNumber(today) !== getWeekNumber(yesterday)
    }

    /**
     * Verificar si cambió de mes comparando con ayer
     */
    const hasMonthChanged = () => {
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)
        return today.getMonth() !== yesterday.getMonth()
    }

    /**
     * Obtener letra del día desde una fecha (YYYY-MM-DD)
     */
    const getDayLetterFromDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const dayNum = date.getDay()
        const dayLetters = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
        return dayLetters[dayNum]
    }

    /**
     * Obtener logs del hábito para una semana específica
     */
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

    /**
     * Obtener logs del hábito para un mes específico
     */
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
     * Formato de fecha para comparación
     */
    const getDateString = (date = new Date()) => {
        return date.toISOString().split('T')[0]
    }

    /**
     * Obtener la fecha anterior
     */
    const getYesterdayString = () => {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
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
                        console.log(`[RACHA] ${habit.name}: Continuando racha (${habit.streak} → ${(habit.streak || 0) + 1})`)
                    } else {
                        streakUpdate = {
                            streak: 0
                        }
                        console.log(`[RACHA] ${habit.name}: Reiniciando racha (no se completó ayer)`)
                    }
                }

                if (Object.keys(streakUpdate).length > 0) {
                    await updateHabit(habit.id, streakUpdate)
                }
                return
            }

            // Para hábitos semanales/mensuales, comparar periodos
            if (habit.frequency_type === 'semanal') {
                // Obtener semana actual y anterior
                const today = new Date()
                const lastWeek = new Date(today)
                lastWeek.setDate(lastWeek.getDate() - 7)

                const lastWeekStart = getWeekStart(lastWeek)
                const lastWeekEnd = getWeekEnd(lastWeek)

                // Verificar si la semana anterior estaba completa
                const wasLastWeekComplete = await isPeriodComplete(habit, lastWeekStart, lastWeekEnd)

                let streakUpdate = {}

                if (wasLastWeekComplete) {
                    streakUpdate = {
                        streak: (habit.streak || 0) + 1
                    }
                    console.log(`[RACHA] ${habit.name}: Semana completa, racha aumenta (${habit.streak} → ${(habit.streak || 0) + 1})`)
                } else {
                    streakUpdate = {
                        streak: 0
                    }
                    console.log(`[RACHA] ${habit.name}: Semana anterior incompleta, racha reinicia`)
                }

                if (Object.keys(streakUpdate).length > 0) {
                    await updateHabit(habit.id, streakUpdate)
                }
                return
            }

            if (habit.frequency_type === 'mensual') {
                // Obtener mes actual y anterior
                const today = new Date()
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

                const lastMonthNum = lastMonth.getMonth() + 1
                const lastMonthYear = lastMonth.getFullYear()

                const lastDay = new Date(lastMonthYear, lastMonthNum, 0).getDate()
                const lastMonthStart = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-01`
                const lastMonthEnd = `${lastMonthYear}-${String(lastMonthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

                // Verificar si el mes anterior estaba completo
                const wasLastMonthComplete = await isPeriodComplete(habit, lastMonthStart, lastMonthEnd)

                let streakUpdate = {}

                if (wasLastMonthComplete) {
                    streakUpdate = {
                        streak: (habit.streak || 0) + 1
                    }
                    console.log(`[RACHA] ${habit.name}: Mes completo, racha aumenta (${habit.streak} → ${(habit.streak || 0) + 1})`)
                } else {
                    streakUpdate = {
                        streak: 0
                    }
                    console.log(`[RACHA] ${habit.name}: Mes anterior incompleto, racha reinicia`)
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

    /**
     * Reset automático de hábitos para el nuevo día
     * - Reseta progress_count a 0 para todos los hábitos
     * - Actualiza la racha basándose en la frecuencia
     * - Se ejecuta una vez por día cuando la app detecta un cambio de fecha
     */
    const resetHabitsForNewDay = async () => {
        try {
            console.log('[RESET DIARIO] Iniciando reset de hábitos para nuevo día')

            const habits = await getHabits()

            for (const habit of habits) {
                // 1. Reseta progress_count a 0
                await updateHabit(habit.id, {
                    progress_count: 0,
                    updated_at: new Date().toISOString()
                })

                // 2. Actualiza la racha basándose en si se completó ayer y si debe mostrarse hoy
                await updateStreakForNewDay(habit)

                console.log(`[RESET DIARIO] ${habit.name} reseteado correctamente`)
            }

            console.log('[RESET DIARIO] Reset completado exitosamente')
        } catch (error) {
            console.error('[RESET DIARIO] Error durante reset:', error)
        }
    }

    /**
     * Verificar si debe ejecutarse el reset diario
     * Compara la fecha almacenada en localStorage con la fecha actual
     */
    const shouldResetToday = () => {
        if (typeof window === 'undefined') return false

        const lastResetDate = localStorage.getItem('lastHabitResetDate')
        const today = getDateString()

        if (!lastResetDate || lastResetDate !== today) {
            localStorage.setItem('lastHabitResetDate', today)
            return true
        }

        return false
    }

    /**
     * Sincronizar hábitos con el nuevo día (si es necesario)
     * Se ejecuta cuando la app inicializa o se trae al foreground
     */
    const syncHabitsWithNewDay = async () => {
        if (shouldResetToday()) {
            await resetHabitsForNewDay()
        }
    }

    /**
     * Determinar si un hábito debe mostrarse hoy basado en su frecuencia
     */
    const shouldShowHabitToday = (habit) => {
        console.log('Validando hábito:', {
            name: habit.name,
            frequency_type: habit.frequency_type,
            frequency_option: habit.frequency_option,
            frequency_detail: habit.frequency_detail,
            dayOfWeek: new Date().getDay()
        })

        const today = new Date()
        const dayOfWeek = today.getDay()
        const dayOfMonth = today.getDate()

        if (!habit.frequency_type) {
            console.log('No hay frequency_type, mostrando hábito')
            return true
        }

        switch (habit.frequency_type) {
            case 'diario':
                console.log('Hábito diario, mostrando')
                return true

            case 'semanal':
                const weeklyOption = habit.frequency_option || 'todos'

                if (weeklyOption === 'todos') {
                    console.log('Opción semanal: todos los días')
                    return true
                }

                if (weeklyOption === 'dias_especificos_semana') {
                    const selectedDays = habit.frequency_detail?.weekDays || []
                    console.log('Días específicos seleccionados:', selectedDays, 'Día actual:', dayOfWeek)

                    const selectedDayNumbers = letterDaysToNumbers(selectedDays)
                    console.log('Números de días convertidos:', selectedDayNumbers)

                    const shouldShow = selectedDayNumbers.includes(dayOfWeek)
                    console.log('¿Mostrar hábito?', shouldShow)
                    return shouldShow
                }

                if (weeklyOption === 'cantidad_dias_semana') {
                    console.log('Opción semanal: cantidad de días')
                    return true
                }

                console.log('Opción semanal desconocida:', weeklyOption)
                return false

            case 'mensual':
                const monthlyOption = habit.frequency_option || 'todos'

                if (monthlyOption === 'todos') {
                    console.log('Opción mensual: todos los días')
                    return true
                }

                if (monthlyOption === 'dias_especificos_mes') {
                    const selectedDays = habit.frequency_detail?.monthDays || []
                    console.log('Días del mes seleccionados:', selectedDays, 'Día del mes actual:', dayOfMonth)

                    const shouldShow = selectedDays.includes(dayOfMonth)
                    console.log('¿Mostrar hábito?', shouldShow)
                    return shouldShow
                }

                if (monthlyOption === 'cantidad_dias_mes') {
                    console.log('Opción mensual: cantidad de días')
                    return true
                }

                console.log('Opción mensual desconocida:', monthlyOption)
                return false

            case 'flexible':
                console.log('Hábito flexible, mostrando')
                return true

            default:
                console.log('frequency_type desconocido:', habit.frequency_type)
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
        getWeekStart,
        getWeekEnd,
        getWeekNumber,
        hasWeekChanged,
        hasMonthChanged,
        isPeriodComplete
    }
}