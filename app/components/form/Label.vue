<template>
    <label v-if="id" :for="id" class="sr-only">
        <slot />
    </label>
    <p v-else class="text-dark font-light lg:text-xl">
        <slot />
    </p>
</template>

<script setup>
defineProps({
    id: {
        type: String,
        required: false
    }
})
</script>