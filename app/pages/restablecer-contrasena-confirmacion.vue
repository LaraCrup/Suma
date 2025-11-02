<template>
    <DefaultSection class="gap-6">
        <NavigationBackArrow color="text-green-light" />
        <div class="flex flex-col items-center gap-2">
            <HeadingH1 class="text-center">¡Verificá tu correo para continuar!</HeadingH1>
            <p class="text-xs text-center">Mirá tu bandeja de entrada. Te mandamos un correo a <span class="font-bold">{{ userEmail }}</span> para restablecer tu contraseña.</p>
        </div>

        <FormError v-if="errorMsg">
            {{ errorMsg }}
        </FormError>

        <div class="w-full flex flex-col items-center gap-3">
            <ButtonSecondary :disabled="loading || resendCountdown > 0" @click="handleResendEmail">
                <span v-if="!loading && resendCountdown === 0">Reenviar correo</span>
                <Loader v-else-if="loading" color="light" />
                <span v-else>Reenviar en {{ resendCountdown }}s</span>
            </ButtonSecondary>
            <ButtonPrimary :to="ROUTE_NAMES.RESET_PASSWORD">Correo incorrecto, modificar</ButtonPrimary>
        </div>
    </DefaultSection>
</template>

<script setup>
    import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

    definePageMeta({
        layout: "auth",
    });

    const client = useSupabaseClient()
    const router = useRouter()
    const { success } = useNotification()

    const userEmail = ref('')
    const loading = ref(false)
    const errorMsg = ref('')
    const resendCountdown = ref(0)
    const resendAttempted = ref(false)

    onMounted(async () => {
        // Get the email from sessionStorage or redirect
        const storedEmail = sessionStorage.getItem('resetPasswordEmail')

        if (!storedEmail) {
            await router.push(ROUTE_NAMES.RESET_PASSWORD)
            return
        }

        userEmail.value = storedEmail
    })

    const handleResendEmail = async () => {
        if (resendAttempted.value) {
            errorMsg.value = 'El reenvío ya está en curso. Por favor espere.'
            return
        }

        errorMsg.value = ''
        loading.value = true
        resendAttempted.value = true

        try {
            const { error } = await client.auth.resetPasswordForEmail(userEmail.value, {
                redirectTo: `${window.location.origin}/nueva-contrasena`
            })

            if (error) {
                errorMsg.value = handleSupabaseError(error)
                resendAttempted.value = false
            } else {
                success('Correo reenviado exitosamente', {
                    title: 'Correo enviado',
                    duration: 5000
                })

                // Start countdown
                resendCountdown.value = 60
                const interval = setInterval(() => {
                    resendCountdown.value--
                    if (resendCountdown.value <= 0) {
                        clearInterval(interval)
                        resendAttempted.value = false
                    }
                }, 1000)
            }

        } catch (error) {
            console.error('Error al reenviar correo:', error)
            errorMsg.value = 'Error al reenviar el correo'
            resendAttempted.value = false
        } finally {
            loading.value = false
        }
    }
</script>