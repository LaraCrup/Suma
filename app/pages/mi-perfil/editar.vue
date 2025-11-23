<template>
  <DefaultSection>
    <div class="w-full flex items-center gap-3">
      <NavigationBackArrow class="!w-fit text-gray" />
      <HeadingH1>Editar perfil</HeadingH1>
    </div>

    <Loader v-if="authStore.loading" />


    <form v-else @submit.prevent="handleSave" class="w-full flex flex-col gap-6">
      <div class="flex flex-col items-center gap-3">
        <Avatar
          :name="authStore.profile?.display_name || 'Usuario'"
          :initial="authStore.profile?.name?.charAt(0).toUpperCase() || '?'"
          :image="authStore.profile?.avatar_url"
          :preview="previewImage"
        />
        <div class="flex items-center gap-3">
          <button type="button" @click="triggerFileInput" class="cursor-pointer">
            <NuxtImg src="images/icons/edit.svg" alt="Cambiar foto de perfil" class="h-4 text-green-dark" />
          </button>
          <button
            v-if="authStore.profile?.avatar_url"
            type="button"
            @click="deleteAvatar"
            class="cursor-pointer"
          >
            <NuxtImg src="images/icons/delete.svg" alt="Eliminar foto de perfil" class="h-4 text-green-dark" />
          </button>
        </div>
        <input
          type="file"
          ref="fileInput"
          @change="handleFileUpload"
          accept="image/*"
          class="hidden"
        />
      </div>

      <FormTextFieldSecondary
        id="name"
        v-model="formData.name"
        label="Nombre"
        placeholder="Nombre"
        required
        :error="errors.name"
      />

      <FormTextFieldSecondary
        id="display_name"
        v-model="formData.display_name"
        label="Nombre de Usuario"
        placeholder="Nombre de Usuario"
        required
        :error="errors.display_name"
      />


      <ButtonPrimary type="submit" :disabled="authStore.loading">
        {{ authStore.loading ? 'Guardando...' : 'Guardar cambios' }}
      </ButtonPrimary>
    </form>
  </DefaultSection>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()
const fileInput = ref(null)
const previewImage = ref(null)
const selectedFile = ref(null)
const formData = ref({
  name: '',
  display_name: ''
})
const errors = ref({
  name: '',
  display_name: ''
})

// Cargar datos del usuario al montar el componente
onMounted(async () => {
  await authStore.fetchUser()
  if (authStore.profile) {
    formData.value = {
      name: authStore.profile.name || '',
      display_name: authStore.profile.display_name || ''
    }
  }
})

// Sincronizar cambios en el perfil con el formulario
watch(
  () => authStore.profile,
  (newProfile) => {
    if (newProfile) {
      formData.value = {
        name: newProfile.name || '',
        display_name: newProfile.display_name || ''
      }
    }
  }
)

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileUpload = async (event) => {
  const input = event.target
  const file = input.files?.[0]

  if (!file) return

  // Guardar el archivo para procesarlo después
  selectedFile.value = file

  // Mostrar preview de la imagen
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const deleteAvatar = async () => {
  if (!authStore.profile?.avatar_url) return

  const supabase = useSupabaseClient()

  try {
    // Extraer el nombre del archivo de la URL
    const urlParts = authStore.profile.avatar_url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `${authStore.user.id}/${fileName}`

    // Eliminar archivo del storage
    await supabase.storage
      .from('avatar')
      .remove([filePath])

    // Actualizar perfil sin imagen
    await authStore.updateProfile({
      avatar_url: null
    })

    // Limpiar preview y archivo seleccionado
    previewImage.value = null
    selectedFile.value = null

    saveMessage.value = 'Foto de perfil eliminada'
    setTimeout(() => {
      saveMessage.value = ''
    }, 3000)
  } catch (error) {
    authStore.error = `Error al eliminar: ${error.message}`
  }
}

const handleSave = async () => {
  // Limpiar errores previos
  errors.value = {
    name: '',
    display_name: ''
  }

  // Validar campos
  if (!formData.value.name) {
    errors.value.name = 'El nombre es requerido'
  }
  if (!formData.value.display_name) {
    errors.value.display_name = 'El nombre de usuario es requerido'
  }

  if (errors.value.name || errors.value.display_name) {
    return
  }

  try {
    const router = useRouter()
    const supabase = useSupabaseClient()

    // Verificar que el display_name no exista (excepto el actual)
    if (formData.value.display_name !== authStore.profile?.display_name) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('display_name', formData.value.display_name)
        .single()

      if (data && data.id !== authStore.user.id) {
        errors.value.display_name = 'Este nombre de usuario ya existe'
        return
      }
    }

    const updates = {
      name: formData.value.name,
      display_name: formData.value.display_name
    }

    // Si hay una imagen seleccionada, subirla
    if (selectedFile.value) {
      const fileName = selectedFile.value.name
      const filePath = `${authStore.user.id}/${fileName}`

      // Subir archivo
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, selectedFile.value, { upsert: true })

      if (uploadError) {
        authStore.error = `Error al subir imagen: ${uploadError.message}`
        return
      }

      // Obtener URL firmada
      const { data: signedUrlData, error: signedError } = await supabase.storage
        .from('avatar')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365)

      if (signedError) {
        authStore.error = `Error al generar URL: ${signedError.message}`
        return
      }

      updates.avatar_url = signedUrlData.signedUrl
      selectedFile.value = null
      previewImage.value = null
    }

    // Actualizar perfil con todos los datos
    await authStore.updateProfile(updates)

    // Recargar el perfil
    await authStore.fetchUser()

    // Navegar a mi-perfil
    await router.push('/mi-perfil')
  } catch (error) {
    authStore.error = `Error al guardar: ${error.message}`
  }
}
</script>