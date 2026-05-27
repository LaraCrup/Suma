<template>
    <div v-if="store.visible" class="fixed inset-0 z-40 bg-dark bg-opacity-50"></div>
    <div v-if="store.visible" class="fixed inset-0 z-50 flex items-end">
        <div class="relative w-full flex flex-col gap-4 bg-light rounded-t-3xl p-5 pb-6">
            <!-- Encabezado -->
            <div class="flex flex-col items-center gap-2 pt-2">
                <div class="w-9 h-9 flex justify-center items-center bg-gradient-secondary rounded-full text-lg">
                    🔥
                </div>
                <p class="font-semibold text-center text-base text-dark">
                    {{ store.missedHabits.length === 1 ? '¡Tu racha está en riesgo!' : '¡Tus rachas están en riesgo!' }}
                </p>
                <p class="text-center text-sm text-gray">
                    No completaste {{ store.missedHabits.length === 1 ? 'este hábito' : 'estos hábitos' }} ayer.
                </p>
            </div>

            <!-- Lista de hábitos perdidos -->
            <div class="w-full flex flex-col gap-2">
                <div
                    v-for="habit in store.missedHabits"
                    :key="habit.habitId"
                    class="flex items-center justify-between gap-3 bg-midlight rounded-2xl px-4 py-3">
                    <div class="flex flex-col gap-0.5 min-w-0">
                        <span class="text-sm font-medium text-dark truncate">{{ habit.habitName }}</span>
                        <span class="text-xs text-gray flex items-center gap-1">
                            🔥 {{ habit.streak }} {{ habit.streak === 1 ? 'día de racha' : 'días de racha' }}
                        </span>
                    </div>
                    <div class="shrink-0">
                        <!-- Toggle gracia si está disponible -->
                        <button
                            v-if="habit.graceAvailable"
                            @click="toggleGrace(habit.habitId)"
                            :class="[
                                'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                                selectedGraces.has(habit.habitId)
                                    ? 'bg-accent text-dark border-accent'
                                    : 'bg-transparent text-gray border-gray'
                            ]">
                            {{ selectedGraces.has(habit.habitId) ? '✓ Usar gracia' : 'Usar gracia' }}
                        </button>
                        <span v-else class="text-xs text-gray italic">Sin gracia este mes</span>
                    </div>
                </div>
            </div>

            <!-- Acciones -->
            <div class="w-full flex flex-col items-center gap-2">
                <ButtonPrimary type="button" :disabled="loading" @click="goToYesterday">
                    Marcar hábitos de ayer
                </ButtonPrimary>
                <ButtonSecondary
                    v-if="hasAnyGraceSelected"
                    type="button"
                    :disabled="loading"
                    @click="confirm">
                    {{ loading ? 'Guardando...' : 'Continuar con gracias seleccionadas' }}
                </ButtonSecondary>
                <ButtonTerciary type="button" :disabled="loading" @click="declineAll">
                    {{ loading ? 'Guardando...' : 'Perder todas las rachas' }}
                </ButtonTerciary>
            </div>
        </div>
    </div>
</template>

<script setup>
const store = useStreakGraceStore()
const { applyStreakGrace, declineStreakGrace } = useHabits()
const loading = ref(false)

// Pre-seleccionar todos los hábitos que tienen gracia disponible
const selectedGraces = ref(new Set(
    store.missedHabits.filter(h => h.graceAvailable).map(h => h.habitId)
))

// Cuando el store se vuelve visible y cambia la lista, actualizar la selección
watch(() => store.missedHabits, (habits) => {
    selectedGraces.value = new Set(
        habits.filter(h => h.graceAvailable).map(h => h.habitId)
    )
}, { immediate: true })

const hasAnyGraceSelected = computed(() =>
    store.missedHabits.some(h => h.graceAvailable && selectedGraces.value.has(h.habitId))
)

const toggleGrace = (habitId) => {
    const set = new Set(selectedGraces.value)
    if (set.has(habitId)) set.delete(habitId)
    else set.add(habitId)
    selectedGraces.value = set
}

// Navegar a ayer sin tocar los streaks (el usuario los va a marcar manualmente)
const goToYesterday = () => {
    store.triggerNavigateToYesterday()
}

// Aplicar gracias seleccionadas y resetear el resto
const confirm = async () => {
    if (loading.value) return
    loading.value = true
    for (const habit of store.missedHabits) {
        if (selectedGraces.value.has(habit.habitId) && habit.graceAvailable) {
            await applyStreakGrace(habit.habitId)
        } else {
            await declineStreakGrace(habit.habitId) // NO consume la gracia
        }
    }
    loading.value = false
    store.dismiss()
}

// Resetear todos sin usar ninguna gracia (la gracia mensual queda intacta)
const declineAll = async () => {
    if (loading.value) return
    loading.value = true
    for (const habit of store.missedHabits) {
        await declineStreakGrace(habit.habitId) // NO consume la gracia
    }
    loading.value = false
    store.dismiss()
}
</script>
