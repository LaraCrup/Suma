<template>
  <ClientOnly>
    <Transition name="fade">
      <div v-if="isVisible" class="fixed inset-0 bg-gradient-primary flex flex-col items-center justify-center z-50">
        <div class="flex flex-col items-center gap-5">
            <NuxtImg src="images/logo-blanco.svg" alt="Logo Blanco Suma" class="w-20" />

            <p class="text-sm text-light">Pequeños pasos, grandes cambios.</p>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<script setup>
import { computed } from 'vue'
import { useSplashStore } from '~/stores/splashStore'

const splashStore = useSplashStore()
const isVisible = computed(() => splashStore.isVisible)
</script>

<style scoped>

.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
