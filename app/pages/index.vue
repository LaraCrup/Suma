<template>
    <DefaultSection class="!gap-2">
        <div class="w-full flex justify-between items-center">
            <HeadingH1 class="w-full">Mis hábitos</HeadingH1>
            <NuxtLink :to="ROUTE_NAMES.HABITS_CREATE" class="min-w-6 min-h-6 flex justify-center items-center bg-green-dark text-light rounded-full">+</NuxtLink>
        </div>
        <div class="w-full flex flex-col gap-1">
            <HabitsCard
                v-for="habit in habits"
                :key="habit.id"
                :habit="habit"
            />
            <p v-if="habits.length === 0" class="text-sm text-gray text-center py-4">No tienes hábitos aún. ¡Crea uno!</p>
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Mis hábitos comunitarios</HeadingH1>
        <div class="w-full flex flex-col gap-1">
            <p class="text-sm text-gray text-center py-4">Próximamente...</p>
        </div>
    </DefaultSection>
    <DefaultSection class="!gap-2">
        <HeadingH1 class="w-full">Tip de hoy</HeadingH1>
        <div class="w-full flex">
            <div class="w-3/4 bg-midlight rounded-s-lg p-3">
                <p class="text-primary text-sm">Empezá con el hábito más corto.</p>
                <p class="text-[0.625rem]">El impulso te va a ayudar con el resto.</p>
            </div>
            <div class="w-1/4 rounded-e-lg overflow-hidden">
                <NuxtImg src="/images/placeholder.png" alt="Tip de hábito" class="w-full h-full" />
            </div>
        </div>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'
import { useHabits } from '~/composables/useHabits'

const { getHabits } = useHabits()
const habits = ref([])

onMounted(async () => {
    try {
        habits.value = await getHabits()
    } catch (error) {
        console.error('Error cargando hábitos:', error)
    }
})
</script>