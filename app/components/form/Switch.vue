<template>
    <div class="w-full flex flex-col gap-6">
        <FormLabel :id="id" :required="required" v-if="label">{{ label }}</FormLabel>

        <div class="flex items-center gap-3">
            <span v-if="leftLabel" :class="[
                'text-sm font-medium transition-colors',
                !modelValue ? 'text-dark' : 'text-gray-mid'
            ]">{{ leftLabel }}</span>
            
            <button :id="inputId" type="button" @click="toggle" :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors outline-none',
                modelValue ? 'bg-terciary' : 'bg-gray-mid'
            ]">
                <span :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-light transition-transform',
                    modelValue ? 'translate-x-6' : 'translate-x-1'
                ]" />
            </button>
            
            <span v-if="rightLabel" :class="[
                'text-sm font-medium transition-colors',
                modelValue ? 'text-dark' : 'text-gray-mid'
            ]">{{ rightLabel }}</span>
        </div>

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: ''
    },
    leftLabel: {
        type: String,
        default: ''
    },
    rightLabel: {
        type: String,
        default: ''
    },
    error: {
        type: String,
        default: ''
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

const showError = ref(false)

const inputId = computed(() => props.id)

const toggle = () => {
    emit('update:modelValue', !props.modelValue)

    if (showError.value) {
        showError.value = false
    }
}

watchEffect(() => {
    if (props.error) {
        showError.value = true
    }
})
</script>
