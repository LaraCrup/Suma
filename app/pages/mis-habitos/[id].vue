<template>
    <DefaultSection class="h-full">
        <div class="relative w-full flex justify-between items-center">
            <NavigationBackArrow class="text-gray" />
            <NuxtImg 
                @click="showMenu = !showMenu" 
                src="/images/icons/options.svg" 
                alt="Opciones" 
                class="h-1 cursor-pointer" 
            />
            <div v-show="showMenu" class="absolute z-10 right-0 top-7">
                <ul class="w-[138px] bg-midlight rounded-xl shadow-lg">
                    <li class="flex items-center gap-2 py-3 px-4">
                        <NuxtImg src="/images/icons/edit.svg" alt="Editar" class="h-[14px]" />
                        <p class="text-xs">Editar hábito</p>
                    </li>
                    <li @click="handleDeleteHabit" class="flex items-center gap-2 py-3 px-4 cursor-pointer">
                        <NuxtImg src="/images/icons/delete.svg" alt="Eliminar" class="h-[14px]" />
                        <p class="text-xs text-error">Eliminar hábito</p>
                    </li>
                </ul>
            </div>
        </div>
        <div class="h-full flex flex-col justify-center gap-5">
            <HeadingH1 class="w-full hidden">{{ habit?.name }}</HeadingH1>
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-secondary text-2xl">
                    {{ habit?.icon }}</div>
                <div class="flex items-center gap-3 mt-2">
                    <div class="flex gap-[2px]">
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-2 h-2" />
                        <NuxtImg src="/images/brillo.svg" alt="Brillo" class="w-2 h-2" />
                    </div>
                    <div v-if="habit?.streak > 0" class="flex items-center gap-1">
                        <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                        <p class="text-[0.625rem]">{{ habit?.streak || 0 }}</p>
                    </div>
                </div>
            </div>
            <p class="text-center text-sm">Voy a <span class="font-bold">{{ habit?.name?.toLowerCase() }}</span> cuando <span
                    class="font-bold">{{ habit?.when_where?.toLowerCase() || 'siempre' }}</span>, para ser <span class="font-bold">{{ habit?.identity?.toLowerCase() || 'mejor persona' }}</span>.</p>
            <div>
                <div class="w-full h-3 bg-green-dark rounded-full overflow-hidden">
                    <div
                        :style="{ width: `${((habit?.progress_count || 0) / (habit?.goal_value || 1)) * 100}%` }"
                        class="h-full bg-accent rounded-full transition-all duration-300"
                    ></div>
                </div>
                <div class="w-full flex justify-center items-center gap-3 mt-3">
                    <button @click="decreaseProgress" class="h-4 w-4 flex justify-center items-center bg-accent rounded-full text-xs">-</button>
                    <div class="flex items-end gap-2">
                        <p class="text-xl">{{ habit?.progress_count || 0 }}</p>
                        <p class="text-[0.625rem]/[2] text-gray">/<span>{{ habit?.goal_value || 1 }}</span></p>
                    </div>
                    <button @click="increaseProgress" class="h-4 w-4 flex justify-center items-center bg-accent rounded-full text-xs">+</button>
                </div>
            </div>
        </div>
        <div class="w-full flex justify-between items-center">
            <button class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/restart.svg" alt="Restablecer hábito" class="w-4" />
            </button>
            <button @click="completeHabit" class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/check.svg" alt="Completar hábito" class="w-3" />
            </button>
        </div>
    </DefaultSection>
</template>

<script setup>
import { useHabits } from '~/composables/useHabits'

const route = useRoute()
const { getHabitById, deleteHabit: deleteHabitAPI, logHabitProgress } = useHabits()
const habit = ref(null)
const showMenu = ref(false)

onMounted(async () => {
    try {
        const habitId = route.params.id
        habit.value = await getHabitById(habitId)

        if (!habit.value) {
            throw new Error('Hábito no encontrado')
        }
    } catch (error) {
        console.error('Error cargando hábito:', error)
        navigateTo('/')
    }
})

const increaseProgress = async () => {
    try {
        const updated = await logHabitProgress(habit.value.id, 1)
        habit.value = updated
    } catch (error) {
        console.error('Error actualizando progreso:', error)
    }
}

const decreaseProgress = async () => {
    try {
        const updated = await logHabitProgress(habit.value.id, -1)
        habit.value = updated
    } catch (error) {
        console.error('Error actualizando progreso:', error)
    }
}

const completeHabit = async () => {
    try {
        const updated = await logHabitProgress(habit.value.id, 1)
        habit.value = updated
    } catch (error) {
        console.error('Error completando hábito:', error)
    }
}

const handleDeleteHabit = async () => {
    try {
        await deleteHabitAPI(route.params.id)
        navigateTo('/')
    } catch (error) {
        console.error('Error eliminando hábito:', error)
    }
}
</script>
