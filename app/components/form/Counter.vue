<template>
    <div class="w-28 flex items-center justify-between rounded-lg bg-midlight px-3 py-2">
        <button
            @click="decrease"
            :disabled="value <= 0"
            class="flex items-center justify-center w-6 h-6 rounded-full"
            :class="value <= 0 ? 'text-gray cursor-not-allowed' : 'text-green-light'"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
            </svg>
        </button>
        <div class="flex flex-col items-center gap-1">
            <span class="text-dark text-xs font-bold">{{ value }}</span>
            <span v-if="max" class="text-gray text-xs">máx: {{ max }}</span>
        </div>
        <button
            @click="increase"
            :disabled="max && value >= max"
            class="flex items-center justify-center w-6 h-6 rounded-full"
            :class="max && value >= max ? 'text-gray cursor-not-allowed' : 'text-green-light'"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
        </button>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: null
    },
    min: {
        type: Number,
        default: 0
    }
})

const emit = defineEmits(['update:modelValue'])

const value = computed({
    get: () => props.modelValue,
    set: (newVal) => emit('update:modelValue', newVal)
})

const increase = () => {
    if (!props.max || value.value < props.max) {
        value.value++
    }
}

const decrease = () => {
    if (value.value > props.min) {
        value.value--
    }
}
</script>
