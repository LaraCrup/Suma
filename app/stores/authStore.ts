import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const profile = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)

  const fetchUser = async () => {
    const supabase = useSupabaseClient()
    try {
      loading.value = true
      error.value = null

      // Obtener la sesión
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        user.value = null
        profile.value = null
        return
      }

      user.value = session.user

      // Obtener datos del perfil
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        error.value = profileError.message
        return
      }

      profile.value = profileData
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching user:', err)
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates: Record<string, any>) => {
    const supabase = useSupabaseClient()
    try {
      loading.value = true
      error.value = null

      if (!user.value?.id) {
        error.value = 'Usuario no autenticado'
        return null
      }

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.value.id)
        .select()
        .single()

      if (updateError) {
        error.value = updateError.message
        throw updateError
      }

      profile.value = data
      return data
    } catch (err: any) {
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
      await supabase.auth.signOut()
      user.value = null
      profile.value = null
      error.value = null
    } catch (err: any) {
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
