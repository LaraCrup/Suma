import { defineStore } from 'pinia'
import { ref, computed } from 'vue'



export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!user.value)

  const fetchUser = async () => {
    const supabase = useSupabaseClient()
    try {
      loading.value = true
      error.value = null

      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        user.value = null
        profile.value = null
        return
      }

      user.value = session.user

      const { data: profileData, error: profileError } = await supabase.rpc('my_profile')

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        error.value = profileError.message
        return
      }

      profile.value = profileData
    } catch (err) {
      error.value = err.message
      console.error('Error fetching user:', err)
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates) => {
    const supabase = useSupabaseClient()
    try {
      loading.value = true
      error.value = null

      if (!user.value?.id) {
        error.value = 'Usuario no autenticado'
        return null
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)

      if (updateError) {
        error.value = updateError.message
        throw updateError
      }

      const { data, error: refreshError } = await supabase.rpc('my_profile')

      if (refreshError) {
        error.value = refreshError.message
        throw refreshError
      }

      profile.value = data
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error updating profile:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    const supabase = useSupabaseClient()
    try {
      const { removeSubscriptionForCurrentUser } = usePushNotifications()
      await removeSubscriptionForCurrentUser()
      await supabase.auth.signOut()

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('sessionPhrase')
        sessionStorage.removeItem('sessionTip')
        sessionStorage.removeItem('novedades_last_fetch')
      }

      user.value = null
      profile.value = null
      error.value = null
    } catch (err) {
      error.value = err.message
      console.error('Error logging out:', err)
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    isLoggedIn,
    fetchUser,
    updateProfile,
    logout
  }
})
