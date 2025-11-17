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
        shouldShowHabitToday
    }
}