<template>
    <form @submit.prevent="handleSubmit" class="w-full flex flex-col items-center gap-5">
        <div class="w-full flex flex-col gap-4">
            <FormTextFieldSecondary v-model="formData.habitName" id="habit-name" label="Nombre del hábito"
                hint="¿Qué hábito queres formar? Que sea específico." placeholder="Ej: Tomar agua"
                :error="errors.habitName" required />
            <FormTextFieldSecondary v-model="formData.habitWhenWhere" id="habit-when-where" label="Cuándo / Dónde"
                hint="¿Cuándo tiene sentido hacer este hábito? ¿Dónde podes fácilmente hacer este hábito?"
                placeholder="Ej: Antes de desayunar" :error="errors.habitWhenWhere" required />
            <FormTextFieldSecondary v-model="formData.habitIdentity" id="habit-identity" label="Para convertirme en"
                hint="La meta no es correr una maratón, la meta es convertirte en corredor."
                placeholder="Ej: Una persona más saludable" :error="errors.habitIdentity" required />
        </div>

        <!-- Icono del hábito -->
        <div class="w-full flex flex-col gap-1">
            <div class="w-full flex justify-between">
                <FormLabelSecondary id="habit-icon" required>Icono del hábito</FormLabelSecondary>
                <input id="habit-icon-input" v-model="formData.habitIcon" type="text"
                    class="w-8 text-xl text-center bg-transparent outline-nones"
                    placeholder="❇️" maxlength="2" required aria-required="true"
                    aria-invalid="errors.habitIcon ? 'true' : 'false'"
                    :aria-describedby="errors.habitIcon ? 'habit-icon-error' : null" />
            </div>
            <FormError v-if="errors.habitIcon" id="habit-icon-error">{{ errors.habitIcon }}</FormError>
        </div>

        <!-- Frecuencia -->
        <div class="w-full flex flex-col gap-1">
            <FormLabelSecondary>Frecuencia</FormLabelSecondary>
            <button id="frequency-button" type="button"
                class="w-full text-right text-xs text-dark font-bold bg-transparent border-b border-gray outline-none pb-1 cursor-pointer hover:opacity-70 transition-opacity"
                @click="openFrequencyModal" aria-haspopup="dialog" aria-controls="frequency-modal"
                :aria-invalid="errors.frequencyVariant ? 'true' : 'false'"
                :aria-describedby="errors.frequencyVariant ? 'frequency-error' : null">
                <div class="flex justify-between gap-3">
                    <span class="text-xs">
                        {{ formData.frequencyType === 'diario' ? 'Diario' : formData.frequencyType === 'semanal' ?
                        'Semanal' : 'Mensual' }}
                    </span>
                    <span class="text-xs">
                        {{ formData.frequencyVariant ? formData.frequencyVariant : 'Todos los días' }}
                    </span>
                </div>
            </button>
            <FormOptions ref="frequencyModal" title="Frecuencia"
                :mainOption="'Diario'" :secondaryOptions="['Semanal', 'Mensual']" :variantOptions="frequencyVariants"
                :previousSelection="getPreviousFrequencySelection()" @confirm="handleFrequencySelect"></FormOptions>
            <FormError v-if="errors.frequencyVariant" id="frequency-error">{{ errors.frequencyVariant }}</FormError>
        </div>

        <!-- Meta -->
        <fieldset class="w-full flex flex-col gap-1 border-none p-0">
            <div class="w-full flex items-center justify-between">
                <FormLabelSecondary>Meta</FormLabelSecondary>
                <div class="flex items-center gap-1">
                    <input id="goal-value" v-model.number="formData.goalValue" type="number"
                        class="w-12 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1 border border-transparent outline-none"
                        placeholder="2" min="1" max="999" step="1" required aria-required="true"
                        aria-invalid="errors.goalValue ? 'true' : 'false'"
                        :aria-describedby="errors.goalValue ? 'goal-value-error' : null" />
                    <input id="habit-unit" v-model="formData.habitUnit" type="text"
                        class="w-16 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1 border border-transparent outline-none"
                        placeholder="km" maxlength="20" required aria-required="true"
                        aria-invalid="errors.habitUnit ? 'true' : 'false'"
                        :aria-describedby="errors.habitUnit ? 'habit-unit-error' : null" />
                    <p class="text-xs text-dark font-semibold ml-1">
                        /{{ formData.frequencyType === 'diario' ? 'día' : formData.frequencyType === 'semanal' ?
                        'semana' : 'mes' }}
                    </p>
                </div>
            </div>
            <FormError v-if="errors.goalValue" id="goal-value-error">{{ errors.goalValue }}</FormError>
            <FormError v-if="errors.habitUnit" id="habit-unit-error">{{ errors.habitUnit }}</FormError>
        </fieldset>
        <div class="w-full bg-green-dark rounded p-1">
            <p class="text-center text-xs text-light">
                {{ formData.habitName ? formData.habitName : 'Hábito' }}: {{ formData.goalValue }} {{ formData.habitUnit
                }} {{ getFrequencyDescription() }}
            </p>
        </div>
        <div class="w-full flex justify-between items-center">
            <FormLabelSecondary>Recordatorios</FormLabelSecondary>
            <FormSwitch id="habit-reminders" v-model="formData.reminderEnabled" />
        </div>

        <!-- Botón de envío -->
        <ButtonPrimary type="submit" :disabled="isLoading">
            {{ isLoading ? (isEditing ? 'Actualizando...' : 'Creando...') : (isEditing ? 'Actualizar hábito' : 'Crear hábito') }}
        </ButtonPrimary>
    </form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useHabits } from '~/composables/useHabits'
import { useNotification } from '~/composables/useNotification'
import { handleSupabaseError } from '~/utils/handleSupabaseError'

const props = defineProps({
    initialData: {
        type: Object,
        default: null
    },
    isEditing: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['submit', 'success', 'error'])

// Composables
const { createHabit: createHabitDB, updateHabit: updateHabitDB } = useHabits()
const { success, error: showError } = useNotification()

// Form data
const formData = reactive({
    habitName: '',
    habitIcon: '📝',
    habitUnit: 'veces',
    habitWhenWhere: '',
    habitIdentity: '',
    goalValue: 1,
    frequencyType: 'diario',
    frequencyOption: 'todos',
    frequencyVariant: null,
    frequencyVariantData: {},
    reminderEnabled: false
})

// Variantes de frecuencia
const frequencyVariants = {
    'Diario': [
        'Todos los días',
        'Dias especificos de la semana',
        'Cantidad de dias de la semana',
        'Dias especificos del mes',
        'Cantidad de dias del mes'
    ],
    'Semanal': [
        'Toda la semana',
        'Dias especificos de la semana'
    ],
    'Mensual': [
        'Todo el mes',
        'Dias especificos del mes'
    ]
}

// Errors
const errors = ref({
    habitName: null,
    habitIcon: null,
    habitUnit: null,
    habitWhenWhere: null,
    habitIdentity: null,
    goalValue: null,
    frequencyVariant: null
})

const isLoading = ref(false)
const frequencyModal = ref(null)

// Métodos
const openFrequencyModal = () => {
    frequencyModal.value?.openModal()
}

const getPreviousFrequencySelection = () => {
    if (!formData.frequencyVariant) {
        return null
    }

    return {
        mainOption: formData.frequencyType === 'diario' ? 'Diario' : formData.frequencyType === 'semanal' ? 'Semanal' : 'Mensual',
        variant: formData.frequencyVariant.includes('(') ? formData.frequencyVariant.split('(')[0].trim() : formData.frequencyVariant,
        variantData: formData.frequencyVariantData
    }
}

const getFrequencyDescription = () => {
    if (!formData.frequencyVariant) {
        const frequencyLabels = {
            'diario': 'cada día',
            'semanal': 'cada semana',
            'mensual': 'cada mes'
        }
        return frequencyLabels[formData.frequencyType] || 'cada día'
    }

    // Si es "Todos los días", "Toda la semana" o "Todo el mes"
    if (formData.frequencyVariant.includes('Todos') ||
        formData.frequencyVariant.includes('Toda') ||
        formData.frequencyVariant.includes('Todo')) {
        const frequencyLabels = {
            'diario': 'cada día',
            'semanal': 'cada semana',
            'mensual': 'cada mes'
        }
        return frequencyLabels[formData.frequencyType] || 'cada día'
    }

    // Si incluye días de la semana específicos
    if (formData.frequencyVariant.includes('Dias especificos de la semana')) {
        const match = formData.frequencyVariant.match(/\(([^)]+)\)/)
        if (match) {
            return `los días: ${match[1]}`
        }
        return 'en días específicos de la semana'
    }

    // Si incluye días del mes específicos
    if (formData.frequencyVariant.includes('Dias especificos del mes')) {
        // Verifica que realmente tiene números (no letras de semana)
        const match = formData.frequencyVariant.match(/\(([^)]+)\)/)
        if (match) {
            const content = match[1]
            // Si contiene números, muéstralos como días del mes
            if (/\d/.test(content)) {
                return `los días del mes: ${content}`
            }
        }
        return 'en días específicos del mes'
    }

    // Si incluye cantidad de días
    if (formData.frequencyVariant.includes('Cantidad de')) {
        // Busca un número entre paréntesis que NO sea una lista de números
        const match = formData.frequencyVariant.match(/\((\d+)\)$/)
        if (match) {
            const cantidad = match[1]
            // Verificar si es cantidad de días de la semana o del mes según el texto del variant
            if (formData.frequencyVariant.includes('semana')) {
                return `${cantidad} días a la semana`
            } else if (formData.frequencyVariant.includes('mes')) {
                return `${cantidad} días del mes`
            }
        }
        return 'algunos días'
    }

    // Por defecto
    const frequencyLabels = {
        'diario': 'cada día',
        'semanal': 'cada semana',
        'mensual': 'cada mes'
    }
    return frequencyLabels[formData.frequencyType] || 'cada día'
}

const handleFrequencySelect = (confirmData) => {
    const frequencyMap = {
        'Diario': 'diario',
        'Semanal': 'semanal',
        'Mensual': 'mensual'
    }

    formData.frequencyType = frequencyMap[confirmData.mainOption] || 'diario'
    formData.frequencyVariant = confirmData.variant || null
    formData.frequencyVariantData = confirmData.variantData || {}

    // Construir texto mejorado con detalles
    if (confirmData.variant) {
        // Si hay días de la semana seleccionados
        if (confirmData.variantData.weekDays && confirmData.variantData.weekDays.length > 0) {
            const days = confirmData.variantData.weekDays.join(', ')
            formData.frequencyVariant = `${confirmData.variant} (${days})`
        }
        // Si hay días del mes seleccionados
        else if (confirmData.variantData.monthDays && confirmData.variantData.monthDays.length > 0) {
            const days = confirmData.variantData.monthDays.join(', ')
            formData.frequencyVariant = `${confirmData.variant} (${days})`
        }
        // Si hay contador
        else if (confirmData.variantData.counter && confirmData.variantData.counter > 0) {
            formData.frequencyVariant = `${confirmData.variant} (${confirmData.variantData.counter})`
        }
    }
}

const validateForm = () => {
    // Limpiar todos los errores
    errors.value.habitName = null
    errors.value.habitIcon = null
    errors.value.habitUnit = null
    errors.value.habitWhenWhere = null
    errors.value.habitIdentity = null
    errors.value.goalValue = null
    errors.value.frequencyVariant = null

    // Validación: Nombre del hábito
    if (!formData.habitName || formData.habitName.trim().length === 0) {
        errors.value.habitName = 'El nombre del hábito es obligatorio'
        return false
    }

    if (formData.habitName.trim().length < 3) {
        errors.value.habitName = 'El nombre debe tener al menos 3 caracteres'
        return false
    }

    if (formData.habitName.trim().length > 50) {
        errors.value.habitName = 'El nombre no puede exceder 50 caracteres'
        return false
    }

    // Validación: Icono
    if (!formData.habitIcon || formData.habitIcon.trim().length === 0) {
        errors.value.habitIcon = 'El icono es obligatorio'
        return false
    }

    // Contar caracteres reales (graphemes) en lugar de unidades UTF-16
    // para soportar emojis complejos como 🏃‍♀️ que pueden tener múltiples componentes
    const iconLength = Array.from(formData.habitIcon.trim()).length
    if (iconLength > 5) {
        errors.value.habitIcon = 'El icono debe ser un carácter o emoji'
        return false
    }

    // Validación: Unidad de medida
    if (!formData.habitUnit || formData.habitUnit.trim().length === 0) {
        errors.value.habitUnit = 'La unidad de medida es obligatoria'
        return false
    }

    if (formData.habitUnit.trim().length > 20) {
        errors.value.habitUnit = 'La unidad de medida no puede exceder 20 caracteres'
        return false
    }

    // Validación: Cuándo y dónde
    if (!formData.habitWhenWhere || formData.habitWhenWhere.trim().length === 0) {
        errors.value.habitWhenWhere = 'Cuándo y dónde es obligatorio'
        return false
    }

    if (formData.habitWhenWhere.trim().length < 5) {
        errors.value.habitWhenWhere = 'Por favor describe cuándo y dónde de forma más detallada'
        return false
    }

    if (formData.habitWhenWhere.trim().length > 200) {
        errors.value.habitWhenWhere = 'Cuándo y dónde no puede exceder 200 caracteres'
        return false
    }

    // Validación: Para convertirme en
    if (!formData.habitIdentity || formData.habitIdentity.trim().length === 0) {
        errors.value.habitIdentity = 'Para convertirme en es obligatorio'
        return false
    }

    if (formData.habitIdentity.trim().length < 5) {
        errors.value.habitIdentity = 'Por favor describe la identidad de forma más detallada'
        return false
    }

    if (formData.habitIdentity.trim().length > 200) {
        errors.value.habitIdentity = 'Para convertirme en no puede exceder 200 caracteres'
        return false
    }

    // Validación: Valor de la meta
    if (formData.goalValue === null || formData.goalValue === undefined || formData.goalValue === '') {
        errors.value.goalValue = 'La meta es obligatoria'
        return false
    }

    if (isNaN(formData.goalValue) || formData.goalValue <= 0) {
        errors.value.goalValue = 'La meta debe ser un número mayor a 0'
        return false
    }

    if (formData.goalValue > 999) {
        errors.value.goalValue = 'La meta no puede ser mayor a 999'
        return false
    }

    // Validación: Variante de frecuencia (si es específica)
    if (formData.frequencyVariant && formData.frequencyVariant.includes('especificos')) {
        const match = formData.frequencyVariant.match(/\(([^)]+)\)/)
        if (!match || !match[1] || match[1].trim().length === 0) {
            errors.value.frequencyVariant = 'Por favor selecciona los días específicos'
            return false
        }
    }

    return true
}

const mapFrequencyOption = () => {
    if (!formData.frequencyVariant) {
        return 'todos'
    }

    const variantLower = formData.frequencyVariant.toLowerCase()

    if (variantLower.includes('todos') || variantLower.includes('toda') || variantLower.includes('todo')) {
        return 'todos'
    }

    if (variantLower.includes('dias especificos de la semana')) {
        return 'dias_especificos_semana'
    }

    if (variantLower.includes('cantidad de dias') && variantLower.includes('semana')) {
        return 'cantidad_dias_semana'
    }

    if (variantLower.includes('dias especificos del mes')) {
        return 'dias_especificos_mes'
    }

    if (variantLower.includes('cantidad de dias') && variantLower.includes('mes')) {
        return 'cantidad_dias_mes'
    }

    return 'todos'
}

const buildFrequencyDetail = () => {
    const detail = {
        variant: formData.frequencyVariant
    }

    if (formData.frequencyVariantData.weekDays && formData.frequencyVariantData.weekDays.length > 0) {
        detail.weekDays = formData.frequencyVariantData.weekDays
    }

    if (formData.frequencyVariantData.monthDays && formData.frequencyVariantData.monthDays.length > 0) {
        detail.monthDays = formData.frequencyVariantData.monthDays
    }

    if (formData.frequencyVariantData.counter && formData.frequencyVariantData.counter > 0) {
        detail.counter = formData.frequencyVariantData.counter
    }

    return Object.keys(detail).length > 1 ? detail : null
}

const handleSubmit = async () => {
    if (!validateForm()) {
        return
    }

    isLoading.value = true

    try {
        const habitData = {
            name: formData.habitName.trim(),
            icon: formData.habitIcon || '📝',
            unit: formData.habitUnit || 'veces',
            when_where: formData.habitWhenWhere || null,
            identity: formData.habitIdentity || null,
            goal_value: formData.goalValue || 1,
            frequency_type: formData.frequencyType,
            frequency_option: mapFrequencyOption(),
            frequency_detail: buildFrequencyDetail(),
            reminder_enabled: formData.reminderEnabled
        }

        let result
        if (props.isEditing && props.initialData?.id) {
            result = await updateHabitDB(props.initialData.id, habitData)
            if (result) {
                success('¡Hábito actualizado exitosamente!')
                emit('success', result)
            }
        } else {
            result = await createHabitDB(habitData)
            if (result) {
                success('¡Hábito creado exitosamente!')
                emit('success', result)
            }
        }
    } catch (err) {
        const errorMessage = handleSupabaseError(err)
        showError(errorMessage)
        emit('error', err)
        console.error('Error with habit:', err)
    } finally {
        isLoading.value = false
    }
}

// Función para cargar datos del initialData
const loadFormData = (data) => {
    if (data) {
        formData.habitName = data.name || ''
        formData.habitIcon = data.icon || '📝'
        formData.habitUnit = data.unit || 'veces'
        formData.habitWhenWhere = data.when_where || ''
        formData.habitIdentity = data.identity || ''
        formData.goalValue = data.goal_value || 1
        formData.frequencyType = data.frequency_type || 'diario'
        formData.frequencyOption = data.frequency_option || 'todos'
        formData.reminderEnabled = data.reminder_enabled || false

        // Cargar frequency_detail si existe
        if (data.frequency_detail) {
            formData.frequencyVariant = data.frequency_detail.variant || null
            formData.frequencyVariantData = {
                weekDays: data.frequency_detail.weekDays || [],
                monthDays: data.frequency_detail.monthDays || [],
                counter: data.frequency_detail.counter || null
            }
        } else {
            formData.frequencyVariant = null
            formData.frequencyVariantData = {}
        }
    }
}

// Inicializar con datos si existen
onMounted(() => {
    loadFormData(props.initialData)
})

// Watch para cambios en initialData
watch(() => props.initialData, (newData) => {
    loadFormData(newData)
}, { deep: true })
</script>
