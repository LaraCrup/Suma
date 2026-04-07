export const useCommunities = () => {
    const client = useSupabaseClient()

    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()
        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.')
        }
        return session.user.id
    }

    /**
     * Crea una comunidad con su hábito compartido.
     * El creador se agrega automáticamente como admin.
     */
    const createCommunity = async (name, icon, memberIds, habitData) => {
        const userId = await getUserId()

        // 1. Insertar la comunidad (sin .select() para evitar el RLS de SELECT antes de ser miembro)
        const { error: communityError } = await client
            .from('communities')
            .insert({ name, icon, created_by: userId })

        if (communityError) {
            console.error('Error creando comunidad:', communityError)
            throw communityError
        }

        // Obtener la comunidad recién creada
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

        // 2. Insertar creador como admin + miembros invitados (sin duplicados)
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

        // 3. Insertar el hábito de la comunidad
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

        return community
    }

    /**
     * Obtiene las comunidades del usuario actual con cantidad de miembros y hábito.
     */
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
                    .select('id, name, icon')
                    .eq('community_id', community.id)
                    .maybeSingle()

                return {
                    ...community,
                    member_count: count || 0,
                    habit: habit || null,
                    streak: 0,
                }
            })
        )

        return enriched
    }

    /**
     * Obtiene el detalle de una comunidad con sus miembros y sus perfiles.
     */
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

    /**
     * Obtiene el hábito compartido de una comunidad, o null si no tiene.
     */
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

    /**
     * Obtiene los mensajes del chat de una comunidad (últimos 100, orden cronológico).
     */
    const getCommunityMessages = async (communityId) => {
        const { data, error } = await client
            .from('community_messages')
            .select('id, content, created_at, sender:user_id(id, display_name, avatar_url)')
            .eq('community_id', communityId)
            .order('created_at', { ascending: true })
            .limit(100)

        if (error) {
            console.error('Error obteniendo mensajes:', error)
            return []
        }

        return data || []
    }

    /**
     * Envía un mensaje al chat de una comunidad.
     * Retorna el mensaje creado con los datos del sender.
     */
    const sendMessage = async (communityId, content) => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('community_messages')
            .insert({ community_id: communityId, user_id: userId, content: content.trim() })
            .select('id, content, created_at, sender:user_id(id, display_name, avatar_url)')
            .single()

        if (error) {
            console.error('Error enviando mensaje:', error)
            throw error
        }

        return data
    }

    /**
     * Sale de una comunidad (elimina al usuario de community_members).
     */
    const leaveCommunity = async (communityId) => {
        const userId = await getUserId()

        const { error } = await client
            .from('community_members')
            .delete()
            .eq('community_id', communityId)
            .eq('user_id', userId)

        if (error) {
            console.error('Error saliendo de la comunidad:', error)
            throw error
        }

        return true
    }

    return {
        createCommunity,
        getCommunities,
        getCommunityById,
        getCommunityHabit,
        getCommunityMessages,
        sendMessage,
        leaveCommunity,
    }
}
