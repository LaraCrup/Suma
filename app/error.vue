<template>
    <div class="w-screen h-screen flex flex-col justify-center items-center gap-4 px-6 text-center">
        <HeadingH1>Error {{ statusCode }}</HeadingH1>
        <p>{{ message }}</p>
        <button type="button" @click="handleBack"
            class="flex justify-center text-center text-light text-xs 2xl:text-sm bg-primary rounded-full py-3 px-12">
            Volver al inicio
        </button>
    </div>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES.js'

const props = defineProps({
    error: {
        type: Object,
        default: () => ({}),
    },
})

const statusCode = computed(() => props.error?.statusCode || 500)

const message = computed(() =>
    statusCode.value === 404
        ? 'La página que buscás no existe o fue movida.'
        : 'Algo salió mal. Probá de nuevo en unos minutos.'
)

useSeoTags({
    title: () => (statusCode.value === 404 ? 'Página no encontrada' : 'Error inesperado'),
    description: () => message.value,
})

const handleBack = () => clearError({ redirect: ROUTE_NAMES.HOME })
</script>
