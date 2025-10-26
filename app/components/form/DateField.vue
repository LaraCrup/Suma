<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel :id="id" :required="required" v-if="label">{{ label }}</FormLabel>

        <div class="relative">
            <input ref="inputElement" :id="inputId" type="date" :value="formattedValue" :required="required"
                :min="minDate" :max="maxDate" @input="handleInput" @blur="handleBlur" @focus="handleFocus"
                class="w-full bg-light border border-dark rounded-[5px] lg:text-xl font-light text-dark outline-none py-3 px-[0.875rem]" />
        </div>

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: [String, Date],
        default: ''
    },
    label: {
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
    minDate: {
        type: [String, Date],
        default: null
    },
    maxDate: {
        type: [String, Date],
        default: null
    },
    displayFormat: {
        type: Boolean,
        default: true
    },
    locale: {
        type: String,
        default: 'es-ES'
    }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const inputElement = ref(null)
const showError = ref(false)

const inputId = computed(() => props.id)

const formattedValue = computed(() => {
    if (!props.modelValue) return ''

    try {
        if (typeof props.modelValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(props.modelValue)) {
            return props.modelValue
        }

        const date = new Date(props.modelValue)
        if (isNaN(date.getTime())) return ''

        return date.toISOString().split('T')[0]
    } catch (error) {
        console.warn('Error formatting date:', error)
        return ''
    }
})

const handleInput = (event) => {
    const value = event.target.value

    emit('update:modelValue', value)

    if (showError.value) {
        showError.value = false
    }
}

const handleBlur = (event) => {
    if (props.error) {
        showError.value = true
    }

    if (event.target.value && !isValidDate(event.target.value)) {
        showError.value = true
    }

    emit('blur', event)
}

const handleFocus = (event) => {
    emit('focus', event)
}

const isValidDate = (dateString) => {
    if (!dateString) return true

    const date = new Date(dateString)
    return !isNaN(date.getTime())
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

const clear = () => {
    emit('update:modelValue', '')
    showError.value = false
}

const setToday = () => {
    const today = new Date().toISOString().split('T')[0]
    emit('update:modelValue', today)
    showError.value = false
}

defineExpose({
    focus,
    clear,
    setToday
})
</script>