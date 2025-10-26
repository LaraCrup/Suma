<template>
    <DefaultSection class="gap-6">
        <NavigationBackArrow color="text-green-light" />
        <div class="flex flex-col items-center gap-2">
            <HeadingH1 class="text-center">¡Verificá tu correo para continuar!</HeadingH1>
            <p class="text-xs text-center">Mirá tu bandeja de entrada. Te mandamos un correo a <span class="font-bold">lara.crupnicoff@davinci.edu.ar</span> para restablecer tu contraseña.</p>
        </div>
        <div class="w-full flex flex-col items-center gap-3">
            <ButtonSecondary>Reenviar correo</ButtonSecondary>
            <ButtonPrimary :to="ROUTE_NAMES.RESET_PASSWORD">Correo incorrecto, modificar</ButtonPrimary>
        </div>
    </DefaultSection>
</template>

<script setup>
    import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

    definePageMeta({
        layout: "auth",
    });

</script>