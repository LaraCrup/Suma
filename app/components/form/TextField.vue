<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel :id="id" :required="required">{{ label }}</FormLabel>

        <div class="relative w-full">
            <slot name="icon" />
            <input ref="inputElement" :id="inputId" :type="type" :placeholder="placeholder" :value="modelValue"
                :required="required" :readonly="readonly" @input="handleInput" @blur="handleBlur" @focus="handleFocus"
                @keyup.enter="$emit('keyup-enter', $event)" @keyup.escape="$emit('keyup-escape', $event)"
                :autocomplete="autocomplete"
                class="w-full bg-light border border-primary rounded-full outline-none text-dark text-xs placeholder:text-gray placeholder:text-xs py-3 px-5"
                :class="{ 'pl-11': $slots.icon }" />
        </div>

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
    },
    readonly: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'keyup-enter', 'keyup-escape'])

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