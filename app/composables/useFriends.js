export const useFriends = () => {
    const client = useSupabaseClient()

    const getUserId = async () => {
        const { data: { session }, error } = await client.auth.getSession()
        if (error || !session?.user?.id) {
            throw new Error('Usuario no autenticado. Por favor inicia sesión.')
        }
        return session.user.id
    }

    /**
     * Busca usuarios por display_name, excluyendo al usuario actual.
     * Retorna también el estado de solicitud si existe.
     */
    const searchUsers = async (query) => {
        if (!query || query.trim().length < 1) return []

        const userId = await getUserId()

        const { data, error } = await client
            .from('profiles')
            .select('id, display_name, avatar_url')
            .ilike('display_name', `%${query.trim()}%`)
            .neq('id', userId)
            .limit(20)

        if (error) {
            console.error('Error buscando usuarios:', error)
            return []
        }

        return data || []
    }

    /**
     * Envía una solicitud de amistad al usuario con receiverId.
     */
    const sendFriendRequest = async (receiverId) => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('friend_requests')
            .insert({ sender_id: userId, receiver_id: receiverId })
            .select()
            .single()

        if (error) {
            console.error('Error enviando solicitud:', error)
            throw error
        }

        return data
    }

    /**
     * Obtiene IDs de todos los amigos aceptados del usuario actual.
     */
    const getFriendIds = async () => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('friend_requests')
            .select('sender_id, receiver_id')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

        if (error) {
            console.error('Error obteniendo IDs de amigos:', error)
            return []
        }

        return (data || []).map(r => r.sender_id === userId ? r.receiver_id : r.sender_id)
    }

    /**
     * Obtiene IDs de usuarios a los que el usuario actual les envió una solicitud pendiente.
     */
    const getSentPendingIds = async () => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('friend_requests')
            .select('receiver_id')
            .eq('sender_id', userId)
            .eq('status', 'pending')

        if (error) {
            console.error('Error obteniendo solicitudes enviadas:', error)
            return []
        }

        return (data || []).map(r => r.receiver_id)
    }

    /**
     * Obtiene las solicitudes pendientes recibidas por el usuario actual,
     * incluyendo datos del perfil del sender.
     */
    const getPendingRequests = async () => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('friend_requests')
            .select('id, created_at, sender:sender_id(id, display_name, avatar_url)')
            .eq('receiver_id', userId)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error obteniendo solicitudes pendientes:', error)
            return []
        }

        return data || []
    }

    /**
     * Acepta una solicitud de amistad.
     */
    const acceptFriendRequest = async (requestId) => {
        const { error } = await client
            .from('friend_requests')
            .update({ status: 'accepted' })
            .eq('id', requestId)

        if (error) {
            console.error('Error aceptando solicitud:', error)
            throw error
        }
    }

    /**
     * Rechaza/elimina una solicitud de amistad recibida.
     */
    const declineFriendRequest = async (requestId) => {
        const { error } = await client
            .from('friend_requests')
            .delete()
            .eq('id', requestId)

        if (error) {
            console.error('Error rechazando solicitud:', error)
            throw error
        }
    }

    /**
     * Cancela una solicitud enviada por el usuario actual a receiverId.
     */
    const cancelFriendRequest = async (receiverId) => {
        const userId = await getUserId()

        const { error } = await client
            .from('friend_requests')
            .delete()
            .eq('sender_id', userId)
            .eq('receiver_id', receiverId)
            .eq('status', 'pending')

        if (error) {
            console.error('Error cancelando solicitud:', error)
            throw error
        }
    }

    /**
     * Obtiene la lista de amigos (solicitudes aceptadas) del usuario actual.
     */
    const getFriends = async () => {
        const userId = await getUserId()

        const { data, error } = await client
            .from('friend_requests')
            .select('id, sender:sender_id(id, display_name, avatar_url), receiver:receiver_id(id, display_name, avatar_url)')
            .eq('status', 'accepted')
            .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)

        if (error) {
            console.error('Error obteniendo amigos:', error)
            return []
        }

        // Devolver el perfil del otro usuario (no el del actual)
        return (data || []).map(row => {
            return row.sender.id === userId ? row.receiver : row.sender
        })
    }

    /**
     * Obtiene el perfil público de cualquier usuario por ID.
     * Retorna null si no existe.
     */
    const getProfileById = async (userId) => {
        const { data, error } = await client
            .from('profiles')
            .select('id, display_name, avatar_url, experience_points, current_level')
            .eq('id', userId)
            .maybeSingle()

        if (error) {
            console.error('Error obteniendo perfil:', error)
            return null
        }

        return data
    }

    /**
     * Elimina la amistad entre el usuario actual y otherUserId.
     */
    const removeFriend = async (otherUserId) => {
        const userId = await getUserId()

        const { error } = await client
            .from('friend_requests')
            .delete()
            .eq('status', 'accepted')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)

        if (error) {
            console.error('Error eliminando amistad:', error)
            throw error
        }
    }

    return {
        searchUsers,
        sendFriendRequest,
        cancelFriendRequest,
        getFriendIds,
        getSentPendingIds,
        getPendingRequests,
        acceptFriendRequest,
        declineFriendRequest,
        getFriends,
        getProfileById,
        removeFriend,
    }
}
