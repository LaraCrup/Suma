<template>
    <DefaultSection class="!gap-2">
        <div class="w-full flex justify-between items-center">
            <HeadingH1 class="w-full">Mis hábitos</HeadingH1>
            <NuxtLink :to="ROUTE_NAMES.HABITS_CREATE" class="min-w-6 min-h-6 flex justify-center items-center bg-green-dark text-light rounded-full">+</NuxtLink>
        </div>
        <div class="w-full flex flex-col gap-1">
            <HabitsCard
                v-for="habit in visibleHabits"
                :key="habit.id"
                :habit="habit"
                @habitUpdated="handleHabitUpdated"
            />
            <p v-if="visibleHabits.length === 0" class="text-sm text-gray text-center py-4">No hay hábitos para hoy. ¡Descansa!</p>
        </div>

        <div v-if="hiddenHabits.length > 0" class="w-full flex flex-col gap-1">
            <button
                @click="showAllHabits = !showAllHabits"
                class="w-full flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
            >
                <p class="text-sm">Ver todos mis hábitos ({{ hiddenHabits.length }})</p>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    :class="['w-4 text-primary transition-transform', showAllHabits ? '-rotate-90' : 'rotate-90']"
                >
                    <path fill="currentColor" d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"/>
                </svg>
            </button>

            <transition name="expand">
                <div v-if="showAllHabits" class="w-full flex flex-col gap-1">
                    <HabitsCard
                        v-for="habit in hiddenHabits"
                        :key="habit.id"
                        :habit="habit"
                        @habitUpdated="handleHabitUpdated"
                    />
                </div>
            </transition>
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

const { getHabits, shouldShowHabitToday } = useHabits()
const habits = ref([])
const showAllHabits = ref(false)

const visibleHabits = computed(() => {
    return habits.value.filter(habit => shouldShowHabitToday(habit))
})

const hiddenHabits = computed(() => {
    return habits.value.filter(habit => !shouldShowHabitToday(habit))
})

const handleHabitUpdated = (updatedHabit) => {
    // Encontrar el hábito en la lista y actualizar su progreso
    const habitIndex = habits.value.findIndex(h => h.id === updatedHabit.id)
    if (habitIndex !== -1) {
        habits.value[habitIndex] = updatedHabit
    }
}

onMounted(async () => {
    try {
        habits.value = await getHabits()
    } catch (error) {
        console.error('Error cargando hábitos:', error)
    }
})
</script>

<style scoped>
.expand-enter-active,
.expand-leave-active {
    transition: all 0.3s ease;
}

.expand-enter-from {
    opacity: 0;
    max-height: 0;
}

.expand-leave-to {
    opacity: 0;
    max-height: 0;
}

.expand-enter-to,
.expand-leave-from {
    opacity: 1;
    max-height: 1000px;
}
</style>