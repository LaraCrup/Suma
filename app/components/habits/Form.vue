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

        <div class="w-full flex justify-between items-center">
            <FormLabelSecondary>Icono del hábito</FormLabelSecondary>
            <input v-model="formData.habitIcon" type="text" class="w-8 text-xl text-center bg-transparent" placeholder="❇️" maxlength="1" />
        </div>

        <div class="w-full flex flex-col gap-2">
            <div class="w-full flex justify-between items-center">
                <FormLabelSecondary>Frecuencia</FormLabelSecondary>
                <input
                    type="text"
                    class="w-fit text-right text-xs text-dark font-bold bg-transparent cursor-pointer focus-visible:outline-none"
                    :placeholder="formData.frequencyType === 'diario' ? 'Diario' : formData.frequencyType === 'semanal' ? 'Semanal' : 'Mensual'"
                    :value="formData.frequencyType === 'diario' ? 'Diario' : formData.frequencyType === 'semanal' ? 'Semanal' : 'Mensual'"
                    @click="openFrequencyModal"
                    readonly
                />
            </div>
            <div class="w-full flex justify-end items-center">
                <FormLabelSecondary class="sr-only">Frecuencia</FormLabelSecondary>
                <input
                    type="text"
                    class="w-full text-right text-xs text-dark font-bold bg-transparent focus-visible:outline-none"
                    :value="formData.frequencyVariant ? `${formData.frequencyVariant}` : 'Todos los días'"
                    @click="openFrequencyModal"
                    readonly
                />
            </div>
            <FormOptions
                ref="frequencyModal"
                title="Frecuencia"
                :mainOption="'Diario'"
                :secondaryOptions="['Semanal', 'Mensual']"
                :variantOptions="frequencyVariants"
                :previousSelection="getPreviousFrequencySelection()"
                @confirm="handleFrequencySelect"
            ></FormOptions>
            <div class="w-full flex justify-between items-center mt-2">
                <FormLabelSecondary>Meta</FormLabelSecondary>
                <div class="w-fit flex items-center gap-1">
                    <input type="number" class="w-12 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1"
                        placeholder="2" v-model.number="formData.goalValue" />
                    <input type="text" class="w-12 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1"
                        placeholder="km" v-model="formData.habitUnit" />
                    <p class="text-xs text-dark">
                        /{{ formData.frequencyType === 'diario' ? 'diario' : formData.frequencyType === 'semanal' ? 'semanal' : 'mensual' }}
                    </p>
                </div>
            </div>
        </div>
        <div class="w-full bg-green-dark rounded p-1">
            <p class="text-center text-xs text-light">
                {{ formData.habitName ? formData.habitName : 'Hábito' }}: {{ formData.goalValue }} {{ formData.habitUnit }} {{ getFrequencyDescription() }}
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
    habitWhenWhere: null,
    habitIdentity: null
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
            if (formData.frequencyType === 'diario') {
                return `${cantidad} días del mes`
            } else if (formData.frequencyType === 'semanal') {
                return `${cantidad} días a la semana`
            } else {
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
    errors.value.habitName = null
    errors.value.habitWhenWhere = null
    errors.value.habitIdentity = null

    if (!formData.habitName || formData.habitName.trim().length === 0) {
        errors.value.habitName = 'El nombre del hábito es obligatorio'
        return false
    }

    if (formData.habitName.trim().length < 3) {
        errors.value.habitName = 'El nombre debe tener al menos 3 caracteres'
        return false
    }

    if (!formData.habitWhenWhere || formData.habitWhenWhere.trim().length === 0) {
        errors.value.habitWhenWhere = 'Cuándo y dónde es obligatorio'
        return false
    }

    if (!formData.habitIdentity || formData.habitIdentity.trim().length === 0) {
        errors.value.habitIdentity = 'Para convertirme en es obligatorio'
        return false
    }

    return true
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
            frequency_option: formData.frequencyOption,
            frequency_variant: formData.frequencyVariant,
            frequency_variant_data: formData.frequencyVariantData,
            frequency_detail: null,
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
        formData.frequencyVariant = data.frequency_variant || null
        formData.frequencyVariantData = data.frequency_variant_data || {}
        formData.reminderEnabled = data.reminder_enabled || false
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
