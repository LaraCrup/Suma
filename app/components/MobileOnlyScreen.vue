<template>
  <div v-if="isDesktop" class="w-screen h-screen flex flex-col justify-center items-center gap-6 bg-white">
    <HeadingH1 class="max-w-screen-lg text-center">Esta aplicación solo funciona para dispositivos móviles</HeadingH1>
    <p class="max-w-screen-lg text-lg text-center">
      Esta aplicación está optimizada únicamente para dispositivos móviles. Por favor, accede desde tu teléfono para poder utilizarla.
    </p>
  </div>
  <template v-else>
    <slot />
  </template>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isDesktop = ref(false)
const MAX_WIDTH = 768

const checkScreenSize = () => {
  isDesktop.value = window.innerWidth > MAX_WIDTH
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>
