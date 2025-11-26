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
                    @blur="handlePasswordInput" />

                <FormPasswordField v-model="form.confirmPassword" label="Confirmar contraseña" id="confirmPassword"
                    placeholder="Repetir nueva contraseña" :error="errors.confirmPassword" required
                    @blur="validateConfirmPassword" />
            </FormFieldsContainer>

            <FormError v-if="errorMsg">
                {{ errorMsg }}
            </FormError>

            <ButtonPrimary type="submit" :disabled="loading || !isValid">
                <span v-if="!loading">Actualizar contraseña</span>
                <Loader v-else color="light" />
            </ButtonPrimary>
        </FormLayout>

        <div v-else class="flex flex-col items-center gap-4">
            <div class="text-center">
                <HeadingH1 class="text-error mb-2">Enlace inválido o expirado</HeadingH1>
                <p class="text-xs text-gray-500">{{ linkErrorMsg }}</p>
            </div>
            <ButtonPrimary :to="ROUTE_NAMES.RESET_PASSWORD">Solicitar nuevo enlace</ButtonPrimary>
        </div>
    </DefaultSection>

    <DefaultSection v-else>
        <Loader color="primary" />
        <p class="text-sm text-gray">Verificando tu enlace de recuperación...</p>
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
const checkingPassword = ref(false)
const isPasswordCompromised = ref(false)
const passwordCheckCache = reactive(new Map())
const passwordCheckTimeout = ref(null)

const isValid = computed(() => {
    return form.password.length > 0 &&
        form.confirmPassword.length > 0 &&
        !errors.password &&
        !errors.confirmPassword &&
        !isPasswordCompromised.value
})

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

const handlePasswordInput = () => {
    if (passwordCheckTimeout.value) {
        clearTimeout(passwordCheckTimeout.value)
    }

    validatePassword()

    if (!errors.password && form.password && form.password.length >= 8) {
        passwordCheckTimeout.value = setTimeout(async () => {
            await checkPasswordCompromise()
        }, 800)
    }
}

const validatePassword = () => {
    if (!form.password) {
        errors.password = 'La contraseña es requerida'
        isPasswordCompromised.value = false
        return false
    }

    if (form.password.length < 8) {
        errors.password = 'La contraseña debe tener al menos 8 caracteres'
        isPasswordCompromised.value = false
        return false
    }

    if (!/[a-z]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos una minúscula'
        isPasswordCompromised.value = false
        return false
    }

    if (!/[A-Z]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos una mayúscula'
        isPasswordCompromised.value = false
        return false
    }

    if (!/[0-9]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos un número'
        isPasswordCompromised.value = false
        return false
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password)) {
        errors.password = 'La contraseña debe contener al menos un caracter especial'
        isPasswordCompromised.value = false
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

const checkPasswordCompromise = async () => {
    if (!form.password || form.password.length < 8) return

    if (passwordCheckCache.has(form.password)) {
        isPasswordCompromised.value = passwordCheckCache.get(form.password)

        if (isPasswordCompromised.value) {
            errors.password = 'Esta contraseña ha aparecido en filtraciones de datos. Por favor, utiliza una contraseña única.'
        }

        return
    }

    try {
        checkingPassword.value = true
        isPasswordCompromised.value = await checkPasswordLeak(form.password)

        passwordCheckCache.set(form.password, isPasswordCompromised.value)

        if (isPasswordCompromised.value) {
            errors.password = 'Esta contraseña ha aparecido en filtraciones de datos. Por favor, utiliza una contraseña única.'
        }
    } catch (error) {
        console.error('Error al verificar contraseña:', error)
    } finally {
        checkingPassword.value = false
    }
}

async function checkPasswordLeak(password) {
    try {
        const encoder = new TextEncoder()
        const data = encoder.encode(password)
        const hashBuffer = await crypto.subtle.digest('SHA-1', data)

        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

        const prefix = hashHex.substring(0, 5)
        const suffix = hashHex.substring(5).toUpperCase()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'NuxtSupabaseApp'
            }
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
            console.warn('Error al consultar API de contraseñas comprometidas')
            return false
        }

        const text = await response.text()

        return text.split('\r\n').some(line => {
            const [hashSuffix] = line.split(':')
            return hashSuffix.toUpperCase() === suffix
        })
    } catch (error) {
        console.error('Error al verificar contraseña:', error)
        return false
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

    if (errors.password || errors.confirmPassword || isPasswordCompromised.value) {
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

onUnmounted(() => {
    if (passwordCheckTimeout.value) {
        clearTimeout(passwordCheckTimeout.value)
    }
})
</script>