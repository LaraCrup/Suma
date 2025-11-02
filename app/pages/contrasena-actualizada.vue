<template>
    <DefaultSection class="gap-6">
        <div class="flex flex-col items-center gap-6">
            <HeadingH1 class="text-center">¡Contraseña actualizada!</HeadingH1>
            <p class="text-xs text-center">Tu contraseña ha sido cambiada exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.</p>
        </div>

        <div class="w-full flex flex-col items-center">
            <ButtonPrimary :to="ROUTE_NAMES.LOGIN">Iniciar sesión</ButtonPrimary>
        </div>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

definePageMeta({
    layout: "auth",
});

</script>
