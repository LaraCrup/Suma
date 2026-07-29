export default defineNuxtPlugin(() => {
  const user = useSupabaseUser()
  const { isSupported, isSubscribed, permission, subscribe, checkSubscription } = usePushNotifications()

  watch(
    user,
    async (newUser) => {
      if (!newUser) return
      if (!isSupported.value) return
      if (permission.value === 'denied') return
      await checkSubscription()
      if (!isSubscribed.value) subscribe()
    },
    { immediate: true }
  )
})
