export const useExperience = () => {
    const client = useSupabaseClient()
    const authStore = useAuthStore()

    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()

        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.')
        }

        return session.user.id
    }

    /**
     * Obtiene la información de XP y nivel del usuario
     */
    const getUserExperience = async () => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('profiles')
            .select('experience_points, current_level')
            .eq('id', userId)
            .single()

        if (error) {
            console.error('Error obteniendo experiencia:', error)
            return { experience_points: 0, current_level: 1 }
        }

        return {
            experience_points: data?.experience_points || 0,
            current_level: data?.current_level || 1
        }
    }

    /**
     * Obtiene todos los niveles disponibles
     */
    const getLevels = async () => {
        const { data, error } = await client
            .from('levels')
            .select('*')
            .order('level_number', { ascending: true })

        if (error) {
            console.error('Error obteniendo niveles:', error)
            return []
        }

        return data || []
    }

    /**
     * Calcula el nivel basado en los puntos de experiencia
     */
    const calculateLevel = async (experiencePoints) => {
        const levels = await getLevels()

        if (levels.length === 0) return 1

        // Encuentra el nivel más alto que el usuario ha alcanzado
        const currentLevel = levels
            .reverse()
            .find(level => experiencePoints >= level.xp_required)

        return currentLevel?.level_number || 1
    }

    /**
     * Obtiene la información del nivel actual y siguiente
     */
    const getLevelInfo = async (experiencePoints) => {
        const levels = await getLevels()
        const currentLevelNumber = await calculateLevel(experiencePoints)

        const currentLevel = levels.find(l => l.level_number === currentLevelNumber)
        const nextLevel = levels.find(l => l.level_number === currentLevelNumber + 1)

        const currentLevelXP = currentLevel?.xp_required || 0
        const nextLevelXP = nextLevel?.xp_required || currentLevelXP

        // XP dentro del nivel actual
        const xpInCurrentLevel = experiencePoints - currentLevelXP
        const xpNeededForNextLevel = nextLevelXP - currentLevelXP

        return {
            currentLevel: currentLevelNumber,
            nextLevel: nextLevel?.level_number || currentLevelNumber,
            currentLevelXP,
            nextLevelXP,
            xpInCurrentLevel,
            xpNeededForNextLevel,
            progressPercentage: xpNeededForNextLevel > 0
                ? Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100)
                : 100,
            isMaxLevel: !nextLevel
        }
    }

    /**
     * Obtiene el valor de XP de una acción
     */
    const getXPForAction = async (actionKey) => {
        const { data, error } = await client
            .from('xp_actions')
            .select('xp_value')
            .eq('action_key', actionKey)
            .eq('active', true)
            .single()

        if (error) {
            console.error(`Error obteniendo XP para acción ${actionKey}:`, error)
            return 0
        }

        return data?.xp_value || 0
    }

    /**
     * Otorga XP al usuario y actualiza su nivel
     */
    const grantXP = async (actionKey, customAmount = null) => {
        try {
            const userId = await getUserId()

            // Obtener XP a otorgar
            const xpToGrant = customAmount !== null
                ? customAmount
                : await getXPForAction(actionKey)

            if (xpToGrant <= 0) {
                console.warn(`No se otorgó XP: acción ${actionKey} tiene 0 puntos o no existe`)
                return null
            }

            // Obtener experiencia actual
            const currentExp = await getUserExperience()
            const newXP = currentExp.experience_points + xpToGrant

            // Calcular nuevo nivel
            const newLevel = await calculateLevel(newXP)

            // Actualizar en base de datos
            const { data, error } = await client
                .from('profiles')
                .update({
                    experience_points: newXP,
                    current_level: newLevel
                })
                .eq('id', userId)
                .select('experience_points, current_level')
                .single()

            if (error) {
                console.error('Error otorgando XP:', error)
                throw error
            }

            // Actualizar el store de auth para reflejar los cambios
            if (authStore.profile) {
                authStore.profile.experience_points = newXP
                authStore.profile.current_level = newLevel
            }

            // Detectar si subió de nivel
            const leveledUp = newLevel > currentExp.current_level

            console.log(`[XP] +${xpToGrant} XP por "${actionKey}" | Total: ${newXP} XP | Nivel: ${newLevel}`)

            return {
                xpGranted: xpToGrant,
                totalXP: newXP,
                currentLevel: newLevel,
                previousLevel: currentExp.current_level,
                leveledUp
            }

        } catch (error) {
            console.error('Error en grantXP:', error)
            return null
        }
    }

    /**
     * Verifica si el usuario alcanzó un milestone de racha y otorga XP
     */
    const checkStreakMilestone = async (streak) => {
        const milestones = [
            { days: 7, key: 'streak_7' },
            { days: 14, key: 'streak_14' },
            { days: 30, key: 'streak_30' }
        ]

        const milestone = milestones.find(m => m.days === streak)
        if (milestone) {
            return await grantXP(milestone.key)
        }
        return null
    }

    /**
     * Verifica si el usuario volvió después de inactividad (comeback)
     * Se considera comeback si pasaron 3+ días sin completar ningún hábito
     */
    const checkComeback = async () => {
        try {
            const userId = await getUserId()

            // Evitar otorgar comeback más de una vez por sesión
            if (typeof window !== 'undefined') {
                const today = new Intl.DateTimeFormat('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    year: 'numeric', month: '2-digit', day: '2-digit'
                }).formatToParts(new Date())
                const todayStr = `${today.find(p => p.type === 'year').value}-${today.find(p => p.type === 'month').value}-${today.find(p => p.type === 'day').value}`

                const lastComebackCheck = localStorage.getItem('lastComebackCheck')
                if (lastComebackCheck === todayStr) return null
                localStorage.setItem('lastComebackCheck', todayStr)
            }

            // Buscar el log más reciente del usuario
            const { data: habits } = await client
                .from('habits')
                .select('id')
                .eq('user_id', userId)

            if (!habits || habits.length === 0) return null

            const habitIds = habits.map(h => h.id)

            const { data: lastLog } = await client
                .from('habit_logs')
                .select('date')
                .in('habit_id', habitIds)
                .order('date', { ascending: false })
                .limit(1)
                .maybeSingle()

            if (!lastLog) return null

            // Calcular días de inactividad
            const lastDate = new Date(lastLog.date + 'T12:00:00')
            const now = new Date()
            const diffDays = Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))

            if (diffDays >= 3) {
                console.log(`[XP] Comeback detectado: ${diffDays} días de inactividad`)
                return await grantXP('comeback')
            }

            return null
        } catch (error) {
            console.error('Error verificando comeback:', error)
            return null
        }
    }

    /**
     * Verifica si se completaron todos los hábitos del día
     */
    const checkAllHabitsDaily = async (getHabits, shouldShowHabitToday) => {
        try {
            const habits = await getHabits()
            if (habits.length === 0) return null

            // Filtrar solo los hábitos que corresponden a hoy
            const todayHabits = []
            for (const habit of habits) {
                const showToday = await shouldShowHabitToday(habit)
                if (showToday) todayHabits.push(habit)
            }

            if (todayHabits.length === 0) return null

            // Verificar que todos estén completados
            const allCompleted = todayHabits.every(h => h.progress_count >= (h.goal_value || 1))

            if (allCompleted) {
                // Evitar otorgar más de una vez por día
                if (typeof window !== 'undefined') {
                    const today = new Intl.DateTimeFormat('es-AR', {
                        timeZone: 'America/Argentina/Buenos_Aires',
                        year: 'numeric', month: '2-digit', day: '2-digit'
                    }).formatToParts(new Date())
                    const todayStr = `${today.find(p => p.type === 'year').value}-${today.find(p => p.type === 'month').value}-${today.find(p => p.type === 'day').value}`

                    const lastAllDaily = localStorage.getItem('lastAllHabitsDailyXP')
                    if (lastAllDaily === todayStr) return null
                    localStorage.setItem('lastAllHabitsDailyXP', todayStr)
                }

                console.log('[XP] Todos los hábitos del día completados!')
                return await grantXP('all_habits_daily')
            }

            return null
        } catch (error) {
            console.error('Error verificando all_habits_daily:', error)
            return null
        }
    }

    /**
     * Verifica si es el primer hábito creado y otorga XP
     */
    const checkFirstHabitCreated = async () => {
        try {
            const userId = await getUserId()

            const { count, error } = await client
                .from('habits')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)

            if (error) {
                console.error('Error verificando primer hábito:', error)
                return null
            }

            // count === 1 significa que recién se creó el primero
            if (count === 1) {
                console.log('[XP] Primer hábito creado!')
                return await grantXP('first_habit_created')
            }

            return null
        } catch (error) {
            console.error('Error en checkFirstHabitCreated:', error)
            return null
        }
    }

    /**
     * Verifica si se cumplió la meta semanal (todos los hábitos semanales cumplidos)
     */
    const checkWeeklyGoalMet = async (getHabits) => {
        try {
            const habits = await getHabits()
            const weeklyHabits = habits.filter(h =>
                h.frequency_option === 'cantidad_dias_semana' ||
                h.frequency_option === 'dias_especificos_semana'
            )

            if (weeklyHabits.length === 0) return null

            // Verificar que todos los hábitos semanales cumplieron su meta esta semana
            const allWeeklyMet = weeklyHabits.every(h => {
                const required = h.frequency_option === 'dias_especificos_semana'
                    ? (h.frequency_detail?.weekDays?.length || 0)
                    : (h.frequency_detail?.counter || 0)
                return (h.weekCompletedDays || 0) >= required
            })

            if (allWeeklyMet) {
                // Evitar otorgar más de una vez por semana
                if (typeof window !== 'undefined') {
                    const now = new Date()
                    const weekNum = `${now.getFullYear()}-W${Math.ceil(((now - new Date(now.getFullYear(), 0, 1)) / 86400000 + 1) / 7)}`
                    const lastWeeklyGoal = localStorage.getItem('lastWeeklyGoalXP')
                    if (lastWeeklyGoal === weekNum) return null
                    localStorage.setItem('lastWeeklyGoalXP', weekNum)
                }

                console.log('[XP] Meta semanal cumplida!')
                return await grantXP('weekly_goal_met')
            }

            return null
        } catch (error) {
            console.error('Error verificando weekly_goal_met:', error)
            return null
        }
    }

    return {
        getUserExperience,
        getLevels,
        calculateLevel,
        getLevelInfo,
        getXPForAction,
        grantXP,
        checkStreakMilestone,
        checkComeback,
        checkAllHabitsDaily,
        checkFirstHabitCreated,
        checkWeeklyGoalMet
    }
}
