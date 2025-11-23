import { computed } from 'vue'
import { useAuthStore } from '~/stores/authStore'

export const useUser = () => {
  const authStore = useAuthStore()

  return {
    // Datos del usuario
    user: computed(() => authStore.user),
    profile: computed(() => authStore.profile),
    isLoggedIn: computed(() => authStore.isLoggedIn),
    loading: computed(() => authStore.loading),
    error: computed(() => authStore.error),

    // Acciones
    fetchUser: () => authStore.fetchUser(),
    updateProfile: (updates: Record<string, any>) => authStore.updateProfile(updates),
    logout: () => authStore.logout(),
  }
}
