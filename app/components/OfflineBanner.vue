<template>
  <Transition name="banner">
    <div v-if="!isOnline" class="offline-banner">
      <span class="banner-dot" />
      Sin conexión — mostrando datos guardados
    </div>
  </Transition>
</template>

<script setup>
const { isOnline } = useOnlineStatus()
</script>

<style scoped>
.offline-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #131815;
  border-bottom: 1px solid #157A6E;
  color: #F3FCF7;
  font-size: 0.75rem;
  font-weight: 500;
  font-family: 'Montserrat Alternates', sans-serif;
}

.banner-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #C24848;
  flex-shrink: 0;
}

.banner-enter-active,
.banner-leave-active {
  transition: all 0.3s ease;
}

.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}
</style>
