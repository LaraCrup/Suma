<template>
    <DefaultSection>
        <HeadingH1>Registrarse</HeadingH1>

        <FormLayout @submit.prevent="signUp">
            <FormFieldsContainer>
                <FormTextField v-model="form.email" label="Correo electrónico" id="email" type="email"
                    placeholder="Correo electrónico" autocomplete="email" :error="errors.email" required
                    @blur="validateEmail" />
                <FormTextField v-model="form.displayName" label="Nombre de usuario" id="displayName" type="text"
                    placeholder="Nombre de usuario" autocomplete="name" :error="errors.displayName" required
                    @blur="validateDisplayName" />
            </FormFieldsContainer>
            <FormFieldsContainer>
                <FormPasswordField v-model="form.password" label="Contraseña" id="password" placeholder="********"
                    autocomplete="new-password" :error="errors.password" required @blur="handlePasswordInput" />

                <FormPasswordField v-model="form.passwordConfirm" label="Confirmar contraseña" id="passwordConfirm"
                    placeholder="********" autocomplete="new-password" :error="errors.passwordConfirm" required
                    @blur="validatePasswordConfirm" />
            </FormFieldsContainer>
            <FormError v-if="errorMsg">
                {{ errorMsg }}
            </FormError>

            <ButtonPrimary type="submit" class="lg:!px-48" :disabled="loading || !isValid">
                <span v-if="!loading">Registrarse</span>
                <span v-else class="flex justify-center items-center gap-2">
                    <Icon name="tabler:loader-2" class="animate-spin" />
                    Registrando...
                </span>
            </ButtonPrimary>
        </FormLayout>
        <p class="flex flex-col items-center text-xs">¿Ya tenés cuenta?<NuxtLink :to="ROUTE_NAMES.LOGIN"
                class="block text-primary underline">
                Iniciá sesión y seguí sumando.</NuxtLink>
        </p>
    </DefaultSection>

</template>


<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

definePageMeta({
    layout: "auth",
});

const client = useSupabaseClient()
const router = useRouter()
// const { success } = useNotification()

const form = reactive({
    displayName: '',
    email: '',
    password: '',
    passwordConfirm: ''
})

const errors = reactive({
    displayName: '',
    email: '',
    password: '',
    passwordConfirm: ''
})

const loading = ref(false)
const checkingPassword = ref(false)
const errorMsg = ref('')
const isPasswordCompromised = ref(false)
const passwordCheckCache = reactive(new Map())
const passwordCheckTimeout = ref(null)

const isValid = computed(() => {
    return form.displayName.length > 0 &&
        form.email.length > 0 &&
        form.password.length > 0 &&
        form.passwordConfirm.length > 0 &&
        !errors.displayName &&
        !errors.email &&
        !errors.password &&
        !errors.passwordConfirm &&
        !isPasswordCompromised.value
})

const validateDisplayName = () => {
    if (!form.displayName) {
        errors.displayName = 'El nombre para mostrar es requerido'
    } else if (form.displayName.length < 2) {
        errors.displayName = 'El nombre debe tener al menos 2 caracteres'
    } else if (form.displayName.length > 50) {
        errors.displayName = 'El nombre no puede tener más de 50 caracteres'
    } else {
        errors.displayName = ''
    }
}

const validateEmail = () => {
    if (!form.email) {
        errors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Formato de correo electrónico inválido'
    } else {
        errors.email = ''
    }
}

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

    if (form.passwordConfirm) {
        validatePasswordConfirm()
    }

    return true
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

const validatePasswordConfirm = () => {
    if (!form.passwordConfirm) {
        errors.passwordConfirm = 'La confirmación de contraseña es requerida'
        return false
    }

    if (form.passwordConfirm !== form.password) {
        errors.passwordConfirm = 'Las contraseñas no coinciden'
        return false
    }

    errors.passwordConfirm = ''
    return true
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

const signUp = async () => {
    loading.value = true
    errorMsg.value = ''

    validateDisplayName()
    validateEmail()
    validatePassword()
    validatePasswordConfirm()

    if (errors.displayName || errors.email || errors.password || errors.passwordConfirm || isPasswordCompromised.value) {
        loading.value = false
        return
    }

    try {
        sessionStorage.setItem('lastRegisteredEmail', form.email)

        const baseUrl = window.location.origin
        const loginPath = ROUTE_NAMES.LOGIN

        const { data, error } = await client.auth.signUp({
            email: form.email,
            password: form.password,
            options: {
                emailRedirectTo: `${baseUrl}${loginPath}`,
                data: {
                    display_name: form.displayName
                }
            }
        })

        if (error) {
            errorMsg.value = handleSupabaseError(error)
            loading.value = false
            return
        }

        form.displayName = ''
        form.email = ''
        form.password = ''
        form.passwordConfirm = ''

        success('¡Cuenta creada exitosamente! Revisa tu correo para confirmar tu cuenta.', {
            title: 'Registro exitoso',
            duration: 20000
        })

        await router.push(ROUTE_NAMES.LOGIN)

    } catch (error) {
        console.error('Error en registro:', error)
        errorMsg.value = 'Error al crear la cuenta'
    } finally {
        loading.value = false
    }
}

watch(() => form.displayName, () => {
    if (errors.displayName) errors.displayName = ''
})

watch(() => form.email, () => {
    if (errors.email) errors.email = ''
})

watch(() => form.password, () => {
    if (errors.password) errors.password = ''
})

watch(() => form.passwordConfirm, () => {
    if (errors.passwordConfirm) errors.passwordConfirm = ''
})

onUnmounted(() => {
    if (passwordCheckTimeout.value) {
        clearTimeout(passwordCheckTimeout.value)
    }
})
</script>