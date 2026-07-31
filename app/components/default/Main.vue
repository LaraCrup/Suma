<template>
    <main
        ref="mainRef"
        class="w-full flex flex-col items-center gap-5 bg-light text-dark p-5 pt-1 overflow-x-hidden xl:max-w-[640px] xl:justify-self-center 2xl:max-w-none"
        style="overscroll-behavior-y: none"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
        @touchcancel.passive="onTouchEnd"
    >
        <div
            v-if="pullToRefresh && showIndicator"
            class="w-full flex items-center justify-center overflow-hidden"
            :class="{ 'transition-[height] duration-200 ease-out': isTransitioning }"
            :style="{ height: displayHeight + 'px' }"
        >
            <Loader v-if="isRefreshing" color="primary" class="!w-6 !h-6" />
            <svg
                v-else
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                class="text-primary"
                :style="{
                    transform: `rotate(${arrowRotation}deg)`,
                    transition: isTransitioning ? 'transform 0.2s ease-out' : 'none',
                    opacity: pullProgress
                }"
            >
                <path fill="currentColor" d="M11 4v12.17l-5.59-5.58L4 12l8 8l8-8l-1.41-1.41L13 16.17V4h-2z"/>
            </svg>
        </div>

        <slot />
    </main>
</template>

<script setup>
const props = defineProps({
    pullToRefresh: { type: Boolean, default: true }
})

const mainRef = ref(null)
const route = useRoute()
const { isRefreshing, triggerRefresh } = usePullToRefresh()

watch(() => route.path, () => {
    const el = mainRef.value
    if (el) el.scrollTop = 0
})

const THRESHOLD = 70
const MAX_PULL = 120
const RESISTANCE = 0.35
const DIRECTION_DEADZONE = 8

const displayHeight = ref(0)
const isTransitioning = ref(false)

let startX = 0
let startY = 0
let isPulling = false
let isLocked = false
let directionDecided = false
let rafId = null
let pendingHeight = 0

const pullProgress = computed(() => Math.min(displayHeight.value / THRESHOLD, 1))
const arrowRotation = computed(() => pullProgress.value * 180)
const showIndicator = computed(() =>
    displayHeight.value > 0 || isRefreshing.value || isTransitioning.value
)

const cancelPendingFrame = () => {
    if (rafId === null) return
    cancelAnimationFrame(rafId)
    rafId = null
}

const setHeight = (value) => {
    pendingHeight = value
    if (rafId !== null) return
    rafId = requestAnimationFrame(() => {
        rafId = null
        displayHeight.value = pendingHeight
    })
}

const resetGesture = () => {
    startX = 0
    startY = 0
    isPulling = false
    isLocked = false
    directionDecided = false
}

const onTouchStart = (e) => {
    resetGesture()
    if (!props.pullToRefresh || isRefreshing.value) return
    if (e.touches.length !== 1) return
    const el = mainRef.value
    if (!el || el.scrollTop > 0) return
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    isTransitioning.value = false
}

const onTouchMove = (e) => {
    if (!props.pullToRefresh || isLocked || !startY) return

    const el = mainRef.value
    if (!el || el.scrollTop > 0) {
        isLocked = true
        return
    }

    const dx = e.touches[0].clientX - startX
    const dy = e.touches[0].clientY - startY

    if (!directionDecided) {
        if (Math.abs(dx) < DIRECTION_DEADZONE && Math.abs(dy) < DIRECTION_DEADZONE) return
        if (dy <= 0 || Math.abs(dx) >= Math.abs(dy)) {
            isLocked = true
            return
        }
        directionDecided = true
    }

    if (dy <= 0) {
        isLocked = true
        setHeight(0)
        return
    }

    isPulling = true
    const resisted = dy <= THRESHOLD ? dy : THRESHOLD + (dy - THRESHOLD) * RESISTANCE
    setHeight(Math.min(resisted, MAX_PULL))
    e.preventDefault()
}

const onTouchEnd = async () => {
    const wasPulling = isPulling
    const height = pendingHeight
    resetGesture()
    cancelPendingFrame()

    if (!wasPulling && height === 0 && displayHeight.value === 0) return

    isTransitioning.value = true

    if (wasPulling && height >= THRESHOLD) {
        pendingHeight = 48
        displayHeight.value = 48
        await triggerRefresh()
    }

    pendingHeight = 0
    displayHeight.value = 0
    setTimeout(() => { isTransitioning.value = false }, 220)
}

onMounted(() => {
    if (!props.pullToRefresh) return
    const el = mainRef.value
    if (el) el.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
    cancelPendingFrame()
    const el = mainRef.value
    if (el) el.removeEventListener('touchmove', onTouchMove)
})
</script>
