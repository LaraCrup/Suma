<template>
  <ClientOnly>
    <div v-if="isVisible" class="splash-container">
      <div class="splash-content">
        <div class="splash-logo">
          <NuxtImg src="images/logo-blanco.svg" alt="Logo Blanco Suma" class="w-20" />
        </div>
        <p class="splash-text">Pequeños pasos, grandes cambios.</p>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
import { computed } from 'vue'
import { useSplashStore } from '~/stores/splashStore'

const splashStore = useSplashStore()
const isVisible = computed(() => splashStore.isVisible)
</script>

<style scoped>
.splash-container {
  position: fixed;
  inset: 0;
  background: linear-gradient(to bottom, #D7F560, #157A6E);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 50;
  animation: fadeOut 0.5s ease-in forwards;
  animation-delay: 2s;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.splash-logo {
  animation: scaleInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.splash-text {
  font-size: 0.875rem;
  color: #F3FCF7;
  animation: fadeInUp 1s ease-out 0.3s forwards;
  opacity: 0;
}

@keyframes scaleInUp {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    visibility: hidden;
  }
}
</style>
