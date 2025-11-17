<template>
    <div class="w-full flex flex-col gap-2">
        <FormLabel :id="id" :required="required" class="text-sm text-primary">{{ label }}</FormLabel>

        <div
            class="relative bg-light border border-primary rounded-full outline-none text-dark text-xs placeholder:text-gray placeholder:text-xs py-3 px-5">
            <input :id="inputId" :type="showPassword ? 'text' : 'password'" :placeholder="placeholder"
                :value="modelValue" :required="required" @input="handleInput" @blur="handleBlur" @focus="handleFocus"
                autocomplete="current-password" class="w-full bg-light outline-none text-xs" />

            <button type="button"
                class="flex justify-center items-center absolute right-3 top-1/2 transform -translate-y-1/2 text-dark"
                @click="togglePasswordVisibility"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                <img :src="showPassword ? '/images/icons/eye-open.svg' : '/images/icons/eye-close.svg'" alt="Mostrar/Ocultar Contraseña" class="w-4 h-4" />
            </button>
        </div>

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
        default: 'Contraseña'
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
    initiallyVisible: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'toggle-visibility'])

const showPassword = ref(props.initiallyVisible)
const showError = ref(false)

const inputId = computed(() => props.id)

const togglePasswordVisibility = () => {
    if (!props.disabled) {
        showPassword.value = !showPassword.value
        emit('toggle-visibility', showPassword.value)
    }
}

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

const handleKeydown = (event) => {
    if (event.altKey && event.key === 'Enter') {
        event.preventDefault()
        togglePasswordVisibility()
    }
}

onMounted(() => {
    const input = document.getElementById(inputId.value)
    if (input) {
        input.addEventListener('keydown', handleKeydown)
    }
})

onUnmounted(() => {
    const input = document.getElementById(inputId.value)
    if (input) {
        input.removeEventListener('keydown', handleKeydown)
    }
})
</script>