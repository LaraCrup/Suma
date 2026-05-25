<template>
    <div v-if="store.visible" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="decline"></div>
    <div v-if="store.visible" class="fixed inset-0 z-50 flex items-end">
        <div class="relative w-full flex flex-col gap-4 items-center bg-light rounded-t-3xl p-5 pb-6">
            <button @click="decline" class="absolute top-4 right-4 text-gray">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="w-full flex flex-col items-center gap-3">
                <div class="w-9 h-9 flex justify-center items-center bg-gradient-secondary rounded-full text-lg">
                    🔥
                </div>
                <p class="font-semibold text-center text-base text-dark">
                    ¡Tu racha de {{ store.current?.streak }} {{ store.current?.streak === 1 ? 'día' : 'días' }} está en riesgo!
                </p>
                <p class="text-center text-sm text-gray">
                    No completaste <span class="text-dark font-medium">"{{ store.current?.habitName }}"</span> ayer.
                    Podés usar tu gracia mensual para proteger la racha.
                </p>
                <p class="text-xs text-gray">(Disponible una vez por mes por hábito)</p>
            </div>
            <div class="w-full flex flex-col items-center gap-2">
                <ButtonPrimary type="button" :disabled="loading" @click="applyGrace">
                    {{ loading ? 'Guardando...' : 'Usar gracia mensual' }}
                </ButtonPrimary>
                <ButtonTerciary type="button" :disabled="loading" @click="decline">
                    Dejar que se rompa
                </ButtonTerciary>
            </div>
        </div>
    </div>
</template>

<script setup>
const store = useStreakGraceStore()
const { applyStreakGrace, declineStreakGrace } = useHabits()
const loading = ref(false)

const applyGrace = async () => {
    if (!store.current || loading.value) return
    loading.value = true
    await applyStreakGrace(store.current.habitId)
    loading.value = false
    store.dismiss()
}

const decline = async () => {
    if (!store.current || loading.value) return
    loading.value = true
    await declineStreakGrace(store.current.habitId)
    loading.value = false
    store.dismiss()
}
</script>
