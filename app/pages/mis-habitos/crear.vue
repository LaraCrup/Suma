<template>
    <HabitsDefault v-if="!showDetails" />
    <HabitsDetails v-else />
</template>

<script setup>

useSeoTags({
    title: 'Crear hábito',
    description: 'Elegí un hábito sugerido o creá el tuyo: definí frecuencia, meta y recordatorio.',
})
import { computed } from 'vue'
import { useHabitStore } from '~/stores/habitStore'

const habitStore = useHabitStore()

const showDetails = computed(() => {
    return habitStore.selectedHabit !== null || habitStore.isCustom
})
</script>