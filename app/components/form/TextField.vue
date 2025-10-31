<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel :id="id" :required="required">{{ label }}</FormLabel>

        <input ref="inputElement" :id="inputId" :type="type" :placeholder="placeholder" :value="modelValue"
            :required="required" @input="handleInput" @blur="handleBlur" @focus="handleFocus"
            :autocomplete="autocomplete"
            class="bg-light border border-primary rounded-full outline-none text-dark text-xs placeholder:text-gray placeholder:text-xs py-3 px-5" />

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: [String, Number],
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
    type: {
        type: String,
        default: 'text'
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
    autocomplete: {
        type: String,
        default: 'off'
    }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const inputElement = ref(null)
const showError = ref(false)

const inputId = computed(() => props.id)


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
    if (inputElement.value) {
        inputElement.value.focus()
    }
}

defineExpose({
    focus
})
</script>