<template>
    <div class="w-full flex flex-col gap-2" data-textarea>
        <FormLabel :id="id" :required="required" v-if="label">{{ label }}</FormLabel>

        <textarea ref="textareaElement" :id="inputId" :placeholder="placeholder" :value="modelValue"
            :required="required" :rows="rows" @input="handleInput" @blur="handleBlur" @focus="handleFocus"
            class="min-h-[120px] bg-light border border-dark rounded-[5px] outline-none lg:text-xl font-light text-dark lg:placeholder:text-xl placeholder:font-light placeholder:text-gray-dark py-3 px-[0.875rem] resize-none" />

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    label: {
        type: String,
        default: ''
    },
    placeholder: {
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
    },
    rows: {
        type: Number,
        default: 4
    },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const textareaElement = ref(null)
const showError = ref(false)

const inputId = computed(() => props.id)

const characterCount = computed(() => {
    return props.modelValue ? props.modelValue.length : 0
})

const handleInput = (event) => {
    emit('update:modelValue', event.target.value)

    if (showError.value) {
        showError.value = false
    }
}

const handleBlur = (event) => {
    if (props.error) {
        showError.value = true
    }
    emit('blur', event)
}

const handleFocus = (event) => {
    emit('focus', event)
}

watchEffect(() => {
    if (props.error) {
        showError.value = true
    }
})

const focus = () => {
    if (textareaElement.value) {
        textareaElement.value.focus()
    }
}

defineExpose({
    focus
})
</script>
