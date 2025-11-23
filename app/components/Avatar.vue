<template>
  <div class="w-16 h-16 flex items-center justify-center bg-green-light rounded-full overflow-hidden">
    <img v-if="preview || image" :src="preview || image" :alt="`Avatar de ${name}`" class="w-full h-full bg-cover" />
    <div v-else class="w-full h-full flex items-center justify-center text-2xl text-light font-bold">{{ initial }}</div>
  </div>
</template>

<script setup>
defineProps({
  name: String,
  initial: String,
  image: String,
  preview: String
})
</script>
