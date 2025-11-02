<template>
    <DefaultSection class="gap-6">
        <div class="flex flex-col items-center gap-2">
            <HeadingH1 class="text-center">¡Estás a un click de empezar a sumar!</HeadingH1>
            <p class="text-xs text-center">Te enviamos un correo a <span class="font-bold">{{ userEmail || 'tu correo electrónico' }}</span>. Revisá tu bandeja de entrada para confirmar tu cuenta.</p>
        </div>
        <div class="w-full flex flex-col items-center gap-3">
            <ButtonSecondary @click="resendEmail" :disabled="isWaiting">
                Reenviar correo de confirmación
            </ButtonSecondary>
            <p v-if="message" :class="['text-xs text-center', isError ? 'text-error' : 'text-green-light']">
                {{ message }}
            </p>
            <ButtonPrimary :to="ROUTE_NAMES.LOGIN">Acceder a mi cuenta</ButtonPrimary>
        </div>
    </DefaultSection>
</template>

<script setup>
    import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

    definePageMeta({
        layout: "auth",
    });

    const client = useSupabaseClient()

    const userEmail = ref('')
    const message = ref('')
    const isError = ref(false)
    const isWaiting = ref(false)
    const waitSeconds = ref(0)
    let waitInterval = null

    onMounted(() => {
        // Obtener el email del sessionStorage que se guardó en registrarse.vue
        if (typeof window !== 'undefined') {
            const email = sessionStorage.getItem('confirmationEmail')
            if (email) {
                userEmail.value = email
            }
        }
    })

    const resendEmail = async () => {
        // No hacer nada si aún está en espera
        if (isWaiting.value) {
            return
        }

        try {
            // Limpiar mensaje anterior
            message.value = ''

            // Usar el email guardado en sessionStorage
            if (!userEmail.value) {
                message.value = 'No se pudo obtener tu correo electrónico'
                isError.value = true
                return
            }

            const baseUrl = window.location.origin
            const { error } = await client.auth.resend({
                type: 'signup',
                email: userEmail.value,
                options: {
                    emailRedirectTo: `${baseUrl}${ROUTE_NAMES.LOGIN}`
                }
            })

            if (error) {
                const errorMsg = handleSupabaseError(error)
                message.value = errorMsg
                isError.value = true
            } else {
                message.value = 'Correo de confirmación reenviado exitosamente. Revisa tu bandeja de entrada.'
                isError.value = false

                // Iniciar cooldown de 60 segundos
                isWaiting.value = true
                waitSeconds.value = 60

                if (waitInterval) clearInterval(waitInterval)
                waitInterval = setInterval(() => {
                    waitSeconds.value--
                    if (waitSeconds.value <= 0) {
                        isWaiting.value = false
                        message.value = ''
                        clearInterval(waitInterval)
                    }
                }, 1000)
            }
        } catch (err) {
            message.value = 'Error al reenviar el correo'
            isError.value = true
            console.error('Error:', err)
        }
    }

    onUnmounted(() => {
        if (waitInterval) clearInterval(waitInterval)
    })

</script>