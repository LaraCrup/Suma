export const usePushNotifications = () => {
  const client = useSupabaseClient()
  const config = useRuntimeConfig()

  const getUserId = async () => {
    const { data: { session } } = await client.auth.getSession()
    return session?.user?.id ?? null
  }

  const isSupported = computed(() =>
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )

  const permission = ref(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )
  const isSubscribed = ref(false)
  const isLoading = ref(false)

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
  }

  const checkSubscription = async () => {
    if (!isSupported.value) return
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (!subscription) { isSubscribed.value = false; return }

      const { data } = await client
        .from('push_subscriptions')
        .select('id')
        .eq('endpoint', subscription.endpoint)
        .maybeSingle()

      if (data) {
        isSubscribed.value = true
      } else {
        const userId = await getUserId()
        if (!userId) { isSubscribed.value = false; return }
        const { endpoint, keys } = subscription.toJSON()
        const { error } = await client.from('push_subscriptions').upsert(
          { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
          { onConflict: 'user_id,endpoint' }
        )
        if (error) {
          console.error('[PUSH] Error re-sincronizando suscripción:', error)
          isSubscribed.value = false
        } else {
          console.log('[PUSH] Suscripción re-sincronizada con la DB')
          isSubscribed.value = true
        }
      }
    } catch {
      isSubscribed.value = false
    }
  }

  const subscribe = async () => {
    if (!isSupported.value || isLoading.value) return
    isLoading.value = true
    try {
      const result = await Notification.requestPermission()
      permission.value = result
      if (result !== 'granted') return

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.public.vapidPublicKey),
      })

      isSubscribed.value = true

      const userId = await getUserId()
      if (!userId) {
        console.error('[PUSH] No hay sesión activa')
        isSubscribed.value = false
        return
      }

      const { endpoint, keys } = subscription.toJSON()
      const { error: upsertError } = await client.from('push_subscriptions').upsert(
        { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'user_id,endpoint' }
      )

      if (upsertError) {
        console.error('[PUSH] Error guardando suscripción:', upsertError)
        isSubscribed.value = false
        return
      }

      console.log('[PUSH] Suscripción guardada correctamente')
    } catch (e) {
      console.error('[PUSH] Error al suscribir:', e)
      isSubscribed.value = false
    } finally {
      isLoading.value = false
    }
  }

  const unsubscribe = async () => {
    if (!isSupported.value || isLoading.value) return
    isLoading.value = true
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await client.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
        await subscription.unsubscribe()
      }
      isSubscribed.value = false
    } catch (e) {
      console.error('[PUSH] Error al desuscribir:', e)
    } finally {
      isLoading.value = false
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    checkSubscription,
  }
}
