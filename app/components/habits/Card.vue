<template>
    <button
        ref="cardRef"
        @click="handleClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        :class="['w-full relative overflow-hidden flex justify-between rounded-lg p-3 transition-colors', isCompleted ? 'bg-accent' : 'bg-midlight']">
        <div
            v-if="showSwipeFill"
            class="absolute inset-y-0 pointer-events-none"
            :class="[
                swipeDirection === 'right' ? 'left-0 bg-accent' : 'right-0 bg-midlight',
                pendingDirection ? 'transition-[width] duration-150' : ''
            ]"
            :style="{ width: swipeFillPercent + '%' }"
        />
        <div class="relative flex gap-3 items-center min-w-0 flex-1">
            <div class="w-8 h-8 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-secondary"><p class="text-sm leading-3">{{ habit.icon }}</p></div>
            <div class="min-w-0">
                <p class="text-xs text-start truncate">{{ habit.name }}</p>
                <div class="flex gap-2 items-center">
                    <p class="text-xs text-green-dark" :class="[isCompleted ? ' font-bold' : 'font-normal']">{{ effectiveProgress }}/{{ habit.goal_value || 1 }}</p>
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
        <div class="relative flex items-center gap-2 flex-shrink-0">
            <div v-if="habit.streak > 0 && isCompleted" :class="['flex flex-shrink-0 items-center gap-1', isUpdating ? 'animate-pulse' : '']">
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
const pendingDirection = ref(null)

const SWIPE_THRESHOLD = 40
const FILL_FULL_DISTANCE = 60

const localOverrideProgress = ref(null)

const effectiveProgress = computed(() => {
    if (localOverrideProgress.value !== null) return localOverrideProgress.value
    return props.habit.progress_count || 0
})

watch(() => props.habit.progress_count, () => {
    localOverrideProgress.value = null
})

const isCompleted = computed(() => {
    return effectiveProgress.value >= (props.habit.goal_value || 1)
})

const isUpdating = computed(() => localOverrideProgress.value !== null)

const swipeDirection = computed(() => {
    if (pendingDirection.value) return pendingDirection.value
    if (touchDeltaX.value > 0) return 'right'
    if (touchDeltaX.value < 0) return 'left'
    return null
})

const isActionable = computed(() => {
    const dir = swipeDirection.value
    if (dir === 'right') return !isCompleted.value
    if (dir === 'left') return effectiveProgress.value > 0
    return false
})

const swipeFillPercent = computed(() => {
    if (pendingDirection.value) return 100
    if (!isHorizontalGesture.value) return 0
    const distance = Math.abs(touchDeltaX.value)
    return Math.min((distance / FILL_FULL_DISTANCE) * 100, 100)
})

const showSwipeFill = computed(() => {
    return isActionable.value && swipeFillPercent.value > 0
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

    return Math.min(effectiveProgress.value, brilloCount.value)
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
    const direction = touchEndX > touchStartX.value ? 'right' : 'left'

    const isValidSwipe = swipeDistance > SWIPE_THRESHOLD && swipeTime < 800
    const willAct = isValidSwipe && (
        (direction === 'right' && !isCompleted.value) ||
        (direction === 'left' && (props.habit.progress_count || 0) > 0)
    )

    if (willAct) {
        isSwipe.value = true
        pendingDirection.value = direction
    }

    touchDeltaX.value = 0
    isHorizontalGesture.value = false

    if (willAct) {
        try {
            if (direction === 'right') {
                await completeHabit()
            } else {
                await resetHabit()
            }
        } finally {
            pendingDirection.value = null
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
    const currentProgress = props.habit.progress_count || 0
    const goalValue = props.habit.goal_value || 1
    const progressNeeded = goalValue - currentProgress

    if (progressNeeded <= 0) return

    localOverrideProgress.value = goalValue
    try {
        const updated = await logHabitProgress(props.habit.id, progressNeeded, props.selectedDate)
        emit('habitUpdated', updated)
    } catch (error) {
        console.error('Error completando hábito:', error)
        localOverrideProgress.value = null
    }
}

const resetHabit = async () => {
    const currentProgress = props.habit.progress_count || 0

    if (currentProgress <= 0) return

    localOverrideProgress.value = 0
    try {
        const updated = await logHabitProgress(props.habit.id, -currentProgress, props.selectedDate)
        emit('habitUpdated', updated)
    } catch (error) {
        console.error('Error reiniciando hábito:', error)
        localOverrideProgress.value = null
    }
}
</script>
