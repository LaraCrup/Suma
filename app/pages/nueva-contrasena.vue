<template>
    <DefaultSection v-if="!linkValidating">
        <div v-if="linkValid" class="flex flex-col items-center gap-2">
            <HeadingH1>Creá tu nueva contraseña</HeadingH1>
            <p class="text-xs text-center">Elegí una nueva contraseña segura y volvé a tu progreso.</p>
        </div>

        <FormLayout v-if="linkValid" @submit.prevent="handleResetPassword">
            <FormFieldsContainer>
                <FormPasswordField v-model="form.password" label="Nueva contraseña" id="password"
                    placeholder="Nueva contraseña" :error="errors.password" required
                    @blur="validatePassword" />

                <FormPasswordField v-model="form.confirmPassword" label="Confirmar contraseña" id="confirmPassword"
                    placeholder="Repetir nueva contraseña" :error="errors.confirmPassword" required
                    @blur="validateConfirmPassword" />
            </FormFieldsContainer>

            <FormError v-if="errorMsg">
                {{ errorMsg }}
            </FormError>

            <ButtonPrimary type="submit" :disabled="loading">
                <span v-if="!loading">Actualizar contraseña</span>
                <Loader v-else color="light" />
            </ButtonPrimary>
        </FormLayout>

        <div v-else class="flex flex-col items-center gap-4">
            <div class="text-center">
                <HeadingH1 class="text-red-500 mb-2">Enlace inválido o expirado</HeadingH1>
                <p class="text-xs text-gray-500">{{ linkErrorMsg }}</p>
            </div>
            <ButtonPrimary :to="ROUTE_NAMES.RESET_PASSWORD">Solicitar nuevo enlace</ButtonPrimary>
        </div>
    </DefaultSection>

    <DefaultSection v-else class="flex flex-col items-center justify-center gap-4">
        <div class="text-4xl">⏳</div>
        <p class="text-sm text-gray-500">Verificando tu enlace de recuperación...</p>
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
    password: '',
    confirmPassword: ''
})

const errors = reactive({
    password: '',
    confirmPassword: ''
})

const loading = ref(false)
const errorMsg = ref('')
const passwordUpdateAttempted = ref(false)
const linkValidating = ref(true)
const linkValid = ref(false)
const linkErrorMsg = ref('')

onMounted(async () => {
    try {
        const { data: { session }, error } = await client.auth.getSession()

        if (error || !session) {
            linkValid.value = false
            linkErrorMsg.value = 'Tu enlace de recuperación ha expirado. Por favor solicita uno nuevo.'
            linkValidating.value = false
            return
        }

        linkValid.value = true
        linkValidating.value = false

    } catch (error) {
        console.error('Error al verificar sesión:', error)
        linkValid.value = false
        linkErrorMsg.value = 'Error al verificar el enlace de recuperación. Por favor intenta nuevamente.'
        linkValidating.value = false
    }
})

const validatePassword = () => {
    if (!form.password) {
        errors.password = 'La contraseña es requerida'
    } else if (form.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres'
    } else {
        errors.password = ''
    }

    if (form.confirmPassword) {
        validateConfirmPassword()
    }
}

const validateConfirmPassword = () => {
    if (!form.confirmPassword) {
        errors.confirmPassword = 'Debe confirmar la contraseña'
    } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden'
    } else {
        errors.confirmPassword = ''
    }
}

const handleResetPassword = async () => {
    if (passwordUpdateAttempted.value) {
        errorMsg.value = 'El proceso de actualización ya está en curso. Por favor espere.'
        return
    }

    errorMsg.value = ''
    validatePassword()
    validateConfirmPassword()

    if (errors.password || errors.confirmPassword) {
        return
    }

    loading.value = true
    passwordUpdateAttempted.value = true

    try {
        const { error } = await client.auth.updateUser({
            password: form.password
        })

        if (error) {
            errorMsg.value = handleSupabaseError(error)
            passwordUpdateAttempted.value = false
        } else {
            form.password = ''
            form.confirmPassword = ''
            sessionStorage.removeItem('resetPasswordEmail')

            success('¡Contraseña actualizada exitosamente!', {
                title: 'Contraseña cambiada',
                duration: 7000
            })

            await router.push(ROUTE_NAMES.PASSWORD_UPDATED)
        }

    } catch (error) {
        console.error('Error al restablecer contraseña:', error)
        errorMsg.value = 'Error al restablecer la contraseña'
        passwordUpdateAttempted.value = false
    } finally {
        loading.value = false
    }
}

watch(() => form.password, () => {
    if (errors.password) errors.password = ''
})

watch(() => form.confirmPassword, () => {
    if (errors.confirmPassword) errors.confirmPassword = ''
})
</script>