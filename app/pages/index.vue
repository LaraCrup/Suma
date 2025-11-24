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
        <div v-if="currentTip" class="w-full flex flex-col">
            <div class="w-full h-32 rounded-t-lg overflow-hidden">
                <NuxtImg :src="`/images/tips/${currentTip.image}.webp`" alt="Tip de hábito" class="w-full h-full bg-cover" />
            </div>
            <div class="w-full bg-midlight rounded-b-lg p-3">
                <p class="text-primary text-sm">{{ currentTip.title }}</p>
                <p class="text-[0.625rem] mt-1">{{ currentTip.description }}</p>
            </div>
        </div>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'
import { useHabits } from '~/composables/useHabits'
import { useAuthStore } from '~/stores/authStore'

const { getHabits, shouldShowHabitToday } = useHabits()
const authStore = useAuthStore()
const habits = ref([])
const showAllHabits = ref(false)

const tips = [
    {
        title: 'Empezá con el hábito más corto.',
        description: 'El impulso te va a ayudar con el resto. Cuando empezás por lo simple, tu mente interpreta que “es fácil seguir”. Esa pequeña victoria inicial activa la motivación.',
        image: 'habito-corto'
    },
    {
        title: 'Hace tu hábito visible.',
        description: 'Los hábitos empiezan con una señal. Si lo que querés hacer está a la vista, lo vas a hacer más fácil. Dejá la botella de agua en el escritorio, el libro en la mesa de luz o las zapatillas cerca de la puerta.',
        image: 'hacelo-visible'
    },
    {
        title: 'Dos minutos son suficientes.',
        description: 'Cuando iniciar es difícil, reducí el hábito a su mínima expresión. Dos minutos de movimiento, lectura o foco son suficientes para activar la constancia.',
        image: 'dos-minutos'
    }
]

const currentTip = ref(null)

const visibleHabits = computed(() => {
    return habits.value.filter(habit => shouldShowHabitToday(habit))
})

const hiddenHabits = computed(() => {
    return habits.value.filter(habit => !shouldShowHabitToday(habit))
})

const handleHabitUpdated = (updatedHabit) => {
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

    if (typeof window !== 'undefined') {
        const savedTip = sessionStorage.getItem('sessionTip')

        if (savedTip) {
            currentTip.value = JSON.parse(savedTip)
        } else {
            const randomIndex = Math.floor(Math.random() * tips.length)
            const selectedTip = tips[randomIndex]
            sessionStorage.setItem('sessionTip', JSON.stringify(selectedTip))
            currentTip.value = selectedTip
        }
    }
})

watch(() => authStore.isLoggedIn, (isLoggedIn) => {
    if (!isLoggedIn && typeof window !== 'undefined') {
        sessionStorage.removeItem('sessionTip')
        currentTip.value = null
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