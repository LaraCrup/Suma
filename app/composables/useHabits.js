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
            is_active: true,
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
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) {
            throw error
        }

        return data || []
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
     * Eliminar un hábito (soft delete)
     */
    const deleteHabit = async (habitId) => {
        const { error } = await client
            .from('habits')
            .update({ is_active: false })
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
        await getUserId() // Validar que el usuario está autenticado

        // Primero obtener el hábito actual
        const habit = await getHabitById(habitId)
        if (!habit) {
            throw new Error('Hábito no encontrado')
        }

        // Calcular nuevo progreso
        let newProgressCount = (habit.progress_count || 0) + amount
        newProgressCount = Math.max(0, newProgressCount) // No puede ser negativo
        newProgressCount = Math.min(newProgressCount, habit.goal_value || 1) // No puede superar la meta

        const isCompleted = newProgressCount >= (habit.goal_value || 1)

        // Actualizar el contador de progreso en habits
        const { data: updatedHabit, error: habitError } = await client
            .from('habits')
            .update({
                progress_count: newProgressCount,
                updated_at: new Date().toISOString()
            })
            .eq('id', habitId)
            .select()

        if (habitError) {
            console.error('Error actualizando hábito:', habitError)
            throw habitError
        }

        // Obtener la fecha de hoy en formato YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0]

        // Insertar log en habit_logs
        const { error: logError } = await client
            .from('habit_logs')
            .insert([{
                habit_id: habitId,
                date: today,
                value: amount,
                completed: isCompleted
            }])

        if (logError) {
            console.error('Error creando log de hábito:', logError)
            throw logError
        }

        return updatedHabit?.[0] || null
    }

    return {
        createHabit,
        getHabits,
        getHabitById,
        updateHabit,
        deleteHabit,
        logHabitProgress
    }
}