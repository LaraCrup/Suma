<template>
    <button
        ref="cardRef"
        @click="handleClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        :style="swipeStyle"
        :class="['w-full flex justify-between rounded-lg p-3 transition-colors', isCompleted ? 'bg-accent' : 'bg-midlight']">
        <div class="flex gap-3 items-center min-w-0 flex-1">
            <div class="w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-secondary"><p class="text-sm leading-3">{{ habit.icon }}</p></div>
            <div class="min-w-0">
                <p class="text-xs text-start truncate">{{ habit.name }}</p>
                <div class="flex gap-2 items-center">
                    <p class="text-xs text-green-dark" :class="[isCompleted ? ' font-bold' : 'font-normal']">{{ habit.progress_count || 0 }}/{{ habit.goal_value || 1 }}</p>
                    <div v-if="hasSpecificFrequency" class="flex flex-shrink-0 gap-[2px]">
                        <NuxtImg
                            v-for="i in brilloCount"
                            :key="i"
                            :src="i <= completedBrillos ? '/images/brillo-primary.svg' : '/images/brillo.svg'"
                            alt="Brillo"
                            class="w-2 h-2"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
            <div v-if="habit.streak > 0" class="flex flex-shrink-0 items-center gap-1">
                <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2" />
                <p class="text-xs">{{ habit.streak }}</p>
            </div>
            <div :class="['w-6 h-6 flex justify-center items-center rounded-full', isCompleted ? 'bg-green-dark' : 'border-gray border-[1px]']">
                <NuxtImg :src="isCompleted ? '/images/icons/brillo-light-green.svg' : '/images/brillo.svg'" :alt="isCompleted ? 'Completado' : 'Brillo'" class="w-3" />
            </div>
        </div>
    </button>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useHabits } from '~/composables/useHabits'

const router = useRouter();
const { logHabitProgress } = useHabits()

const props = defineProps({
    habit: {
        type: Object,
        required: true
    },
    selectedDate: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['habitUpdated'])

const cardRef = ref(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isSwipe = ref(false)
const touchDeltaX = ref(0)
const isHorizontalGesture = ref(false)

const swipeStyle = computed(() => {
    if (!isHorizontalGesture.value || touchDeltaX.value === 0) return {}
    const clampedDelta = Math.max(-60, Math.min(60, touchDeltaX.value * 0.35))
    return { transform: `translateX(${clampedDelta}px)`, transition: 'none' }
})

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

const completedBrillos = computed(() => {
    const option = props.habit.frequency_option

    if (option === 'cantidad_dias_semana') {
        return props.habit.weekCompletedDays || 0
    }
    if (option === 'cantidad_dias_mes') {
        return props.habit.monthCompletedDays || 0
    }

    return Math.min(props.habit.progress_count || 0, brilloCount.value)
})

const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.value
    const dy = e.touches[0].clientY - touchStartY.value

    // Si el gesto es claramente vertical, no interceptar
    if (!isHorizontalGesture.value && Math.abs(dy) > Math.abs(dx) + 5) return

    if (Math.abs(dx) > 8) {
        isHorizontalGesture.value = true
        e.preventDefault()
        touchDeltaX.value = dx
    }
}

onMounted(() => {
    cardRef.value?.addEventListener('touchmove', handleTouchMove, { passive: false })
})

onUnmounted(() => {
    cardRef.value?.removeEventListener('touchmove', handleTouchMove)
})

const handleTouchStart = (e) => {
    touchStartX.value = e.touches[0].clientX
    touchStartY.value = e.touches[0].clientY
    touchStartTime.value = Date.now()
    isSwipe.value = false
    touchDeltaX.value = 0
    isHorizontalGesture.value = false
}

const handleTouchEnd = async (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndTime = Date.now()
    const swipeDistance = Math.abs(touchEndX - touchStartX.value)
    const swipeTime = touchEndTime - touchStartTime.value
    const swipeDirection = touchEndX > touchStartX.value ? 'right' : 'left'

    // Resetear feedback visual
    touchDeltaX.value = 0
    isHorizontalGesture.value = false

    if (swipeDistance > 40 && swipeTime < 800) {
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
            const updated = await logHabitProgress(props.habit.id, progressNeeded, props.selectedDate)
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
            const updated = await logHabitProgress(props.habit.id, -currentProgress, props.selectedDate)
            emit('habitUpdated', updated)
        }
    } catch (error) {
        console.error('Error reiniciando hábito:', error)
    }
}
</script>
