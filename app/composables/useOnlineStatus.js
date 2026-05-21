export function useOnlineStatus() {
  const isOnline = ref(true)

  onMounted(() => {
    isOnline.value = navigator.onLine
    window.addEventListener('online', () => { isOnline.value = true })
    window.addEventListener('offline', () => { isOnline.value = false })
  })

  return { isOnline }
}
