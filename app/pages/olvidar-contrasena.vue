<template>
    <DefaultSection>
        <!-- <NuxtLink :to="ROUTE_NAMES.LOGIN" class="flex items-center gap-2 self-start text-dark font-light no-underline">
            <Icon name="tabler:arrow-left" size="1.25rem" />
            Volver a Iniciar sesión
        </NuxtLink> -->

        <HeadingH1>Restablecer contraseña</HeadingH1>

        <!-- <div class="flex flex-col items-center gap-4 lg:gap-6">
            <p class="text-dark lg:text-xl">
                Ingrese el correo electrónico de su cuenta para poder reestablecer su contraseña.
            </p>

            <FormLayout @submit.prevent="handleForgotPassword">
                <FormFieldsContainer>
                    <FormTextField v-model="form.email" label="Correo electrónico" id="email" type="email"
                        placeholder="stevejobs@gmail.com" autocomplete="email" :error="errors.email" required
                        @blur="validateEmail" />
                </FormFieldsContainer>

                <FormError v-if="errorMsg">
                    {{ errorMsg }}
                </FormError>

                <ButtonPrimary :disabled="loading || !isValid" @click="handleForgotPassword">
                    <span v-if="!loading">Restablecer contraseña</span>
                    <span v-else class="flex justify-center items-center gap-2">
                        <Icon name="tabler:loader-2" class="animate-spin" />
                        Enviando...
                    </span>
                </ButtonPrimary>
            </FormLayout>
        </div> -->
    </DefaultSection>
</template>

<!-- <script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

definePageMeta({
    layout: "auth",
});

const client = useSupabaseClient()
const router = useRouter()

const form = reactive({
    email: ''
})

const errors = reactive({
    email: ''
})

const loading = ref(false)
const errorMsg = ref('')
const emailRequestCache = ref(new Set())

const isValid = computed(() => {
    return form.email.length > 0 && !errors.email
})

onMounted(() => {
    const lastEmail = localStorage.getItem('lastLoginEmail')
    if (lastEmail) {
        form.email = lastEmail
    }
})

const validateEmail = () => {
    if (!form.email) {
        errors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Formato de correo electrónico inválido'
    } else {
        errors.email = ''
    }
}

const handleForgotPassword = async () => {
    loading.value = true
    errorMsg.value = ''

    validateEmail()

    if (errors.email || !form.email.trim()) {
        loading.value = false
        return
    }

    const cleanEmail = form.email.trim()
    if (emailRequestCache.value.has(cleanEmail)) {
        loading.value = false
        errorMsg.value = 'Ya se ha enviado un correo a esta dirección en los últimos minutos. Por favor, revisa tu bandeja de entrada'
        return
    }

    try {
        const baseUrl = import.meta.env.PROD
            ? 'https://cms-unikegroup.vercel.app'
            : 'http://localhost:3000'

        const redirectUrl = `${baseUrl}${ROUTE_NAMES.RESET_PASSWORD}`

        const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: redirectUrl
        })

        if (error) {
            errorMsg.value = handleSupabaseError(error)
            loading.value = false
            return
        }

        emailRequestCache.value.add(cleanEmail)
        setTimeout(() => {
            emailRequestCache.value.delete(cleanEmail)
        }, 120000)

        await router.push({
            path: ROUTE_NAMES.FORGOT_PASSWORD_CONFIRMATION,
            query: { email: cleanEmail }
        })

        resetForm()
    } catch (error) {
        console.error('Error al enviar correo de recuperación:', error)
        errorMsg.value = 'Ha ocurrido un error al restablecer la contraseña'
    } finally {
        loading.value = false
    }
}

const resetForm = () => {
    form.email = ''
    errors.email = ''
    errorMsg.value = ''
}

watch(() => form.email, () => {
    if (errors.email) errors.email = ''
})
</script> -->