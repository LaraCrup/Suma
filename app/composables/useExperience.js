export const useExperience = () => {
    const client = useSupabaseClient()
    const authStore = useAuthStore()
    const xpNotificationStore = useXpNotificationStore()

    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()

        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.')
        }

        return session.user.id
    }

    const getWeekKey = () => {
        const [year, month, day] = getArgentineDate().split('-').map(Number)
        const date = new Date(year, month - 1, day)
        const dow = date.getDay()
        const diff = date.getDate() - dow + (dow === 0 ? -6 : 1)
        const monday = new Date(date.getFullYear(), date.getMonth(), diff)
        return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
    }

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

    const calculateLevel = async (experiencePoints) => {
        const levels = await getLevels()

        if (levels.length === 0) return 1

        const currentLevel = levels
            .reverse()
            .find(level => experiencePoints >= level.xp_required)

        return currentLevel?.level_number || 1
    }

    const getLevelInfo = async (experiencePoints) => {
        const levels = await getLevels()
        const currentLevelNumber = await calculateLevel(experiencePoints)

        const currentLevel = levels.find(l => l.level_number === currentLevelNumber)
        const nextLevel = levels.find(l => l.level_number === currentLevelNumber + 1)

        const currentLevelXP = currentLevel?.xp_required || 0
        const nextLevelXP = nextLevel?.xp_required || currentLevelXP

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

    const grantXP = async (actionKey, customAmount = null) => {
        try {
            const userId = await getUserId()

            const xpToGrant = customAmount !== null
                ? customAmount
                : await getXPForAction(actionKey)

            if (xpToGrant <= 0) {
                console.warn(`No se otorgó XP: acción ${actionKey} tiene 0 puntos o no existe`)
                return null
            }

            const currentXP = authStore.profile?.experience_points ?? (await getUserExperience()).experience_points
            const currentLevel = authStore.profile?.current_level ?? (await getUserExperience()).current_level
            const newXP = currentXP + xpToGrant

            const newLevel = await calculateLevel(newXP)

            if (authStore.profile) {
                authStore.profile.experience_points = newXP
                authStore.profile.current_level = newLevel
            }

            const { error } = await client
                .from('profiles')
                .update({
                    experience_points: newXP,
                    current_level: newLevel
                })
                .eq('id', userId)

            if (error) {
                if (authStore.profile) {
                    authStore.profile.experience_points = currentXP
                    authStore.profile.current_level = currentLevel
                }
                console.error('Error otorgando XP:', error)
                throw error
            }

            const leveledUp = newLevel > currentLevel

            console.log(`[XP] +${xpToGrant} XP por "${actionKey}" | Total: ${newXP} XP | Nivel: ${newLevel}`)

            xpNotificationStore.enqueue(xpToGrant, actionKey)
            if (leveledUp) xpNotificationStore.enqueueLevelUp(newLevel)

            return {
                xpGranted: xpToGrant,
                totalXP: newXP,
                currentLevel: newLevel,
                previousLevel: currentLevel,
                leveledUp
            }

        } catch (error) {
            console.error('Error en grantXP:', error)
            return null
        }
    }

    const checkStreakMilestone = async (streak) => {
        const milestones = [
            { days: 7, key: 'streak_7' },
            { days: 14, key: 'streak_14' },
            { days: 30, key: 'streak_30' },
            { days: 60, key: 'streak_60' },
            { days: 100, key: 'streak_100' },
        ]

        const milestone = milestones.find(m => m.days === streak)
        if (milestone) {
            return await grantXP(milestone.key)
        }
        return null
    }

    const checkComeback = async () => {
        try {
            const userId = await getUserId()

            if (typeof window !== 'undefined') {
                const todayStr = getArgentineDate()

                const lastComebackCheck = localStorage.getItem('lastComebackCheck')
                if (lastComebackCheck === todayStr) return null
                localStorage.setItem('lastComebackCheck', todayStr)
            }

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

    const checkAllHabitsDaily = async (getHabits, shouldShowHabitToday) => {
        try {
            const habits = await getHabits()
            if (habits.length === 0) return null

            const todayHabits = []
            for (const habit of habits) {
                const showToday = await shouldShowHabitToday(habit)
                if (showToday) todayHabits.push(habit)
            }

            if (todayHabits.length === 0) return null

            const allCompleted = todayHabits.every(h => h.progress_count >= (h.goal_value || 1))

            if (allCompleted) {
                if (typeof window !== 'undefined') {
                    const todayStr = getArgentineDate()

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

            if (count === 1) {
                const guardKey = `firstHabitXP_${userId}`
                if (typeof window !== 'undefined') {
                    if (localStorage.getItem(guardKey)) return null
                    localStorage.setItem(guardKey, '1')
                }
                console.log('[XP] Primer hábito creado!')
                return await grantXP('first_habit_created')
            }

            return null
        } catch (error) {
            console.error('Error en checkFirstHabitCreated:', error)
            return null
        }
    }

    const checkWeeklyGoalMet = async (getHabits) => {
        try {
            const habits = await getHabits()
            const weeklyHabits = habits.filter(h =>
                h.frequency_option === 'cantidad_dias_semana' ||
                h.frequency_option === 'dias_especificos_semana'
            )

            if (weeklyHabits.length === 0) return null

            const allWeeklyMet = weeklyHabits.every(h => {
                const required = h.frequency_option === 'dias_especificos_semana'
                    ? (h.frequency_detail?.weekDays?.length || 0)
                    : (h.frequency_detail?.counter || 0)
                return (h.weekCompletedDays || 0) >= required
            })

            if (allWeeklyMet) {
                if (typeof window !== 'undefined') {
                    const weekKey = getWeekKey()
                    const lastWeeklyGoal = localStorage.getItem('lastWeeklyGoalXP')
                    if (lastWeeklyGoal === weekKey) return null
                    localStorage.setItem('lastWeeklyGoalXP', weekKey)
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

    const revokeXP = async (actionKey, customAmount = null) => {
        try {
            const userId = await getUserId()
            const xpToRevoke = customAmount !== null ? customAmount : await getXPForAction(actionKey)
            if (xpToRevoke <= 0) return null

            const currentExp = await getUserExperience()
            const newXP = Math.max(0, currentExp.experience_points - xpToRevoke)
            const newLevel = await calculateLevel(newXP)

            const { error } = await client
                .from('profiles')
                .update({ experience_points: newXP, current_level: newLevel })
                .eq('id', userId)

            if (error) {
                console.error('Error revocando XP:', error)
                throw error
            }

            if (authStore.profile) {
                authStore.profile.experience_points = newXP
                authStore.profile.current_level = newLevel
            }

            console.log(`[XP] -${xpToRevoke} XP por revertir "${actionKey}" | Total: ${newXP} XP | Nivel: ${newLevel}`)

            return { xpRevoked: xpToRevoke, totalXP: newXP, currentLevel: newLevel }
        } catch (error) {
            console.error('Error en revokeXP:', error)
            return null
        }
    }

    const revokeAllHabitsDaily = async () => {
        if (typeof window === 'undefined') return null
        const todayStr = getArgentineDate()
        if (localStorage.getItem('lastAllHabitsDailyXP') !== todayStr) return null
        localStorage.removeItem('lastAllHabitsDailyXP')
        return await revokeXP('all_habits_daily')
    }

    const revokeWeeklyGoalXP = async () => {
        if (typeof window === 'undefined') return null
        if (localStorage.getItem('lastWeeklyGoalXP') !== getWeekKey()) return null
        localStorage.removeItem('lastWeeklyGoalXP')
        return await revokeXP('weekly_goal_met')
    }

    return {
        getUserExperience,
        getLevels,
        calculateLevel,
        getLevelInfo,
        getXPForAction,
        grantXP,
        revokeXP,
        revokeAllHabitsDaily,
        revokeWeeklyGoalXP,
        checkStreakMilestone,
        checkComeback,
        checkAllHabitsDaily,
        checkFirstHabitCreated,
        checkWeeklyGoalMet
    }
}
