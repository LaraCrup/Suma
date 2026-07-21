<template>
    <label :for="id" class="text-sm 2xl:text-base text-primary">
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