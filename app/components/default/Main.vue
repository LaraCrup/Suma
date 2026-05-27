<template>
    <main
        ref="mainRef"
        class="w-full flex flex-col items-center gap-5 bg-light text-dark p-5 pt-1 overflow-x-hidden"
        style="overscroll-behavior-y: none"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
    >
        <!-- Indicador de pull-to-refresh -->
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
                <!-- Flecha ↓ → rota a ↑ cuando se alcanza el umbral -->
                <path fill="currentColor" d="M11 4v12.17l-5.59-5.58L4 12l8 8l8-8l-1.41-1.41L13 16.17V4h-2z"/>
            </svg>
        </div>

        <slot />
    </main>
</template>

<script setup>
const mainRef = ref(null)
const { isRefreshing, triggerRefresh } = usePullToRefresh()

const THRESHOLD = 80    // px de arrastre para disparar el refresh

const displayHeight = ref(0)
const isTransitioning = ref(false)

// No reactivos — solo se usan dentro de handlers de touch
let startY = 0
let isPulling = false

const pullProgress = computed(() => Math.min(displayHeight.value / THRESHOLD, 1))
const arrowRotation = computed(() => pullProgress.value * 180)
const showIndicator = computed(() =>
    displayHeight.value > 0 || isRefreshing.value || isTransitioning.value
)

// touchstart: captura el punto de inicio solo si estamos en el tope del scroll
const onTouchStart = (e) => {
    if (isRefreshing.value) return
    const el = mainRef.value
    if (!el || el.scrollTop > 0) return
    startY = e.touches[0].clientY
    isPulling = false
    isTransitioning.value = false
}

// touchmove: registrado manualmente con { passive: false } para poder preventDefault
const onTouchMove = (e) => {
    if (!startY) return
    const delta = e.touches[0].clientY - startY
    if (delta <= 0) {
        // El usuario está scrolleando hacia arriba → soltar el gesto
        startY = 0
        return
    }
    isPulling = true
    displayHeight.value = Math.min(delta, THRESHOLD)
    // Previene el scroll del contenido mientras arrastramos el indicador
    e.preventDefault()
}

// touchend: decide si disparar el refresh o volver a cero
const onTouchEnd = async () => {
    if (!isPulling || !startY) {
        startY = 0
        return
    }

    const shouldRefresh = displayHeight.value >= THRESHOLD
    startY = 0
    isPulling = false
    isTransitioning.value = true  // activa CSS transition para los cambios siguientes

    if (shouldRefresh) {
        displayHeight.value = 48  // colapsa al tamaño del spinner (snap animado 80→48)
        await triggerRefresh()    // espera a que la página recargue sus datos
    }

    displayHeight.value = 0       // colapsa a cero con transición
    setTimeout(() => { isTransitioning.value = false }, 220)
}

onMounted(() => {
    const el = mainRef.value
    // Necesitamos non-passive para poder llamar preventDefault en touchmove
    if (el) el.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
    const el = mainRef.value
    if (el) el.removeEventListener('touchmove', onTouchMove)
})
</script>
