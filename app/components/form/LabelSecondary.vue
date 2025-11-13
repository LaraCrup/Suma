<template>
    <label :for="id" class="text-xs text-dark">
        <slot />
    </label>
</template>

<script setup>
defineProps({
    id: {
        type: String,
        required: false
    }
})
</script>