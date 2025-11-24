<template>
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" class="w-fit animate-spin"
        :class="colorClass">
        <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 6V3m4.25 4.75L18.4 5.6M18 12h3m-4.75 4.25l2.15 2.15M12 18v3m-4.25-4.75L5.6 18.4M6 12H3m4.75-4.25L5.6 5.6" />
    </svg>
</template>

<script setup>
const props = defineProps({
    color: {
        type: String,
        default: 'light',
        validator: (value) => ['primary', 'secondary', 'light', 'dark'].includes(value)
    }
})

const colorClass = computed(() => {
    const colors = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        light: 'text-light',
        dark: 'text-dark'
    }
    return colors[props.color]
})
</script>
