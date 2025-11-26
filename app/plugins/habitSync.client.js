/**
 * Plugin para sincronizar hábitos cuando la app vuelve del background
 */
export default defineNuxtPlugin(async (nuxtApp) => {
    console.log('[HABIT SYNC] Plugin initializing...')

    // Sincronizar cuando la app vuelve del background
    if (typeof window !== 'undefined') {
        const handleVisibilityChange = async () => {
            console.log('[HABIT SYNC] Visibility changed to:', document.visibilityState)
            if (document.visibilityState === 'visible') {
                try {
                    console.log('[HABIT SYNC] Starting background sync...')
                    const { useHabits } = await import('~/composables/useHabits')
                    const { syncHabitsWithNewDay } = useHabits()
                    await syncHabitsWithNewDay()
                    console.log('[HABIT SYNC] Background sync completed')
                } catch (error) {
                    console.error('[HABIT SYNC] Error during background sync:', error)
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup
        nuxtApp.hook('app:unmounted', () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        })
    }
})
