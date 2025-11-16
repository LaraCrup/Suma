<template>
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="close"></div>
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end">
        <div
            class="relative w-full flex flex-col gap-3 items-center bg-light rounded-t-3xl p-5 pb-6 max-h-[90vh] overflow-y-auto">
            <button @click="close" class="absolute top-4 right-4 text-gray">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="w-full flex flex-col items-center gap-3">
                <div class="w-9 h-9 flex justify-center items-center bg-gradient-secondary rounded-full">
                    <NuxtImg src="/images/icons/delete-accent.svg" alt="Icono Borrar" />
                </div>
                <p>{{ message }}</p>
            </div>
            <div class="w-full flex flex-col items-center gap-2 mt-4">
                <ButtonPrimary type="button" @click="confirm">Si, eliminar permanentemente</ButtonPrimary>
                <ButtonTerciary type="button" @click="close">Cancelar</ButtonTerciary>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    message: {
        type: String,
        default: '¿Estás seguro que queres eliminar este hábito de manera permanente?'
    }
})

const emit = defineEmits(['confirm', 'close'])

const confirm = () => {
    emit('confirm')
}

const close = () => {
    emit('close')
}
</script>