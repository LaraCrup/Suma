export const usePushNotifications = () => {
  const client = useSupabaseClient()
  const config = useRuntimeConfig()

  const isSupported = computed(() =>
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    'Notification' in window &&
    'serviceWorker' in navigator
  )

  const permission = ref(
    typeof window !== 'undefined' ? Notification.permission : 'default'
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
      isSubscribed.value = !!subscription
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

      const { endpoint, keys } = subscription.toJSON()
      await client.from('push_subscriptions').upsert(
        { endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'user_id,endpoint' }
      )

      isSubscribed.value = true
    } catch (e) {
      console.error('[PUSH] Error al suscribir:', e)
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
