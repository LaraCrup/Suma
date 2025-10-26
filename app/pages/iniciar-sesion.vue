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

            <ButtonPrimary type="submit">
                <span v-if="!isLoading">Ingresar</span>
                <!-- <span v-else class="flex justify-center items-center gap-2">
                    <Icon name="tabler:loader-2" class="animate-spin" />
                    Iniciando sesión...
                </span> -->
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
    email: '',
    password: ''
})

const errors = reactive({
    email: '',
    password: ''
})

const isLoading = ref(false)
const errorMsg = ref('');

const validateEmail = () => {
    if (!form.email) {
        errors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'Formato de correo electrónico inválido'
    } else {
        errors.email = ''
    }
}

const validatePassword = () => {
    if (!form.password) {
        errors.password = 'La contraseña es requerida'
    } else {
        errors.password = ''
    }
}

watch(() => form.email, () => {
    if (errors.email) errors.email = ''
})

watch(() => form.password, () => {
    if (errors.password) errors.password = ''
})

const handleSignIn = async () => {
    isLoading.value = true;
    errorMsg.value = '';

    validateEmail()
    validatePassword()

    if (errors.email || errors.password) {
        isLoading.value = false
        return
    }

    try {
        localStorage.setItem('lastLoginEmail', form.email);
        errorMsg.value = '';
        const { error } = await client.auth.signInWithPassword({
            email: form.email,
            password: form.password,
            options: {
                staySignedIn: true
            }
        });

        if (error) {
            errorMsg.value = handleSupabaseError(error);
        }

        router.push(ROUTE_NAMES.HOME)

    } catch (error) {
        console.error('Error en login:', error)
        errors.password = 'Credenciales incorrectas'
    } finally {
        isLoading.value = false
    }
}

</script>