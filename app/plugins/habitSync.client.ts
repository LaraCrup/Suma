/**
 * Plugin para sincronizar hábitos con el nuevo día
 * Se ejecuta cuando la app inicializa y detecta si es necesario hacer reset
 */
export default defineNuxtPlugin(async (nuxtApp) => {
    // Esperar a que la sesión esté lista
    const { $fetch } = useNuxtApp()

    try {
        const { useHabits } = await import('~/composables/useHabits')
        const { syncHabitsWithNewDay } = useHabits()

        // Ejecutar sincronización al inicializar
        await syncHabitsWithNewDay()

        // Sincronizar cuando la app vuelve del background
        if (typeof window !== 'undefined') {
            const handleVisibilityChange = async () => {
                if (document.visibilityState === 'visible') {
                    await syncHabitsWithNewDay()
                }
            }

            document.addEventListener('visibilitychange', handleVisibilityChange)

            // Cleanup
            nuxtApp.hook('app:unmounted', () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange)
            })
        }
    } catch (error) {
        console.error('[HABIT SYNC] Error during plugin initialization:', error)
    }
})
