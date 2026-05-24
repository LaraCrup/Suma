export default defineNuxtPlugin(() => {
  const { isSupported, isSubscribed, permission, subscribe, checkSubscription } = usePushNotifications()
  const authStore = useAuthStore()

  watch(
    () => authStore.isLoggedIn,
    async (loggedIn) => {
      if (!loggedIn || !isSupported.value || permission.value === 'denied') return
      await checkSubscription()
      if (!isSubscribed.value) subscribe()
    },
    { immediate: true }
  )
})
