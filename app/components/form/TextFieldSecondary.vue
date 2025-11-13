<template>
    <div class="w-full flex flex-col gap-2">
        <p class="text-[0.625rem] text-green-dark">¿Qué hábito queres formar? Que sea especifico.</p>
        <div class="w-full flex flex-col gap-1">
            <FormLabelSecondary :id="id" :required="required">{{ label }}</FormLabelSecondary>

            <input ref="inputElement" :id="inputId" :type="type" :placeholder="placeholder" :value="modelValue"
                :required="required" @input="handleInput" @blur="handleBlur" @focus="handleFocus"
                :autocomplete="autocomplete"
                class="border-b border-gray outline-none text-dark text-xs font-bold placeholder:text-gray placeholder:text-xs pb-1 mb-1" />

            <FormError v-if="error && showError">{{ error }}</FormError>
        </div>
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