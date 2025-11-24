<template>
    <DefaultSection>
        <HeadingH1 class="w-full">Mi perfil</HeadingH1>

        <Loader v-if="authStore.loading" />

        <div v-else class="w-full flex items-center gap-3">
            <div class="w-full flex items-center gap-3">
                <Avatar :name="authStore.profile?.display_name"
                    :initial="authStore.profile?.name?.charAt(0).toUpperCase()"
                    :image="authStore.profile?.avatar_url" />
                <div class="w-fit flex flex-col gap-1">
                    <p class="text-xs font-bold">{{ authStore.profile?.name }}</p>
                    <p class="text-xs font-bold">{{ authStore.profile?.display_name }}</p>
                    <p class="text-[0.625rem]">{{ authStore.user?.email }}</p>
                    <p class="text-[0.625rem] text-gray font-bold">
                        Desde el {{ formattedCreatedAt }}
                    </p>
                </div>
            </div>
            <NuxtLink :to="ROUTE_NAMES.PROFILE_EDIT" class="self-start">
                <NuxtImg src="images/icons/edit.svg" alt="Editar perfil" class="h-5" />
            </NuxtLink>
        </div>
        <div class="w-full flex flex-col gap-3">
            <div class="w-full flex flex-col items-center gap-1">
                <div class="w-full flex justify-between">
                    <div
                        class="w-6 h-6 flex justify-center items-center bg-primary text-light font-bold text-xs rounded-full">
                        1</div>
                    <div
                        class="w-6 h-6 flex justify-center items-center bg-gray text-light font-bold text-xs rounded-full">
                        2</div>
                </div>
                <div class="relative w-full">
                    <div class="w-full h-3 bg-green-dark rounded-full"></div>
                    <div class="absolute top-0 w-2/3 h-3 bg-gradient-secondary rounded-full"></div>
                </div>
            </div>
            <div>
                <NuxtLink :to="ROUTE_NAMES.PROGRESS" class="text-xs text-primary underline">Ver mis beneficios
                </NuxtLink>
            </div>
        </div>
        <div class="w-full grid grid-cols-2 gap-3">
            <div>
                <p class="text-xs">Hábitos activos</p>
                <p class="text-base font-bold text-primary mt-1">5</p>
            </div>
            <div>
                <p class="text-xs">Comunidades</p>
                <p class="text-xs font-bold text-primary mt-1">Proximamente...</p>
            </div>
            <div>
                <p class="text-xs">Amigos</p>
                <p class="text-xs font-bold text-primary mt-1">Proximamente...</p>
            </div>
        </div>
        <div class="w-full flex flex-col gap-2">
            <ButtonTerciary :to="ROUTE_NAMES.CHANGE_PASSWORD">Cambiar contrasña</ButtonTerciary>
            <form @submit.prevent="confirmLogout">
                <ButtonPrimary type="submit">Cerrar sesión</ButtonPrimary>
            </form>
        </div>
    </DefaultSection>

    <div v-if="showConfirmation" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="showConfirmation = false"></div>
    <div v-if="showConfirmation" class="fixed inset-0 z-50 flex items-end">
        <div class="relative w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl p-5 pb-6">
            <button @click="showConfirmation = false" class="absolute top-4 right-4 text-gray">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <p class="text-center text-sm">¿Estas seguro de que deseas cerrar tu sesión?</p>
            <div class="w-full flex flex-col items-center gap-2">
                <ButtonPrimary type="button" @click="handleLogout">Si, cerrar sesión</ButtonPrimary>
                <ButtonTerciary type="button" @click="showConfirmation = false">Cancelar</ButtonTerciary>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'
import { useAuthStore } from '~/stores/authStore'

const authStore = useAuthStore()
const errorMsg = ref('')
const showConfirmation = ref(false)

onMounted(async () => {
    await authStore.fetchUser()
})

const formattedCreatedAt = computed(() => {
    if (!authStore.user?.created_at) return '...'
    const date = new Date(authStore.user.created_at)
    return date.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    })
})

const confirmLogout = () => {
    showConfirmation.value = true
}

const handleLogout = async () => {
    errorMsg.value = ''
    showConfirmation.value = false

    try {
        await authStore.logout()

        // Limpiar sessionStorage antes de redirigir
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('sessionPhrase')
            sessionStorage.removeItem('sessionTip')
        }

        window.location.href = ROUTE_NAMES.LOGIN
    } catch (error) {
        errorMsg.value = 'Ocurrió un error inesperado. Por favor, intenta de nuevo.'
        console.error('Error logging out:', error)
    }
}
</script>
