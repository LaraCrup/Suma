<template>
    <form class="w-full max-w-md lg:max-w-[56.25rem] flex flex-col items-center gap-4 lg:gap-7" @submit="$emit('submit', $event)">
        <slot />
    </form>
</template>

<script setup>
defineEmits(['submit'])
</script>