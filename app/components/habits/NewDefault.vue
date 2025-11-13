<template>
    <div class="w-full flex justify-between items-center gap-2 bg-midlight px-3 py-2 rounded-lg">
        <div class="flex items-center gap-2">
            <p>{{ icon }}</p>
            <p>{{ name }}</p>
        </div>
        <NuxtImg src="/images/brillo.svg" alt="Popular" class="h-4 w-4" />
    </div>
</template>

<script setup>
defineProps({
    icon: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }
})
</script>