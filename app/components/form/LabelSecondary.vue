<template>
    <label :for="id" class="text-xs 2xl:text-sm text-dark font-semibold">
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