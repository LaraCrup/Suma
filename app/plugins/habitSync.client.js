export default defineNuxtPlugin(async (nuxtApp) => {
    console.log('[HABIT SYNC] Plugin initializing...')

    if (typeof window !== 'undefined') {
        const handleVisibilityChange = async () => {
            if (document.visibilityState !== 'visible') return
            const user = useSupabaseUser()
            if (!user.value) return

            try {
                const { useHabits } = await import('~/composables/useHabits')
                const { useExperience } = await import('~/composables/useExperience')
                const { syncHabitsWithNewDay } = useHabits()
                const { checkComeback } = useExperience()

                await syncHabitsWithNewDay()
                await checkComeback()

                console.log('[HABIT SYNC] Background sync completed')
            } catch (error) {
                console.error('[HABIT SYNC] Error during background sync:', error)
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        nuxtApp.hook('app:unmounted', () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        })
    }
})
