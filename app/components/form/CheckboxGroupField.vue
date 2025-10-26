<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel v-if="label" :required="required" class="lg:text-xl font-light text-dark">
            {{ label }}
        </FormLabel>

        <div class="flex flex-wrap gap-y-3" v-if="options && options.length > 0">
            <FormCheckboxField class="w-[24%]" v-for="option in options" :key="option.value" :id="`${id}-${option.value}`"
                :label="option.label" :modelValue="isOptionSelected(option.value)"
                @update:modelValue="(checked) => handleOptionChange(option.value, checked)" :error="option.error"
                label-position="right" />
        </div>

        <div v-else-if="loading" class="text-sm text-gray-500">
            Cargando opciones...
        </div>

        <div v-else class="text-sm text-gray-500">
            No hay opciones disponibles
        </div>

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: [Array, String],
        default: () => []
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
    options: {
        type: Array,
        default: () => []
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'change'])

const showError = ref(false)

const selectedValues = computed(() => {
    if (Array.isArray(props.modelValue)) {
        return props.modelValue
    }
    if (typeof props.modelValue === 'string' && props.modelValue) {
        return props.modelValue.split(',').map(v => v.trim()).filter(Boolean)
    }
    return []
})

const isOptionSelected = (value) => {
    return selectedValues.value.includes(value.toString())
}

const handleOptionChange = (value, checked) => {
    let newValues = [...selectedValues.value]
    const valueStr = value.toString()

    if (checked) {
        if (!newValues.includes(valueStr)) {
            newValues.push(valueStr)
        }
    } else {
        newValues = newValues.filter(v => v !== valueStr)
    }

    emit('update:modelValue', newValues)
    emit('change', newValues)

    if (showError.value) {
        showError.value = false
    }
}

watchEffect(() => {
    if (props.error) {
        showError.value = true
    }
})

const focus = () => {
    const firstCheckbox = document.querySelector(`#${props.id}-${props.options[0]?.value}`)
    if (firstCheckbox) {
        firstCheckbox.focus()
    }
}

const clear = () => {
    emit('update:modelValue', [])
    emit('change', [])
}

defineExpose({
    focus,
    clear
})
</script>
