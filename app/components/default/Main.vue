<template>
    <main
        ref="mainRef"
        class="w-full flex flex-col items-center gap-5 bg-light text-dark p-5 pt-1 overflow-x-hidden xl:max-w-[640px] xl:justify-self-center 2xl:max-w-none"
        style="overscroll-behavior-y: none"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
    >
        <div
            v-if="showIndicator"
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
                    transition: 'transform 0.1s',
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
const mainRef = ref(null)
const { isRefreshing, triggerRefresh } = usePullToRefresh()

const THRESHOLD = 80

const displayHeight = ref(0)
const isTransitioning = ref(false)

let startY = 0
let isPulling = false

const pullProgress = computed(() => Math.min(displayHeight.value / THRESHOLD, 1))
const arrowRotation = computed(() => pullProgress.value * 180)
const showIndicator = computed(() =>
    displayHeight.value > 0 || isRefreshing.value || isTransitioning.value
)

const onTouchStart = (e) => {
    if (isRefreshing.value) return
    const el = mainRef.value
    if (!el || el.scrollTop > 0) return
    startY = e.touches[0].clientY
    isPulling = false
    isTransitioning.value = false
}

const onTouchMove = (e) => {
    if (!startY) return
    const delta = e.touches[0].clientY - startY
    if (delta <= 0) {
        startY = 0
        return
    }
    isPulling = true
    displayHeight.value = Math.min(delta, THRESHOLD)
    e.preventDefault()
}

const onTouchEnd = async () => {
    if (!isPulling || !startY) {
        startY = 0
        return
    }

    const shouldRefresh = displayHeight.value >= THRESHOLD
    startY = 0
    isPulling = false
    isTransitioning.value = true

    if (shouldRefresh) {
        displayHeight.value = 48
        await triggerRefresh()
    }

    displayHeight.value = 0
    setTimeout(() => { isTransitioning.value = false }, 220)
}

onMounted(() => {
    const el = mainRef.value
    if (el) el.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
    const el = mainRef.value
    if (el) el.removeEventListener('touchmove', onTouchMove)
})
</script>
