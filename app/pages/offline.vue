<template>
  <div class="offline-page">
    <div class="offline-content">
      <NuxtImg src="/images/isotipo.png" alt="Suma" class="offline-logo" />
      <h1 class="offline-title">Sin conexión</h1>
      <p class="offline-message">
        Parece que no tenés conexión a internet.<br />
        Revisá tu red e intentá de nuevo.
      </p>
      <button class="offline-button" @click="retry">Reintentar</button>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

function retry() {
  window.location.reload()
}
</script>

<style scoped>
.offline-page {
  min-height: 100dvh;
  background-color: #131815;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.offline-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
  text-align: center;
  max-width: 320px;
}

.offline-logo {
  width: 4rem;
  opacity: 0.8;
}

.offline-title {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 1.5rem;
  font-weight: 700;
  color: #F3FCF7;
}

.offline-message {
  font-family: 'Montserrat Alternates', sans-serif;
  font-size: 0.9rem;
  color: #999999;
  line-height: 1.6;
}

.offline-button {
  margin-top: 0.5rem;
  padding: 0.75rem 2rem;
  background-color: #157A6E;
  color: #F3FCF7;
  font-family: 'Montserrat Alternates', sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
}
</style>
