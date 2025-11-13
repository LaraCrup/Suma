<template>
    <button :id="inputId" type="button" @click="toggle" :class="[
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none',
        modelValue ? 'bg-green-dark' : 'bg-gray'
    ]">
        <span :class="[
            'inline-block h-4 w-4 transform rounded-full bg-light transition-transform',
            modelValue ? 'translate-x-6' : 'translate-x-1'
        ]" />
    </button>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    required: {
        type: Boolean,
        default: false
    },
    id: {
        type: String,
        required: true,
    }
})

const emit = defineEmits(['update:modelValue'])
const inputId = computed(() => props.id)
</script>
