<template>
    <button
        ref="cardRef"
        @click="handleClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchCancel"
        :class="['w-full relative overflow-hidden flex justify-between rounded-lg p-3 transition-[background-color,transform] duration-150', effectiveCompleted ? 'bg-accent' : 'bg-midlight', isPressed ? 'scale-[0.98]' : 'scale-100']">
        <div
            v-if="showSwipeFill"
            class="absolute inset-y-0 pointer-events-none"
            :class="swipeDirection === 'right' ? 'left-0 bg-accent' : 'right-0 bg-midlight'"
            :style="{
                width: swipeFillWidth + 'px',
                opacity: swipePastThreshold ? 1 : 0.5,
                transition: pendingDirection ? 'width 150ms ease-out' : 'opacity 120ms linear'
            }"
        />
        <div class="relative flex gap-3 items-center min-w-0 flex-1">
            <div class="w-8 2xl:w-9 h-8 2xl:h-9 flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-secondary">
                <p class="text-sm 2xl:text-base leading-3">{{ habit?.icon ?? '✨' }}</p>
            </div>
            <div class="min-w-0">
                <p class="text-xs 2xl:text-sm text-start truncate">{{ habit?.name ?? 'Hábito compartido' }}</p>
                <div class="flex gap-1 2xl:gap-1.5 items-center mt-1">
                    <template v-for="member in visibleMembers" :key="member.id">
                        <div
                            class="w-3 2xl:w-4 h-3 2xl:h-4 rounded-full overflow-hidden flex items-center justify-center"
                            :class="member.completed ? 'bg-green-light' : 'bg-gray'">
                            <img
                                v-if="member.completed && member.avatar_url"
                                :src="member.avatar_url"
                                :alt="member.display_name"
                                class="w-full h-full object-cover"
                            />
                            <span
                                v-else-if="member.completed"
                                class="text-[0.5rem] 2xl:text-xs text-light font-bold">
                                {{ member.display_name?.[0].toUpperCase() }}
                            </span>
                        </div>
                    </template>
                    <div
                        v-if="extraCount > 0"
                        class="w-5 2xl:w-6 h-5 2xl:h-6 rounded-full bg-gray flex items-center justify-center">
                        <span class="text-[0.5rem] 2xl:text-xs text-light">+{{ extraCount }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="relative flex items-center gap-2 flex-shrink-0">
            <div v-if="habit?.streak > 0" :class="['flex flex-shrink-0 items-center gap-1', isUpdating ? 'animate-pulse' : '']">
                <NuxtImg src="/images/racha.svg" alt="Racha" class="w-2 2xl:w-3" />
                <p class="text-xs 2xl:text-sm">{{ habit.streak }}</p>
            </div>
            <div :class="['w-6 h-6 flex justify-center items-center rounded-full', effectiveCompleted ? 'bg-green-dark' : 'border-gray border-[1px]']">
                <NuxtImg
                    :src="effectiveCompleted ? '/images/icons/brillo-light-green.svg' : '/images/brillo.svg'"
                    :alt="effectiveCompleted ? 'Completado' : 'Pendiente'"
                    class="w-3"
                />
            </div>
        </div>
    </button>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'

const router = useRouter()
const { logCommunityHabitProgress } = useCommunities()

const props = defineProps({
    habit: {
        type: Object,
        default: null
    },
    members: {
        type: Array,
        default: () => []
    },
    selectedDate: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['habitUpdated'])

const MAX_VISIBLE = 5
const currentUserId = ref(null)

const visibleMembers = computed(() => props.members.slice(0, MAX_VISIBLE))
const extraCount = computed(() => Math.max(0, props.members.length - MAX_VISIBLE))
const myMember = computed(() => props.members.find(m => m.id === currentUserId.value))

const { isOnline } = useOnlineStatus()

const cardRef = ref(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchStartTime = ref(0)
const isSwipe = ref(false)
const touchDeltaX = ref(0)
const isHorizontalGesture = ref(false)
const pendingDirection = ref(null)
const isPressed = ref(false)
const cardWidth = ref(0)

const SWIPE_THRESHOLD = 40
const HORIZONTAL_TOLERANCE = 8

const localOverrideCompleted = ref(null)

const effectiveCompleted = computed(() => {
    if (localOverrideCompleted.value !== null) return localOverrideCompleted.value
    return myMember.value?.completed ?? false
})

const isUpdating = computed(() => localOverrideCompleted.value !== null)

watch(() => myMember.value?.completed, () => {
    localOverrideCompleted.value = null
})

const swipeDirection = computed(() => {
    if (pendingDirection.value) return pendingDirection.value
    if (touchDeltaX.value > 0) return 'right'
    if (touchDeltaX.value < 0) return 'left'
    return null
})

const isActionable = computed(() => {
    if (pendingDirection.value) return true
    if (!isOnline.value) return false
    const dir = swipeDirection.value
    if (dir === 'right') return !effectiveCompleted.value
    if (dir === 'left') return effectiveCompleted.value
    return false
})

const swipeFillWidth = computed(() => {
    if (pendingDirection.value) return cardWidth.value
    if (!isHorizontalGesture.value) return 0
    return Math.min(Math.abs(touchDeltaX.value), cardWidth.value)
})

const swipePastThreshold = computed(() => {
    if (pendingDirection.value) return true
    return Math.abs(touchDeltaX.value) >= SWIPE_THRESHOLD
})

const showSwipeFill = computed(() => {
    return isActionable.value && swipeFillWidth.value > 0
})

const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.value
    const dy = e.touches[0].clientY - touchStartY.value

    if (!isHorizontalGesture.value && Math.abs(dy) > Math.abs(dx) + 5) {
        isPressed.value = false
        return
    }

    if (Math.abs(dx) > HORIZONTAL_TOLERANCE) {
        isHorizontalGesture.value = true
        isPressed.value = false
        e.preventDefault()
        touchDeltaX.value = dx
    }
}

onMounted(async () => {
    cardRef.value?.addEventListener('touchmove', handleTouchMove, { passive: false })
    const { data: { session } } = await useSupabaseClient().auth.getSession()
    currentUserId.value = session?.user?.id ?? null
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
    isPressed.value = true
    cardWidth.value = cardRef.value?.offsetWidth || 0
}

const handleTouchCancel = () => {
    isPressed.value = false
    isSwipe.value = isHorizontalGesture.value
    touchDeltaX.value = 0
    isHorizontalGesture.value = false
}

const handleTouchEnd = async (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndTime = Date.now()
    const swipeDistance = Math.abs(touchEndX - touchStartX.value)
    const swipeTime = touchEndTime - touchStartTime.value
    const direction = touchEndX > touchStartX.value ? 'right' : 'left'

    const wasHorizontal = isHorizontalGesture.value

    isPressed.value = false
    isSwipe.value = wasHorizontal

    const isValidSwipe = wasHorizontal && swipeDistance > SWIPE_THRESHOLD && swipeTime < 800
    const willAct = isValidSwipe && isOnline.value && (
        (direction === 'right' && !effectiveCompleted.value) ||
        (direction === 'left' && effectiveCompleted.value)
    )

    if (willAct) {
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
    if (props.habit?.community_id) {
        const dateParam = props.selectedDate ? `?date=${props.selectedDate}` : ''
        router.push(`/comunidades/${props.habit.community_id}/habito${dateParam}`)
    }
}

const completeHabit = async () => {
    if (!props.habit) return

    const goalValue = props.habit.goal_value || 1
    const currentProgress = myMember.value?.progress_count || 0
    const progressNeeded = goalValue - currentProgress

    if (progressNeeded <= 0) return

    localOverrideCompleted.value = true
    try {
        await logCommunityHabitProgress(props.habit.id, progressNeeded, goalValue, props.selectedDate)
        emit('habitUpdated', props.habit.id)
    } catch (error) {
        console.error('Error completando hábito comunitario:', error)
        localOverrideCompleted.value = null
    }
}

const resetHabit = async () => {
    if (!props.habit) return

    const currentProgress = myMember.value?.progress_count || 0
    if (currentProgress <= 0) return

    localOverrideCompleted.value = false
    try {
        await logCommunityHabitProgress(props.habit.id, -currentProgress, props.habit.goal_value || 1, props.selectedDate)
        emit('habitUpdated', props.habit.id)
    } catch (error) {
        console.error('Error reiniciando hábito comunitario:', error)
        localOverrideCompleted.value = null
    }
}
</script>
