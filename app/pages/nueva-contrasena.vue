<template>
    <DefaultSection>
        <div class="flex flex-col items-center gap-2">
            <HeadingH1>Creá tu nueva contraseña</HeadingH1>
            <p class="text-xs text-center">Elegí una nueva contraseña segura y volvé a tu progreso.</p>
        </div>

        <FormLayout @submit.prevent="handleResetPassword">
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

            <ButtonPrimary type="submit">
                <span v-if="!loading">Actualizar contraseña</span>
                <span v-else class="flex justify-center items-center gap-2">
                    <Icon name="tabler:loader-2" class="animate-spin" />
                    Actualizando...
                </span>
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
const route = useRoute()

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

const isValid = computed(() => {
    return form.password.length > 0 &&
        form.confirmPassword.length > 0 &&
        !errors.password &&
        !errors.confirmPassword &&
        form.password === form.confirmPassword
})

onMounted(async () => {
    try {
        const { data, error } = await client.auth.getSession()
        if (error) {
            console.warn('Error al verificar sesión:', error)
        }
    } catch (error) {
        console.error('Error al inicializar recuperación:', error)
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

    loading.value = true
    errorMsg.value = ''
    passwordUpdateAttempted.value = true

    validatePassword()
    validateConfirmPassword()

    if (errors.password || errors.confirmPassword) {
        loading.value = false
        passwordUpdateAttempted.value = false
        return
    }

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

            success('¡Contraseña actualizada exitosamente!', {
                title: 'Contraseña cambiada',
                duration: 7000
            })

            await router.push(ROUTE_NAMES.LOGIN)
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