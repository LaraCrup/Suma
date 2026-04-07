<template>
    <div class="w-full flex items-center gap-3 bg-midlight rounded-lg p-3">
        <div>
            <div class="w-8 h-8 flex items-center justify-center bg-gradient-secondary rounded-full">
                <p class="text-lg">{{ habit?.icon ?? '✨' }}</p>
            </div>
        </div>
        <div class="h-full flex flex-col justify-between">
            <h2 class="text-sm text-dark">{{ habit?.name ?? 'Hábito compartido' }}</h2>
            <div class="flex gap-1 items-center">
                <div class="w-3 h-3 bg-gray rounded-full"></div>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    habit: {
        type: Object,
        default: null
    }
})
</script>
