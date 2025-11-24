<template>
    <DefaultSection class="w-full flex flex-col items-center gap-2">
        <div class="w-full flex gap-3">
            <NavigationBackArrow class="!w-fit text-gray" />
            <HeadingH1 class="w-full">Cambiar contraseña</HeadingH1>
        </div>
        <p class="text-xs text-center">Elegí una nueva contraseña segura para tu cuenta.</p>

        <FormLayout @submit.prevent="handleChangePassword">
            <FormFieldsContainer>
                <FormPasswordField v-model="form.currentPassword" label="Contraseña actual" id="currentPassword"
                    placeholder="Tu contraseña actual" :error="errors.currentPassword" required
                    @blur="validateCurrentPassword" />

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

            <ButtonPrimary type="submit" :disabled="loading" class="!px-4">
                <span v-if="!loading" class="!w-fit">Actualizar contraseña</span>
                <span v-else class="flex items-center justify-center gap-2"><Loader color="light" />Actualizando contraseña...</span>
            </ButtonPrimary>
        </FormLayout>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

const client = useSupabaseClient()
const router = useRouter()
const { success } = useNotification()

const form = reactive({
    currentPassword: '',
    password: '',
    confirmPassword: ''
})

const errors = reactive({
    currentPassword: '',
    password: '',
    confirmPassword: ''
})

const loading = ref(false)
const errorMsg = ref('')
const passwordUpdateAttempted = ref(false)

const validateCurrentPassword = () => {
    if (!form.currentPassword) {
        errors.currentPassword = 'Debes ingresar tu contraseña actual'
    } else {
        errors.currentPassword = ''
    }
}

const validatePassword = () => {
    if (!form.password) {
        errors.password = 'La contraseña es requerida'
        return false
    }

    if (form.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres'
        return false
    }

    if (!/[a-z]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos una minúscula'
        return false
    }

    if (!/[A-Z]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos una mayúscula'
        return false
    }

    if (!/[0-9]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos un número'
        return false
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos un carácter especial'
        return false
    }

    errors.password = ''

    if (form.confirmPassword) {
        validateConfirmPassword()
    }

    return true
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

const handleChangePassword = async () => {
    if (passwordUpdateAttempted.value) {
        errorMsg.value = 'El proceso de actualización ya está en curso. Por favor espere.'
        return
    }

    errorMsg.value = ''
    validateCurrentPassword()
    validatePassword()
    validateConfirmPassword()

    if (errors.currentPassword || errors.password || errors.confirmPassword) {
        return
    }

    loading.value = true
    passwordUpdateAttempted.value = true

    try {
        // Primero obtener el email del usuario actual
        const { data: { user }, error: userError } = await client.auth.getUser()

        if (userError || !user?.email) {
            errorMsg.value = 'Error al obtener datos del usuario'
            passwordUpdateAttempted.value = false
            loading.value = false
            return
        }

        // Validar la contraseña actual intentando hacer sign-in
        const { error: signInError } = await client.auth.signInWithPassword({
            email: user.email,
            password: form.currentPassword
        })

        if (signInError) {
            errorMsg.value = 'La contraseña actual es incorrecta'
            passwordUpdateAttempted.value = false
            loading.value = false
            return
        }

        // Si la contraseña actual es correcta, actualizar a la nueva
        const { error } = await client.auth.updateUser({
            password: form.password
        })

        if (error) {
            errorMsg.value = handleSupabaseError(error)
            passwordUpdateAttempted.value = false
        } else {
            form.currentPassword = ''
            form.password = ''
            form.confirmPassword = ''

            success('¡Contraseña actualizada exitosamente!', {
                title: 'Contraseña cambiada',
                duration: 7000
            })

            await router.push(ROUTE_NAMES.PROFILE)
        }

    } catch (error) {
        console.error('Error al cambiar contraseña:', error)
        errorMsg.value = 'Error al cambiar la contraseña'
        passwordUpdateAttempted.value = false
    } finally {
        loading.value = false
    }
}

watch(() => form.currentPassword, () => {
    if (errors.currentPassword) errors.currentPassword = ''
})

watch(() => form.password, () => {
    if (errors.password) errors.password = ''
})

watch(() => form.confirmPassword, () => {
    if (errors.confirmPassword) errors.confirmPassword = ''
})
</script>