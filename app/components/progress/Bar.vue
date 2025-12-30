<template>
    <div :class="backgroundColorClass" class="w-full h-3 rounded-full overflow-hidden">
        <div
            :style="{ width: `${percentage}%` }"
            :class="barColorClass"
            class="h-full rounded-full transition-all duration-300"
        ></div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    progressCount: {
        type: Number,
        default: 0
    },
    goalValue: {
        type: Number,
        default: 1
    },
    backgroundColor: {
        type: String,
        default: 'bg-green-dark'
    },
    barColor: {
        type: String,
        default: 'bg-gradient-primary-horizontal-reverse'
    }
})

const percentage = computed(() => {
    return ((props.progressCount || 0) / (props.goalValue || 1)) * 100
})

const isMaxReached = computed(() => {
    return (props.progressCount || 0) >= (props.goalValue || 1)
})

const backgroundColorClass = computed(() => {
    return props.backgroundColor
})

const barColorClass = computed(() => {
    return props.barColor
})
</script>
