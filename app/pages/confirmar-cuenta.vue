<template>
    <DefaultSection class="gap-6">
        <div class="flex flex-col items-center gap-2">
            <HeadingH1 class="text-center">¡Estás a un click de empezar a sumar!</HeadingH1>
            <p class="text-xs text-center">Te enviamos un correo a <span class="font-bold">lara.crupnicoff@davinci.edu.ar</span>. Revisá tu bandeja de entrada para confirmar tu cuenta.</p>
        </div>
        <div class="w-full flex flex-col items-center gap-3">
            <ButtonSecondary>Reenviar correo de confirmación</ButtonSecondary>
            <ButtonPrimary :to="ROUTE_NAMES.LOGIN">Acceder a mi cuenta</ButtonPrimary>
        </div>
    </DefaultSection>
</template>

<script setup>
    import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

    definePageMeta({
        layout: "auth",
    });

</script>