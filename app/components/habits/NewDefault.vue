<template>
    <div
        @click="$emit('select')"
        :class="['w-full flex justify-between items-center gap-2 px-3 2xl:px-4 py-2 2xl:py-3 rounded-lg cursor-pointer transition-colors', isSelected ? 'bg-accent' : 'bg-midlight']"
    >
        <div class="flex items-center gap-2 2xl:gap-3">
            <p>{{ icon }}</p>
            <p class="text-xs 2xl:text-sm">{{ name }}</p>
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
    },
    isSelected: {
        type: Boolean,
        default: false
    }
})

defineEmits(['select'])
</script>