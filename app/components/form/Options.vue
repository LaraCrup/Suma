<template>
    <div v-if="isOpen" class="fixed inset-0 z-40 bg-dark bg-opacity-50" @click="closeModal"></div>

    <!-- Modal -->
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-end">
        <div class="relative w-full flex flex-col gap-3 items-center bg-light rounded-t-3xl p-5 pb-6 max-h-[90vh] overflow-y-auto">
            <button
                @click="closeModal"
                class="absolute top-4 right-4 text-gray"
            >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div class="w-full">
                <h2 class="text-xs font-bold text-dark text-center mb-3">{{ title }}</h2>
                <div class="w-full flex flex-col gap-3 px-3">
                    <div v-if="mainOption">
                        <ButtonPrimary
                            @click="selectMainOption"
                            :class="[
                                isMainOptionSelected ? 'bg-primary' : 'bg-transparent text-primary border border-primary'
                            ]"
                        >
                            {{ mainOption }}
                        </ButtonPrimary>

                        <!-- Variantes del mainOption -->
                        <div v-if="isMainOptionSelected && currentVariants.length > 0" class="space-y-3 mt-3">
                            <FormOptionInput
                                v-for="(variant, index) in currentVariants"
                                :key="`main-${index}`"
                                :variant="variant"
                                :isSelected="selectedVariantIndex === index"
                                :counter-value="variantCounters[`main-${index}`] || 0"
                                :max="getMaxForVariant(variant)"
                                :week-days-selected="variantWeekDays[`main-${index}`] || []"
                                :month-days-selected="variantMonthDays[`main-${index}`] || []"
                                @click="selectedVariantIndex = index"
                                @update:counter-value="updateCounter(`main-${index}`, $event)"
                                @update:week-days-selected="updateWeekDays(`main-${index}`, $event)"
                                @update:month-days-selected="updateMonthDays(`main-${index}`, $event)"
                            ></FormOptionInput>
                        </div>
                    </div>

                    <!-- Opciones secundarias -->
                    <div v-for="(option, index) in secondaryOptions" :key="`secondary-${index}`">
                        <ButtonPrimary
                            @click="selectSecondaryOption(index)"
                            :class="[
                                selectedSecondaryIndex === index ? 'bg-primary' : 'bg-transparent text-primary border border-primary'
                            ]"
                        >
                            {{ option }}
                        </ButtonPrimary>

                        <!-- Variantes de la opción secundaria -->
                        <div v-if="selectedSecondaryIndex === index && currentVariants.length > 0" class="space-y-3 mt-3 ml-2">
                            <FormOptionInput
                                v-for="(variant, variantIndex) in currentVariants"
                                :key="`variant-${variantIndex}`"
                                :variant="variant"
                                :isSelected="selectedVariantIndex === variantIndex"
                                :counter-value="variantCounters[`variant-${variantIndex}`] || 0"
                                :max="getMaxForVariant(variant)"
                                :week-days-selected="variantWeekDays[`variant-${variantIndex}`] || []"
                                :month-days-selected="variantMonthDays[`variant-${variantIndex}`] || []"
                                @click="selectedVariantIndex = variantIndex"
                                @update:counter-value="updateCounter(`variant-${variantIndex}`, $event)"
                                @update:week-days-selected="updateWeekDays(`variant-${variantIndex}`, $event)"
                                @update:month-days-selected="updateMonthDays(`variant-${variantIndex}`, $event)"
                            ></FormOptionInput>
                        </div>
                    </div>
                </div>
            </div>
            <div class="w-full flex justify-between mt-3 gap-3">
                <ButtonTerciary class="!w-fit !px-5" @click="closeModal">Cerrar</ButtonTerciary>
                <ButtonPrimary class="!w-fit !px-5" @click="confirmSelection">Aceptar</ButtonPrimary>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    mainOption: {
        type: String,
        default: null
    },
    secondaryOptions: {
        type: Array,
        default: () => []
    },
    modelValue: {
        type: [String, Number],
        default: null
    },
    variantOptions: {
        type: Object,
        default: () => ({})
    },
    previousSelection: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const isOpen = ref(false)
const selectedSecondaryIndex = ref(null)
const isMainOptionSelected = ref(false)
const selectedMainValue = ref(null)
const currentVariants = ref([])
const selectedVariantIndex = ref(null)
const variantCounters = ref({})
const variantWeekDays = ref({})
const variantMonthDays = ref({})

const openModal = () => {
    isOpen.value = true

    // Si hay selección previa, restaurarla
    if (props.previousSelection && props.previousSelection.mainOption) {
        const prevSelection = props.previousSelection

        // Determinar si es mainOption o secondaryOption
        if (prevSelection.mainOption === props.mainOption) {
            isMainOptionSelected.value = true
            selectedSecondaryIndex.value = null
        } else {
            const secondaryIndex = props.secondaryOptions.indexOf(prevSelection.mainOption)
            if (secondaryIndex !== -1) {
                isMainOptionSelected.value = false
                selectedSecondaryIndex.value = secondaryIndex
            } else {
                isMainOptionSelected.value = true
                selectedSecondaryIndex.value = null
            }
        }

        // Cargar variantes del option seleccionado
        if (props.variantOptions[prevSelection.mainOption]) {
            currentVariants.value = props.variantOptions[prevSelection.mainOption]

            // Encontrar el índice de la variante anterior
            const variantIndex = currentVariants.value.indexOf(prevSelection.variant)
            selectedVariantIndex.value = variantIndex !== -1 ? variantIndex : 0

            // Restaurar datos de la variante
            if (prevSelection.variantData) {
                const variantKey = isMainOptionSelected.value
                    ? `main-${selectedVariantIndex.value}`
                    : `variant-${selectedVariantIndex.value}`

                if (prevSelection.variantData.counter !== undefined) {
                    variantCounters.value[variantKey] = prevSelection.variantData.counter
                }
                if (prevSelection.variantData.weekDays && prevSelection.variantData.weekDays.length > 0) {
                    variantWeekDays.value[variantKey] = prevSelection.variantData.weekDays
                }
                if (prevSelection.variantData.monthDays && prevSelection.variantData.monthDays.length > 0) {
                    variantMonthDays.value[variantKey] = prevSelection.variantData.monthDays
                }
            }
        }
    } else {
        // Inicializar con mainOption seleccionado por defecto
        isMainOptionSelected.value = true
        selectedSecondaryIndex.value = null
        // Cargar variantes del mainOption
        if (props.mainOption && props.variantOptions[props.mainOption]) {
            currentVariants.value = props.variantOptions[props.mainOption]
            selectedVariantIndex.value = 0
        }
    }
}

const closeModal = () => {
    isOpen.value = false
    isMainOptionSelected.value = false
    selectedSecondaryIndex.value = null
    selectedVariantIndex.value = null
    emit('cancel')
}

const selectMainOption = () => {
    isMainOptionSelected.value = true
    selectedSecondaryIndex.value = null
    selectedVariantIndex.value = 0
    selectedMainValue.value = props.mainOption
    // Limpiar datos de variantes previas
    variantCounters.value = {}
    variantWeekDays.value = {}
    variantMonthDays.value = {}
    // Cargar variantes si existen
    if (props.mainOption && props.variantOptions[props.mainOption]) {
        currentVariants.value = props.variantOptions[props.mainOption]
    }
}

const selectSecondaryOption = (index) => {
    selectedSecondaryIndex.value = index
    isMainOptionSelected.value = false
    selectedVariantIndex.value = 0
    const selectedOption = props.secondaryOptions[index]
    selectedMainValue.value = selectedOption
    // Limpiar datos de variantes previas
    variantCounters.value = {}
    variantWeekDays.value = {}
    variantMonthDays.value = {}
    // Cargar variantes si existen
    if (selectedOption && props.variantOptions[selectedOption]) {
        currentVariants.value = props.variantOptions[selectedOption]
    } else {
        currentVariants.value = []
    }
}

const confirmSelection = () => {
    let selectedValue = null
    let selectedVariant = null
    let variantData = {}
    let variantKey = null

    if (isMainOptionSelected.value) {
        selectedValue = props.mainOption
        if (selectedVariantIndex.value !== null && currentVariants.value.length > 0) {
            selectedVariant = currentVariants.value[selectedVariantIndex.value]
            variantKey = `main-${selectedVariantIndex.value}`
        }
    } else if (selectedSecondaryIndex.value !== null) {
        selectedValue = props.secondaryOptions[selectedSecondaryIndex.value]
        if (selectedVariantIndex.value !== null && currentVariants.value.length > 0) {
            selectedVariant = currentVariants.value[selectedVariantIndex.value]
            variantKey = `variant-${selectedVariantIndex.value}`
        }
    }

    // Recolectar datos de la variante seleccionada
    if (selectedVariant && variantKey) {
        variantData = {
            variant: selectedVariant,
            counter: variantCounters.value[variantKey] || 0,
            weekDays: variantWeekDays.value[variantKey] || [],
            monthDays: variantMonthDays.value[variantKey] || []
        }
    }

    if (selectedValue) {
        const confirmData = {
            mainOption: selectedValue,
            variant: selectedVariant,
            variantData: variantData
        }
        emit('update:modelValue', selectedValue)
        emit('confirm', confirmData)
        closeModal()
    }
}

const getMaxForVariant = (variant) => {
    // Extrae el número máximo de la variante si sigue el formato "Cantidad de X (máx: Y)"
    if (!variant) return null

    const match = variant.match(/máx:\s*(\d+)/i)
    return match ? parseInt(match[1], 10) : null
}

const updateCounter = (key, value) => {
    variantCounters.value[key] = value
}

const updateWeekDays = (key, value) => {
    variantWeekDays.value[key] = value
}

const updateMonthDays = (key, value) => {
    variantMonthDays.value[key] = value
}

defineExpose({
    openModal,
    closeModal
})
</script>