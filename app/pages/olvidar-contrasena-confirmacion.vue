<template>
    <DefaultSection>
        <HeadingH1>Restablecer contraseña</HeadingH1>

        <!-- <div class="flex flex-col items-center gap-4 lg:gap-7">
            <div class="flex flex-col items-center gap-4 lg:gap-6">
                <p class="text-center text-dark lg:text-xl">
                    Se envió un correo electrónico a <strong>{{ email }}</strong> para poder
                    reestablecer la contraseña.
                </p>

                <div class="w-full flex justify-center items-center gap-2">
                    <p class="text-dark lg:text-xl">¿El correo electrónico indicado no es correcto?</p>
                    <NuxtLink :to="ROUTE_NAMES.FORGOT_PASSWORD" class="text-dark font-light underline lg:text-xl">
                        Modificar
                    </NuxtLink>
                </div>

                <ButtonPrimary @click="goToLogin">
                    Volver a Iniciar Sesión
                </ButtonPrimary>
            </div>
        </div> -->
    </DefaultSection>
</template>

<!-- <script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

definePageMeta({
    layout: "auth",
});

const route = useRoute()
const router = useRouter()
const email = ref('')

const goToLogin = () => {
    router.push(ROUTE_NAMES.LOGIN)
}

watch(() => route.query.email, (newEmail) => {
    if (newEmail) {
        email.value = newEmail
    }
}, { immediate: true })
</script> -->