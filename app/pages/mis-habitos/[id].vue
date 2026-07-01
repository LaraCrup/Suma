<template>
    <FormDelete
        :isOpen="showDeleteModal"
        :message="`¿Estás seguro de que querés eliminar el hábito ${habit?.name} de manera permanente?`"
        @confirm="confirmDelete"
        @close="closeDeleteModal"
    />
    <DefaultSection class="h-full">
        <div class="relative w-full flex justify-between items-center">
            <NavigationBackArrow :url="ROUTE_NAMES.HOME" class="text-gray" />
            <NuxtImg
                @click="showMenu = !showMenu"
                src="/images/icons/options.svg"
                alt="Opciones"
                class="h-1 cursor-pointer"
            />
            <div v-show="showMenu" class="absolute z-10 right-0 top-7">
                <ul class="w-[138px] bg-midlight rounded-xl shadow-lg">
                    <li @click="editHabit" class="flex items-center gap-2 py-3 px-4 cursor-pointer">
                        <NuxtImg src="/images/icons/edit.svg" alt="Editar" class="h-[14px]" />
                        <p class="text-xs">Editar hábito</p>
                    </li>
                    <li @click="openDeleteModal" class="flex items-center gap-2 py-3 px-4 cursor-pointer">
                        <NuxtImg src="/images/icons/delete.svg" alt="Eliminar" class="h-[14px]" />
                        <p class="text-xs text-error">Eliminar hábito</p>
                    </li>
                </ul>
            </div>
        </div>
        <div v-if="isLoading" class="w-full h-full flex justify-center items-center">
            <Loader color="primary" />
        </div>
        <template v-else>
        <div class="h-full flex flex-col justify-center gap-5">
            <HeadingH1 class="w-full hidden">{{ habit?.name }}</HeadingH1>
            <div class="flex flex-col items-center">
                <div class="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-secondary text-2xl">
                    {{ habit?.icon }}</div>
                <div class="h-4 flex items-center gap-3 mt-2">
                    <div v-if="hasSpecificFrequency" class="flex gap-[2px]">
                        <NuxtImg
                            v-for="i in brilloCount"
                            :key="i"
                            :src="i <= completedBrillos ? '/images/brillo-primary.svg' : '/images/brillo.svg'"
                            alt="Brillo"
                            class="w-2 h-2"
                        />
                    </div>
                    <div v-if="habit?.streak > 0" class="flex items-center gap-1">
                        <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                        <p class="text-xs">{{ habit?.streak || 0 }}</p>
                    </div>
                </div>
            </div>
            <p class="text-center text-sm">Voy a <span class="font-bold">{{ habit?.name?.toLowerCase() }}</span> cuando <span
                    class="font-bold">{{ habit?.when_where?.toLowerCase() || 'siempre' }}</span>, para ser <span class="font-bold">{{ habit?.identity?.toLowerCase() || 'mejor persona' }}</span>.</p>
            <div>
                <ProgressBar
                    :progress-count="habit?.progress_count"
                    :goal-value="habit?.goal_value"
                />
                <div class="w-full flex justify-center items-center gap-3 mt-3">
                    <button @click="decreaseProgress" class="h-6 w-6 flex justify-center items-center bg-accent rounded-full text-lg leading-none">-</button>
                    <div class="flex items-end gap-1">
                        <p class="text-xl">{{ habit?.progress_count || 0 }}</p>
                        <p class="text-xs/[2] text-gray">/<span>{{ habit?.goal_value || 1 }}</span></p>
                    </div>
                    <button @click="increaseProgress" :disabled="(habit?.progress_count || 0) >= (habit?.goal_value || 1)" :class="{ 'opacity-50 cursor-not-allowed': (habit?.progress_count || 0) >= (habit?.goal_value || 1) }" class="h-6 w-6 flex justify-center items-center bg-accent rounded-full text-lg leading-none">+</button>
                </div>
            </div>
        </div>
        <div v-if="hasStreakPending" class="w-full flex flex-col gap-3 bg-midlight rounded-2xl px-4 py-4">
            <div class="flex items-center gap-2">
                <span>🔥</span>
                <p class="text-sm font-semibold text-dark">Tu racha está en riesgo</p>
            </div>
            <p class="text-xs text-gray">No completaste este hábito en el último período.</p>
            <template v-if="graceAvailable">
                <ButtonPrimary
                    type="button"
                    :disabled="streakSaveLoading"
                    @click="saveStreak">
                    {{ streakSaveLoading ? 'Guardando...' : 'Salvar racha' }}
                </ButtonPrimary>
                <p class="text-xs text-gray italic">Podés salvar tu racha una vez por mes.</p>
            </template>
            <p v-else class="text-xs text-gray italic">Ya usaste tu Salvar racha este mes</p>
            <ButtonTerciary
                type="button"
                :disabled="streakSaveLoading"
                @click="loseStreak">
                {{ streakSaveLoading ? 'Guardando...' : 'Perder racha' }}
            </ButtonTerciary>
        </div>
        <div class="w-full flex justify-between items-center">
            <button @click="resetProgress" class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/restart.svg" alt="Restablecer hábito" class="w-4" />
            </button>
            <button @click="completeHabit" class="h-9 w-9 flex justify-center items-center bg-green-light rounded-full">
                <NuxtImg src="/images/icons/check.svg" alt="Completar hábito" class="w-3" />
            </button>
        </div>
        </template>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'
import { useHabits } from '~/composables/useHabits'

const route = useRoute()
const { getHabitById, deleteHabit: deleteHabitAPI, logHabitProgress, applyStreakGrace, declineStreakGrace, getArgentineDate, isPeriodStillMissed } = useHabits()
const habit = ref(null)
const selectedDate = ref(null)
const showMenu = ref(false)
const showDeleteModal = ref(false)
const isLoading = ref(true)
const hasStreakPending = ref(false)
const graceAvailable = ref(false)
const streakSaveLoading = ref(false)

const hasSpecificFrequency = computed(() => {
    const specificOptions = [
        'dias_especificos_semana',
        'cantidad_dias_semana',
        'dias_especificos_mes',
        'cantidad_dias_mes'
    ]
    return specificOptions.includes(habit.value?.frequency_option)
})

const brilloCount = computed(() => {
    if (!habit.value?.frequency_option || !habit.value?.frequency_detail) {
        return 0
    }

    const option = habit.value.frequency_option
    const detail = habit.value.frequency_detail

    switch (option) {
        case 'dias_especificos_semana':
            return detail.weekDays?.length || 0
        case 'cantidad_dias_semana':
            return detail.counter || 0
        case 'dias_especificos_mes':
            return detail.monthDays?.length || 0
        case 'cantidad_dias_mes':
            return detail.counter || 0
        default:
            return 0
    }
})

const completedBrillos = computed(() => {
    const option = habit.value?.frequency_option

    // Para cantidad_dias_semana y cantidad_dias_mes, usar el conteo de días completados
    if (option === 'cantidad_dias_semana') {
        return habit.value?.weekCompletedDays || 0
    }
    if (option === 'cantidad_dias_mes') {
        return habit.value?.monthCompletedDays || 0
    }

    // Para otras opciones, usar progress_count
    return Math.min(habit.value?.progress_count || 0, brilloCount.value)
})

const checkStreakSavePending = async () => {
    if (typeof window === 'undefined') return
    const habitId = route.params.id
    const key = `streakGracePending_${habitId}`
    const pendingRaw = localStorage.getItem(key)
    if (!pendingRaw) {
        hasStreakPending.value = false
        return
    }

    const { offeredForDate } = JSON.parse(pendingRaw)

    const stillMissed = await isPeriodStillMissed(habit.value, offeredForDate)
    if (!stillMissed) {
        localStorage.removeItem(key)
        hasStreakPending.value = false
        return
    }

    if ((habit.value?.streak || 0) === 0) {
        localStorage.removeItem(key)
        hasStreakPending.value = false
        return
    }

    hasStreakPending.value = true
    const currentMonth = getArgentineDate().slice(0, 7)
    graceAvailable.value = habit.value?.streak_grace_used_month !== currentMonth
}

const saveStreak = async () => {
    streakSaveLoading.value = true
    await applyStreakGrace(route.params.id)
    hasStreakPending.value = false
    habit.value = await getHabitById(route.params.id, selectedDate.value)
    streakSaveLoading.value = false
}

const loseStreak = async () => {
    streakSaveLoading.value = true
    await declineStreakGrace(route.params.id)
    hasStreakPending.value = false
    habit.value = await getHabitById(route.params.id, selectedDate.value)
    streakSaveLoading.value = false
}

onMounted(async () => {
    try {
        const habitId = route.params.id
        selectedDate.value = route.query.date || null
        habit.value = await getHabitById(habitId, selectedDate.value)

        if (!habit.value) {
            throw new Error('Hábito no encontrado')
        }

        await checkStreakSavePending()
    } catch (error) {
        console.error('Error cargando hábito:', error)
        navigateTo('/')
    } finally {
        isLoading.value = false
    }
})

const increaseProgress = async () => {
    try {
        const updated = await logHabitProgress(habit.value.id, 1, selectedDate.value)
        habit.value = updated
        await checkStreakSavePending()
    } catch (error) {
        console.error('Error actualizando progreso:', error)
    }
}

const decreaseProgress = async () => {
    try {
        const updated = await logHabitProgress(habit.value.id, -1, selectedDate.value)
        habit.value = updated
        await checkStreakSavePending()
    } catch (error) {
        console.error('Error actualizando progreso:', error)
    }
}

const resetProgress = async () => {
    try {
        const currentProgress = habit.value.progress_count || 0
        const updated = await logHabitProgress(habit.value.id, -currentProgress, selectedDate.value)
        habit.value = updated
        await checkStreakSavePending()
    } catch (error) {
        console.error('Error reiniciando progreso:', error)
    }
}

const completeHabit = async () => {
    try {
        const currentProgress = habit.value.progress_count || 0
        const goalValue = habit.value.goal_value || 1
        const progressNeeded = goalValue - currentProgress
        const updated = await logHabitProgress(habit.value.id, progressNeeded, selectedDate.value)
        habit.value = updated
        await checkStreakSavePending()
    } catch (error) {
        console.error('Error completando hábito:', error)
    }
}

const editHabit = () => {
    showMenu.value = false
    navigateTo(`/mis-habitos/editar/${habit.value.id}`)
}

const openDeleteModal = () => {
    showDeleteModal.value = true
    showMenu.value = false
}

const closeDeleteModal = () => {
    showDeleteModal.value = false
}

const confirmDelete = async () => {
    try {
        await deleteHabitAPI(route.params.id)
        showDeleteModal.value = false
        navigateTo('/')
    } catch (error) {
        console.error('Error eliminando hábito:', error)
        closeDeleteModal()
    }
}
</script>
