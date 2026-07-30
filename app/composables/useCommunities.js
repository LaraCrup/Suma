export const useCommunities = () => {
    const client = useSupabaseClient()
    const { grantXP, revokeXP } = useExperience()

    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()
        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Iniciá sesión.')
        }
        return session.user.id
    }

    const createCommunity = async (name, icon, memberIds, habitData) => {
        const userId = await getUserId()

        const { error: communityError } = await client
            .from('communities')
            .insert({ name, icon, created_by: userId })

        if (communityError) {
            console.error('Error creando comunidad:', communityError)
            throw communityError
        }

        const { data: community, error: getError } = await client
            .from('communities')
            .select('id, name, icon, created_at')
            .eq('created_by', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (getError) {
            console.error('Error obteniendo comunidad creada:', getError)
            throw getError
        }

        const communityId = community.id

        const uniqueMemberIds = [...new Set((memberIds || []).filter(id => id !== userId))]
        const membersToInsert = [
            { community_id: communityId, user_id: userId, role: 'admin' },
            ...uniqueMemberIds.map(id => ({
                community_id: communityId,
                user_id: id,
                role: 'member'
            }))
        ]

        const { error: membersError } = await client
            .from('community_members')
            .insert(membersToInsert)

        if (membersError) {
            console.error('Error agregando miembros:', membersError)
            throw membersError
        }

        const habitRecord = {
            community_id: communityId,
            name: habitData.name,
            icon: habitData.icon,
            identity: habitData.identity || null,
            unit: habitData.unit || null,
            goal_value: habitData.goal_value || 1,
            frequency_type: habitData.frequency_type || 'diario',
            frequency_option: habitData.frequency_option || null,
            frequency_detail: habitData.frequency_detail || null,
        }

        const { error: habitError } = await client
            .from('community_habits')
            .insert(habitRecord)

        if (habitError) {
            console.error('Error creando hábito de comunidad:', habitError)
            throw habitError
        }

        await grantXP('create_community')
        return community
    }

    const getCommunities = async () => {
        const userId = await getUserId()

        const { data: memberships, error: membershipError } = await client
            .from('community_members')
            .select('community_id')
            .eq('user_id', userId)

        if (membershipError) {
            console.error('Error obteniendo membresías:', membershipError)
            return []
        }

        if (!memberships || memberships.length === 0) return []

        const communityIds = memberships.map(m => m.community_id)

        const { data: communities, error: commError } = await client
            .from('communities')
            .select('id, name, icon, created_at')
            .in('id', communityIds)
            .order('created_at', { ascending: false })

        if (commError) {
            console.error('Error obteniendo comunidades:', commError)
            return []
        }

        const enriched = await Promise.all(
            (communities || []).map(async (community) => {
                const { count } = await client
                    .from('community_members')
                    .select('*', { count: 'exact', head: true })
                    .eq('community_id', community.id)

                const { data: habit } = await client
                    .from('community_habits')
                    .select('*')
                    .eq('community_id', community.id)
                    .maybeSingle()

                return {
                    ...community,
                    member_count: count || 0,
                    habit: habit || null,
                    streak: habit?.streak || 0,
                }
            })
        )

        return enriched
    }

    const getCommunityById = async (communityId) => {
        const { data: community, error: commError } = await client
            .from('communities')
            .select('id, name, icon, created_by, created_at')
            .eq('id', communityId)
            .maybeSingle()

        if (commError) {
            console.error('Error obteniendo comunidad:', commError)
            return null
        }

        if (!community) return null

        const { data: members, error: membersError } = await client
            .from('community_members')
            .select('id, role, joined_at, profile:user_id(id, display_name, avatar_url)')
            .eq('community_id', communityId)
            .order('joined_at', { ascending: true })

        if (membersError) {
            console.error('Error obteniendo miembros:', membersError)
        }

        return {
            ...community,
            members: members || [],
            member_count: members?.length || 0,
        }
    }

    const getCommunityHabit = async (communityId) => {
        const { data, error } = await client
            .from('community_habits')
            .select('*')
            .eq('community_id', communityId)
            .maybeSingle()

        if (error) {
            console.error('Error obteniendo hábito de comunidad:', error)
            return null
        }

        return data
    }

    const isCommunityAdmin = async (communityId) => {
        const userId = await getUserId()

        const { data } = await client
            .from('community_members')
            .select('role')
            .eq('community_id', communityId)
            .eq('user_id', userId)
            .maybeSingle()

        return data?.role === 'admin'
    }

    const updateCommunityHabit = async (habitId, habitData) => {
        const { data, error } = await client
            .from('community_habits')
            .update({
                name: habitData.name,
                icon: habitData.icon,
                identity: habitData.identity || null,
                unit: habitData.unit || null,
                goal_value: habitData.goal_value || 1,
                frequency_type: habitData.frequency_type || 'diario',
                frequency_option: habitData.frequency_option || null,
                frequency_detail: habitData.frequency_detail || null,
            })
            .eq('id', habitId)
            .select()

        if (error) {
            console.error('Error actualizando hábito de comunidad:', error)
            throw error
        }

        if (!data || data.length === 0) {
            throw new Error('No se pudo actualizar el hábito. Verificá que tenés permisos de administrador.')
        }

        return data[0]
    }

    const getCommunityMessages = async (communityId) => {
        const { data, error } = await client
            .from('community_messages')
            .select('id, content, created_at, user_id, sender:user_id(id, display_name, avatar_url)')
            .eq('community_id', communityId)
            .order('created_at', { ascending: true })
            .limit(100)

        if (error) {
            console.error('Error obteniendo mensajes:', error)
            return []
        }

        return data || []
    }

    const sendMessage = async (communityId, content) => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('community_messages')
            .insert({ community_id: communityId, user_id: userId, content: content.trim() })
            .select('id, content, created_at, user_id, sender:user_id(id, display_name, avatar_url)')
            .single()

        if (error) {
            console.error('Error enviando mensaje:', error)
            throw error
        }

        return data
    }

    const getCommunityHabitCompletions = async (habitId, date = null) => {
        const today = date || getArgentineDate()

        const { data: habit } = await client
            .from('community_habits')
            .select('community_id')
            .eq('id', habitId)
            .single()
        if (!habit) return []

        const { data: members } = await client
            .from('community_members')
            .select('profile:user_id(id, display_name, avatar_url)')
            .eq('community_id', habit.community_id)

        const { data: logs } = await client
            .from('community_habit_logs')
            .select('user_id, progress_count, completed')
            .eq('community_habit_id', habitId)
            .eq('date', today)

        const logsMap = Object.fromEntries((logs || []).map(l => [l.user_id, l]))

        return (members || []).map(m => ({
            ...m.profile,
            progress_count: logsMap[m.profile.id]?.progress_count || 0,
            completed: logsMap[m.profile.id]?.completed || false,
        }))
    }

    const logCommunityHabitProgress = async (habitId, amount, goalValue = 1, date = null) => {
        const userId = await getUserId()
        const targetDate = date || getArgentineDate()

        const { data: existing } = await client
            .from('community_habit_logs')
            .select('progress_count, completed')
            .eq('community_habit_id', habitId)
            .eq('user_id', userId)
            .eq('date', targetDate)
            .maybeSingle()

        const newCount = Math.max(0, Math.min((existing?.progress_count || 0) + amount, goalValue))
        const isCompleted = newCount >= goalValue

        const { data: log, error } = await client
            .from('community_habit_logs')
            .upsert({
                community_habit_id: habitId,
                user_id: userId,
                date: targetDate,
                progress_count: newCount,
                completed: isCompleted,
            }, { onConflict: 'community_habit_id,user_id,date' })
            .select()
            .single()

        if (error) throw error

        const completedChanged = isCompleted !== (existing?.completed ?? false)
        if (completedChanged) {
            await updateCommunityStreak(habitId)
            if (isCompleted) {
                await grantXP('community_habit_completed')
            } else {
                await revokeXP('community_habit_completed')
            }
        }

        return log
    }

    const getCommunityMembersFor = async (communityId) => {
        const { data } = await client
            .from('community_members')
            .select('user_id, joined_at')
            .eq('community_id', communityId)

        return data || []
    }

    const requiredMembersOn = (members, dateStr) => members
        .filter(m => !m.joined_at || timestampToArgentineDateStr(m.joined_at) <= dateStr)
        .map(m => m.user_id)

    const buildCommunityCompletedDays = async (habitId, members) => {
        const { data: logs } = await client
            .from('community_habit_logs')
            .select('user_id, date')
            .eq('community_habit_id', habitId)
            .eq('completed', true)

        const usersByDate = {}
        for (const log of logs || []) {
            if (!usersByDate[log.date]) usersByDate[log.date] = new Set()
            usersByDate[log.date].add(log.user_id)
        }

        const completedDays = new Set()
        for (const [date, userIds] of Object.entries(usersByDate)) {
            const required = requiredMembersOn(members, date)
            if (required.length === 0) continue
            if (required.every(id => userIds.has(id))) completedDays.add(date)
        }

        return completedDays
    }

    const countCompletedDaysInRange = (completedDays, start, end) => {
        let count = 0
        for (const date of completedDays) {
            if (date >= start && date <= end) count++
        }
        return count
    }

    const isCommunityPeriodComplete = (habit, completedDays, start, end) => {
        const quota = getPeriodQuota(habit, start)
        return quota > 0 && countCompletedDaysInRange(completedDays, start, end) >= quota
    }

    const calculateCommunityStreakUpTo = (habit, completedDays, dateStr) => {
        const cadence = getStreakCadence(habit)

        if (cadence === 'weekly') {
            let cursor = dateStr
            let streak = 0
            while (streak < 500) {
                const wStart = getWeekStart(dateStrToDate(cursor))
                const wEnd = getWeekEnd(dateStrToDate(cursor))
                if (!isCommunityPeriodComplete(habit, completedDays, wStart, wEnd)) break
                streak++
                cursor = addDaysToDateStr(wStart, -1)
            }
            return streak
        }

        if (cadence === 'monthly') {
            let [yr, mo] = dateStr.split('-').map(Number)
            let streak = 0
            while (streak < 500) {
                const mStart = `${yr}-${String(mo).padStart(2, '0')}-01`
                const lastDay = new Date(yr, mo, 0).getDate()
                const mEnd = `${yr}-${String(mo).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
                if (!isCommunityPeriodComplete(habit, completedDays, mStart, mEnd)) break
                streak++
                mo--
                if (mo === 0) { mo = 12; yr-- }
            }
            return streak
        }

        if (completedDays.size === 0) return 0
        const earliest = [...completedDays].sort()[0]
        const option = habit.frequency_option

        if (option === 'cantidad_dias_semana' || option === 'cantidad_dias_mes') {
            const { start: curStart, end: curEnd } = getPeriodBounds(habit, dateStr)
            const curEndCapped = curEnd < dateStr ? curEnd : dateStr
            let streak = countCompletedDaysInRange(completedDays, curStart, curEndCapped)
            let cursor = getPrevPeriodEndDate(habit, dateStr)
            let guard = 0
            while (streak < 500 && guard < 250) {
                guard++
                const { start: pStart, end: pEnd } = getPeriodBounds(habit, cursor)
                if (pEnd < earliest) break
                const completedInPeriod = countCompletedDaysInRange(completedDays, pStart, pEnd)
                const quota = getPeriodQuota(habit, pStart)
                if (quota > 0 && completedInPeriod >= quota) {
                    streak += completedInPeriod
                    cursor = addDaysToDateStr(pStart, -1)
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
                if (completedDays.has(cur)) {
                    streak++
                } else {
                    break
                }
            }
            cur = addDaysToDateStr(cur, -1)
            if (cur < earliest) break
        }
        return streak
    }

    const resolveCommunityStreakAnchor = (habit, completedDays, today) => {
        const cadence = getStreakCadence(habit)

        if (cadence === 'weekly' || cadence === 'monthly') {
            const current = getPeriodBounds(habit, today)
            if (isCommunityPeriodComplete(habit, completedDays, current.start, current.end)) return today
            const prevEnd = getPrevPeriodEndDate(habit, today)
            const previous = getPeriodBounds(habit, prevEnd)
            return isCommunityPeriodComplete(habit, completedDays, previous.start, previous.end) ? prevEnd : null
        }

        const option = habit.frequency_option
        if (option === 'cantidad_dias_semana' || option === 'cantidad_dias_mes') return today

        const lastScheduled = findScheduledOnOrBefore(habit, today)
        if (lastScheduled && completedDays.has(lastScheduled)) return lastScheduled

        if (lastScheduled === today) {
            const prevScheduled = findScheduledBefore(habit, today)
            if (prevScheduled && completedDays.has(prevScheduled)) return prevScheduled
        }

        return null
    }

    const updateCommunityStreak = async (habitId) => {
        const { data: habit } = await client
            .from('community_habits')
            .select('*')
            .eq('id', habitId)
            .single()

        if (!habit) return

        const members = await getCommunityMembersFor(habit.community_id)
        if (members.length === 0) return

        const completedDays = await buildCommunityCompletedDays(habitId, members)
        const today = getArgentineDate()
        const anchor = resolveCommunityStreakAnchor(habit, completedDays, today)
        const newStreak = anchor ? calculateCommunityStreakUpTo(habit, completedDays, anchor) : 0
        const newLongest = Math.max(newStreak, habit.longest_streak || 0)

        if (newStreak !== habit.streak || newLongest !== habit.longest_streak) {
            await client
                .from('community_habits')
                .update({ streak: newStreak, longest_streak: newLongest })
                .eq('id', habitId)
        }

        return newStreak
    }

    const syncCommunityStreaks = async () => {
        if (typeof window === 'undefined') return

        let userId
        try {
            userId = await getUserId()
        } catch {
            return
        }

        const today = getArgentineDate()
        const syncKey = `lastCommunityStreakSync_${userId}`
        if (localStorage.getItem(syncKey) === today) return
        localStorage.setItem(syncKey, today)

        try {
            const { data: memberships } = await client
                .from('community_members')
                .select('community_id')
                .eq('user_id', userId)

            const communityIds = (memberships || []).map(m => m.community_id)
            if (communityIds.length === 0) return

            const { data: habits } = await client
                .from('community_habits')
                .select('id')
                .in('community_id', communityIds)

            for (const habit of habits || []) {
                await updateCommunityStreak(habit.id)
            }
        } catch (error) {
            console.error('[COMMUNITY SYNC] Error recalculando rachas comunitarias:', error)
        }
    }

    const shouldShowCommunityHabitForDate = async (habit, dateStr) => {
        if (!habit?.community_id) return true

        const members = await getCommunityMembersFor(habit.community_id)
        const completedDays = await buildCommunityCompletedDays(habit.id, members)

        return await shouldShowHabitForDateWith(habit, dateStr, async (start, end) =>
            countCompletedDaysInRange(completedDays, start, end))
    }

    const getCommunityHabitMyLog = async (habitId, date = null) => {
        const userId = await getUserId()
        const targetDate = date || getArgentineDate()

        const { data } = await client
            .from('community_habit_logs')
            .select('*')
            .eq('community_habit_id', habitId)
            .eq('user_id', userId)
            .eq('date', targetDate)
            .maybeSingle()

        return data || null
    }

    const updateCommunityName = async (communityId, name) => {
        const { error } = await client
            .from('communities')
            .update({ name })
            .eq('id', communityId)

        if (error) {
            console.error('Error actualizando nombre:', error)
            throw error
        }

        return true
    }

    const deleteCommunity = async (communityId) => {
        const { error, count } = await client
            .from('communities')
            .delete({ count: 'exact' })
            .eq('id', communityId)

        if (error) {
            console.error('Error eliminando comunidad:', error)
            throw error
        }

        if (count === 0) {
            throw new Error('No se pudo eliminar la comunidad. Verificá que tenés permisos de administrador.')
        }

        return true
    }

    const removeMemberFromCommunity = async (communityId, userId) => {
        const { error, count } = await client
            .from('community_members')
            .delete({ count: 'exact' })
            .eq('community_id', communityId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error eliminando miembro:', error)
            throw error
        }

        if (count === 0) {
            throw new Error('No se pudo eliminar el miembro. Verificá que tenés permisos de administrador.')
        }

        return true
    }

    const leaveCommunity = async (communityId) => {
        const { data, error } = await client.rpc('leave_community', { p_community_id: communityId })

        if (error) {
            console.error('Error saliendo de la comunidad:', error)
            throw new Error(handleSupabaseError(error))
        }

        return data
    }

    const addMembersToExistingCommunity = async (communityId, memberIds) => {
        const currentUserId = await getUserId()
        const records = memberIds
            .filter(id => id !== currentUserId)
            .map(id => ({ community_id: communityId, user_id: id, role: 'member' }))

        if (records.length === 0) return true

        const { error } = await client
            .from('community_members')
            .insert(records)

        if (error) {
            console.error('Error agregando miembros:', error)
            throw error
        }

        return true
    }

    const recordCommunityJoin = async (communityId) => {
        const userId = await getUserId()
        const key = `joined_community_${userId}_${communityId}`
        if (localStorage.getItem(key)) return null
        localStorage.setItem(key, '1')

        const { data: community } = await client
            .from('communities')
            .select('created_by')
            .eq('id', communityId)
            .maybeSingle()

        if (community?.created_by === userId) return null

        return await grantXP('join_community')
    }

    return {
        createCommunity,
        getCommunities,
        getCommunityById,
        getCommunityHabit,
        updateCommunityHabit,
        isCommunityAdmin,
        getCommunityMessages,
        sendMessage,
        getCommunityHabitCompletions,
        logCommunityHabitProgress,
        getCommunityHabitMyLog,
        shouldShowCommunityHabitForDate,
        syncCommunityStreaks,
        updateCommunityStreak,
        updateCommunityName,
        deleteCommunity,
        removeMemberFromCommunity,
        leaveCommunity,
        addMembersToExistingCommunity,
        recordCommunityJoin,
    }
}
