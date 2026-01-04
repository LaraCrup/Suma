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
     * Verifica si el usuario alcanzó una racha de 7 días y otorga XP
     */
    const checkStreakMilestone = async (streak) => {
        if (streak === 7) {
            return await grantXP('streak_7')
        }
        return null
    }

    return {
        getUserExperience,
        getLevels,
        calculateLevel,
        getLevelInfo,
        getXPForAction,
        grantXP,
        checkStreakMilestone
    }
}
