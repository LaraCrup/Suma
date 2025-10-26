<template>
    <div class="w-full flex flex-col gap-2">
        <p v-if="label" class="text-dark font-light lg:text-xl">
            {{ label }}
            <span v-if="required" class="text-primary ml-1">*</span>
        </p>

        <div class="relative">
            <div @click="toggleDropdown"
                class="flex items-center justify-between bg-light border border-dark rounded-[5px] lg:text-xl font-light text-dark cursor-pointer outline-none py-3 px-[0.875rem]">
                <span v-if="selectedOption" class="truncate">{{ selectedOption.label }}</span>
                <span v-else class="text-gray-dark">{{ placeholder }}</span>
                <Icon name="tabler:chevron-down" class="w-5 h-5"
                    :class="['transition-transform', isOpen ? 'rotate-180' : '']" />
            </div>

            <div v-if="isOpen"
                class="max-h-60 absolute top-full left-0 right-0 z-50 bg-light border border-dark rounded-[5px] overflow-hidden mt-1">
                <div class="border-b border-gray-200">
                    <label for="buscar" class="sr-only">Buscar</label>
                    <input id="buscar" v-model="searchQuery" type="text" placeholder="Buscar..."
                        class="w-full bg-light rounded px-[0.875rem] py-3 text-sm outline-none" @click.stop />
                </div>

                <div class="max-h-48 overflow-y-auto">
                    <div v-if="loading" class="p-3 text-center text-gray-dark">
                        Cargando...
                    </div>
                    <div v-else-if="filteredOptions.length === 0" class="p-3 text-center text-gray-500">
                        No se encontraron resultados
                    </div>
                    <div v-else v-for="option in filteredOptions" :key="option.value" @click="selectOption(option)"
                        class="hover:bg-gray-light cursor-pointer transition-colors duration-200 p-3">
                        {{ option.label }}
                    </div>
                </div>
            </div>
        </div>

        <FormError v-if="error && showError">{{ error }}</FormError>
    </div>
</template>

<script setup>
const props = defineProps({
    modelValue: {
        type: [String, Number],
        default: null
    },
    label: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: 'Seleccionar...'
    },
    options: {
        type: Array,
        default: () => []
    },
    error: {
        type: String,
        default: ''
    },
    required: {
        type: Boolean,
        default: false
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const showError = ref(false)

const selectedOption = computed(() => {
    if (!props.modelValue) return null
    return props.options.find(option => option.value === props.modelValue)
})

const filteredOptions = computed(() => {
    if (!searchQuery.value) return props.options

    return props.options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

const toggleDropdown = () => {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        searchQuery.value = ''
    }
}

const selectOption = (option) => {
    emit('update:modelValue', option.value)
    isOpen.value = false
    searchQuery.value = ''

    if (showError.value) {
        showError.value = false
    }
}

const closeDropdown = (event) => {
    if (!event.target.closest('.relative')) {
        isOpen.value = false
    }
}

onMounted(() => {
    document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
    document.removeEventListener('click', closeDropdown)
})

watchEffect(() => {
    if (props.error) {
        showError.value = true
    }
})
</script>
