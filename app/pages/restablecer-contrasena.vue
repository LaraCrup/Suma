<template>
    <DefaultSection class="gap-6">
        <NavigationBackArrow color="text-green-light" />
        <div class="flex flex-col items-center gap-2">
            <HeadingH1 class="text-center">Te ayudamos a volver a suma</HeadingH1>
            <p class="text-xs text-center">Te mandaremos un correo con un enlace para que puedas restablecer tu
                contraseña.</p>
        </div>

        <FormLayout @submit.prevent="handleResetPassword">

            <FormTextField v-model="form.email" label="Correo electrónico" id="email" type="email"
                placeholder="Correo electrónico" autocomplete="email" :error="errors.email" required
                @blur="validateEmail" />

            <FormError v-if="errorMsg">
                {{ errorMsg }}
            </FormError>

            <ButtonPrimary type="submit" :disabled="loading">
                <span v-if="!loading">Recuperar acceso</span>
                <Loader v-else color="light" />
            </ButtonPrimary>
        </FormLayout>
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

const form = reactive({
    email: ''
})

const errors = reactive({
    email: ''
})

const loading = ref(false)
const errorMsg = ref('')
const emailSendAttempted = ref(false)

const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!form.email) {
        errors.email = 'El correo electrónico es requerido'
    } else if (!emailRegex.test(form.email)) {
        errors.email = 'Ingresa un correo electrónico válido'
    } else {
        errors.email = ''
    }
}

const handleResetPassword = async () => {
    if (emailSendAttempted.value) {
        errorMsg.value = 'El proceso de recuperación ya está en curso. Por favor espere.'
        return
    }

    errorMsg.value = ''
    validateEmail()

    if (errors.email) {
        return
    }

    loading.value = true
    emailSendAttempted.value = true

    try {
        const { error } = await client.auth.resetPasswordForEmail(form.email, {
            redirectTo: `${window.location.origin}/nueva-contrasena`
        })

        if (error) {
            errorMsg.value = handleSupabaseError(error)
            emailSendAttempted.value = false
        } else {
            sessionStorage.setItem('resetPasswordEmail', form.email)
            form.email = ''

            success('Te hemos enviado un correo de recuperación', {
                title: 'Correo enviado',
                duration: 7000
            })

            await router.push(ROUTE_NAMES.RESET_PASSWORD_CONFIRMATION)
        }

    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error)
        errorMsg.value = 'Error al enviar el correo de recuperación'
        emailSendAttempted.value = false
    } finally {
        loading.value = false
    }
}

watch(() => form.email, () => {
    if (errors.email) errors.email = ''
})
</script>