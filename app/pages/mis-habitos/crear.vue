<template>
    <HabitsDefault v-if="!showDetails" />
    <HabitsDetails v-else />
</template>

<script setup>
import { computed } from 'vue'
import { useHabitStore } from '~/stores/habitStore'

const habitStore = useHabitStore()

const showDetails = computed(() => {
    return habitStore.selectedHabit !== null || habitStore.isCustom
})
</script>