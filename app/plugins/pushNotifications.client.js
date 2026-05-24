export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { isSupported, isSubscribed, permission, subscribe, checkSubscription } = usePushNotifications()

  watch(
    user,
    async (newUser) => {
      console.log('[PUSH] watch disparado — user:', !!newUser, '| soportado:', isSupported.value, '| permiso:', permission.value)
      if (!newUser) return
      if (!isSupported.value) { console.log('[PUSH] Push no soportado en este browser'); return }
      if (permission.value === 'denied') { console.log('[PUSH] Permiso denegado, no se puede pedir'); return }
      await checkSubscription()
      console.log('[PUSH] Ya suscripto:', isSubscribed.value)
      if (!isSubscribed.value) {
        console.log('[PUSH] Iniciando suscripción...')
        subscribe()
      }
    },
    { immediate: true }
  )
})
