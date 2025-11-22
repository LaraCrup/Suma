<template>
    <button
        @click="handleClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        :class="['w-full flex justify-between rounded-lg p-3 transition-colors', isCompleted ? 'bg-accent' : 'bg-midlight']">
        <div class="flex gap-3 items-center">
            <div class="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-secondary"><p class="text-sm leading-3">{{ habit.icon }}</p></div>
            <div>
                <p class="text-xs text-start">{{ habit.name }}</p>
                <div class="flex gap-2 items-center">
                    <p class="text-[0.625rem] text-green-dark" :class="[isCompleted ? ' font-bold' : 'font-normal']">{{ habit.progress_count || 0 }}/{{ habit.goal_value || 1 }}</p>
                    <div v-if="hasSpecificFrequency" class="flex gap-[2px]">
                        <NuxtImg v-for="i in brilloCount" :key="i" src="/images/brillo.svg" alt="Brillo" class="w-2 h-2"/>
                    </div>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <div v-if="habit.streak > 0" class="flex items-center gap-1">
                <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                <p class="text-[0.625rem]">{{ habit.streak }}</p>
            </div>
            <div :class="['w-6 h-6 flex justify-center items-center rounded-full', isCompleted ? 'bg-green-dark' : 'border-gray border-[1px]']">
                <NuxtImg :src="isCompleted ? '/images/icons/brillo-light-green.svg' : '/images/brillo.svg'" :alt="isCompleted ? 'Completado' : 'Brillo'" class="w-3" />
            </div>
        </div>
    </button>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useHabits } from '~/composables/useHabits'

const router = useRouter();
const { logHabitProgress } = useHabits()

const props = defineProps({
    habit: {
        type: Object,
        required: true
    }
});

const emit = defineEmits(['habitUpdated'])

const touchStartX = ref(0)
const touchStartTime = ref(0)
const isSwipe = ref(false)

const isCompleted = computed(() => {
    return (props.habit.progress_count || 0) >= (props.habit.goal_value || 1)
})

const hasSpecificFrequency = computed(() => {
    const specificOptions = [
        'dias_especificos_semana',
        'cantidad_dias_semana',
        'dias_especificos_mes',
        'cantidad_dias_mes'
    ]
    return specificOptions.includes(props.habit.frequency_option)
})

const brilloCount = computed(() => {
    if (!props.habit.frequency_option || !props.habit.frequency_detail) {
        return 0
    }

    const option = props.habit.frequency_option
    const detail = props.habit.frequency_detail

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

const handleTouchStart = (e) => {
    touchStartX.value = e.touches[0].clientX
    touchStartTime.value = Date.now()
    isSwipe.value = false
}

const handleTouchEnd = async (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndTime = Date.now()
    const swipeDistance = Math.abs(touchEndX - touchStartX.value)
    const swipeTime = touchEndTime - touchStartTime.value
    const swipeDirection = touchEndX > touchStartX.value ? 'right' : 'left'

    if (swipeDistance > 50 && swipeTime < 500) {
        isSwipe.value = true
        if (swipeDirection === 'right') {
            await completeHabit()
        } else {
            await resetHabit()
        }
    }
}

const handleClick = () => {
    if (!isSwipe.value) {
        goToHabit()
    }
}

const goToHabit = () => {
    router.push(`/mis-habitos/${props.habit.id}`);
}

const completeHabit = async () => {
    try {
        const currentProgress = props.habit.progress_count || 0
        const goalValue = props.habit.goal_value || 1
        const progressNeeded = goalValue - currentProgress

        if (progressNeeded > 0) {
            const updated = await logHabitProgress(props.habit.id, progressNeeded)
            emit('habitUpdated', updated)
        }
    } catch (error) {
        console.error('Error completando hábito:', error)
    }
}

const resetHabit = async () => {
    try {
        const currentProgress = props.habit.progress_count || 0

        if (currentProgress > 0) {
            const updated = await logHabitProgress(props.habit.id, -currentProgress)
            emit('habitUpdated', updated)
        }
    } catch (error) {
        console.error('Error reiniciando hábito:', error)
    }
}
</script>