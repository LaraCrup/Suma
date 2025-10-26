<template>
    <div class="flex flex-col gap-2">
        <div class="w-full flex items-center gap-3" :class="labelPosition === 'top' ? 'flex-col' : 'flex-row'">
            <div class="relative flex items-center">
                <input ref="checkboxElement" :id="inputId" type="checkbox" :checked="modelValue" :required="required"
                    @change="handleChange" @blur="handleBlur" @focus="handleFocus" class="sr-only" />

                <label :for="inputId"
                    class="w-6 h-6 flex items-center justify-center relative border border-dark rounded-[5px] cursor-pointer"
                    :class="[
                        modelValue ? 'bg-primary text-light' : '',
                        'group'
                    ]">
                    <Icon v-show="modelValue" name="tabler:plus" class="w-6 h-6 rotate-45" />
                </label>
            </div>

            <FormLabel v-if="label" :id="inputId" :required="required"
                class="cursor-pointer select-none lg:text-xl font-light text-dark" @click="toggleCheckbox">
                {{ label }}
            </FormLabel>
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
    labelPosition: {
        type: String,
        default: 'right',
        validator: (value) => ['right', 'left', 'top'].includes(value)
    }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'change'])

const checkboxElement = ref(null)
const showError = ref(false)

const inputId = computed(() => props.id)

const handleChange = (event) => {
    const newValue = event.target.checked
    emit('update:modelValue', newValue)
    emit('change', newValue)

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

const toggleCheckbox = () => {
    if (checkboxElement.value) {
        checkboxElement.value.click()
    }
}

watchEffect(() => {
    if (props.error) {
        showError.value = true
    }
})

const focus = () => {
    if (checkboxElement.value) {
        checkboxElement.value.focus()
    }
}

const toggle = () => {
    toggleCheckbox()
}

defineExpose({
    focus,
    toggle
})
</script>