export default defineNuxtPlugin(async (nuxtApp) => {
    if (typeof window !== 'undefined') {
        const handleVisibilityChange = async () => {
            if (document.visibilityState !== 'visible') return
            const user = useSupabaseUser()
            if (!user.value) return

            try {
                const { useHabits } = await import('~/composables/useHabits')
                const { useExperience } = await import('~/composables/useExperience')
                const { useCommunities } = await import('~/composables/useCommunities')
                const { syncHabitsWithNewDay } = useHabits()
                const { checkComeback } = useExperience()
                const { syncCommunityStreaks } = useCommunities()

                await syncHabitsWithNewDay()
                await syncCommunityStreaks()
                await checkComeback()
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
