<template>
    <DefaultSection class="gap-6">
        <div class="w-full flex flex-col items-center gap-2">
            <HeadingH1>¡Que bueno verte!</HeadingH1>
            <p class="text-xs">Tu progreso te espera.</p>
        </div>

        <FormLayout @submit.prevent="handleSignIn" class="gap-6">
            <FormFieldsContainer>
                <FormTextField v-model="form.username" label="Nombre de usuario" id="nombre-usuario" type="text"
                    placeholder="Nombre de usuario" autocomplete="username" :error="errors.username" required
                    @blur="validateUsername" />

                <FormPasswordField v-model="form.password" label="Contraseña" id="contrasena" placeholder="********"
                    :error="errors.password" required @blur="validatePassword" />
            </FormFieldsContainer>

            <NuxtLink :to="ROUTE_NAMES.FORGOT_PASSWORD" class="text-primary text-xs underline">
                ¿Olvidaste tu contraseña?
            </NuxtLink>

            <FormError v-if="errorMsg">
                {{ errorMsg }}
            </FormError>

            <ButtonPrimary type="submit" :disabled="isLoading">
                <span v-if="!isLoading">Ingresar</span>
                <Loader v-else color="light" />
            </ButtonPrimary>
        </FormLayout>
        <p class="flex flex-col items-center text-xs">¿Todavía no tenés cuenta?<NuxtLink :to="ROUTE_NAMES.REGISTER"
                class="block text-primary underline">
                Registrate y empezá a sumar.</NuxtLink>
        </p>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

definePageMeta({
    layout: "auth",
});

const client = useSupabaseClient();
const router = useRouter();

const form = reactive({
    username: '',
    password: ''
})

const errors = reactive({
    username: '',
    password: ''
})

const isLoading = ref(false)
const errorMsg = ref('');

const validateUsername = () => {
    if (!form.username) {
        errors.username = 'El nombre de usuario es requerido'
    } else if (form.username.length < 3) {
        errors.username = 'El nombre debe tener al menos 3 caracteres'
    } else {
        errors.username = ''
    }
}

const validatePassword = () => {
    if (!form.password) {
        errors.password = 'La contraseña es requerida'
    } else {
        errors.password = ''
    }
}

watch(() => form.username, () => {
    if (errors.username) errors.username = ''
})

watch(() => form.password, () => {
    if (errors.password) errors.password = ''
})

const handleSignIn = async () => {
    isLoading.value = true
    errorMsg.value = ''

    validateUsername()
    validatePassword()

    if (errors.username || errors.password) {
        isLoading.value = false
        return
    }

    try {
        const { data: profile } = await client
            .from('profiles')
            .select('email')
            .eq('display_name', form.username)
            .maybeSingle()

        if (!profile?.email) {
            errorMsg.value = 'Usuario no encontrado'
            isLoading.value = false
            return
        }

        const { error } = await client.auth.signInWithPassword({
            email: profile.email,
            password: form.password
        })

        if (error) {
            errorMsg.value = handleSupabaseError(error)
            return
        }

        localStorage.setItem('lastLoginUsername', form.username)
        await router.push(ROUTE_NAMES.HOME)

    } catch (error) {
        console.error('Error en login:', error)
        errorMsg.value = 'Credenciales incorrectas'
    } finally {
        isLoading.value = false
    }
}

</script>