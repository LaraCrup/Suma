<template>
    <button
        ref="cardRef"
        @click="handleClick"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        :class="['w-full relative overflow-hidden flex justify-between rounded-lg p-3 transition-colors', effectiveCompleted ? 'bg-accent' : 'bg-midlight']">
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
                                {{ member.display_name?.[0] }}
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
            <div v-if="habit?.streak > 0 && effectiveCompleted" :class="['flex flex-shrink-0 items-center gap-1', isUpdating ? 'animate-pulse' : '']">
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
    }
})

const emit = defineEmits(['habitUpdated'])

const MAX_VISIBLE = 5
const currentUserId = ref(null)

const visibleMembers = computed(() => props.members.slice(0, MAX_VISIBLE))
const extraCount = computed(() => Math.max(0, props.members.length - MAX_VISIBLE))
const myMember = computed(() => props.members.find(m => m.id === currentUserId.value))

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
    const dir = swipeDirection.value
    if (dir === 'right') return !effectiveCompleted.value
    if (dir === 'left') return effectiveCompleted.value
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

const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStartX.value
    const dy = e.touches[0].clientY - touchStartY.value

    if (!isHorizontalGesture.value && Math.abs(dy) > Math.abs(dx) + 5) return

    if (Math.abs(dx) > 8) {
        isHorizontalGesture.value = true
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
}

const handleTouchEnd = async (e) => {
    const touchEndX = e.changedTouches[0].clientX
    const touchEndTime = Date.now()
    const swipeDistance = Math.abs(touchEndX - touchStartX.value)
    const swipeTime = touchEndTime - touchStartTime.value
    const direction = touchEndX > touchStartX.value ? 'right' : 'left'

    const isValidSwipe = swipeDistance > SWIPE_THRESHOLD && swipeTime < 800
    const willAct = isValidSwipe && (
        (direction === 'right' && !effectiveCompleted.value) ||
        (direction === 'left' && effectiveCompleted.value)
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
    if (props.habit?.community_id) {
        router.push(`/comunidades/${props.habit.community_id}/habito`)
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
        await logCommunityHabitProgress(props.habit.id, progressNeeded, goalValue)
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
        await logCommunityHabitProgress(props.habit.id, -currentProgress, props.habit.goal_value || 1)
        emit('habitUpdated', props.habit.id)
    } catch (error) {
        console.error('Error reiniciando hábito comunitario:', error)
        localOverrideCompleted.value = null
    }
}
</script>
