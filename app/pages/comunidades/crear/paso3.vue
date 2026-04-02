<template>
    <DefaultSection>
        <div class="w-full flex items-center gap-3">
            <NavigationBackArrow class="!w-fit" color="text-gray" />
            <HeadingH1>Nueva comunidad</HeadingH1>
        </div>

        <!-- Step indicator (paso 3) -->
        <div class="w-full flex flex-col gap-1">
            <div class="w-full h-2 bg-green-dark rounded-full overflow-hidden">
                <div class="h-full bg-gradient-secondary rounded-full" style="width: 95%" />
            </div>
            <div class="w-full flex justify-between items-center">
                <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-dark-green.svg" class="w-3 h-3" />
                </div>
                <div class="flex gap-0.5">
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                    <NuxtImg src="/images/brillo-primary.svg" class="w-3 h-3" />
                </div>
            </div>
        </div>

        <!-- Habit form -->
        <form @submit.prevent="handleSubmit" class="w-full flex flex-col items-center gap-5">
            <div class="w-full flex flex-col gap-4">
                <FormTextFieldSecondary
                    v-model="formData.habitName"
                    id="community-habit-name"
                    label="Vamos a"
                    hint="¿Qué hábito quieren formar? Que sea específico."
                    placeholder="Nombre del hábito"
                    :error="errors.habitName"
                    required
                />
                <FormTextFieldSecondary
                    v-model="formData.habitIdentity"
                    id="community-habit-identity"
                    label="Para convertirnos en"
                    hint="La meta no es correr una maratón, la meta es convertirte en corredor."
                    placeholder="Quienes quieren ser"
                    :error="errors.habitIdentity"
                    required
                />
            </div>

            <!-- Icono -->
            <div class="w-full flex flex-col gap-1">
                <div class="w-full flex justify-between items-center">
                    <FormLabelSecondary for="community-habit-icon">Icono</FormLabelSecondary>
                    <input
                        id="community-habit-icon"
                        v-model="formData.habitIcon"
                        type="text"
                        class="w-12 h-12 text-xl text-center bg-transparent outline-none border border-gray rounded-full p-2"
                        placeholder=""
                        maxlength="10"
                        inputmode="text"
                        @input="validateEmojiInput"
                    />
                </div>
                <FormError v-if="errors.habitIcon">{{ errors.habitIcon }}</FormError>
            </div>

            <!-- Frecuencia -->
            <div class="w-full flex flex-col gap-1">
                <FormLabelSecondary>Frecuencia</FormLabelSecondary>
                <button
                    type="button"
                    class="w-full text-right text-xs text-dark font-bold bg-transparent border-b border-gray outline-none pb-1 cursor-pointer hover:opacity-70 transition-opacity"
                    @click="frequencyModal?.openModal()"
                >
                    <div class="flex justify-between gap-3">
                        <span class="text-xs">
                            {{ formData.frequencyType === 'diario' ? 'Diario' : formData.frequencyType === 'semanal' ? 'Semanal' : 'Mensual' }}
                        </span>
                        <span class="text-xs">
                            {{ formData.frequencyVariant ?? 'Todos los días' }}
                        </span>
                    </div>
                </button>
                <FormOptions
                    ref="frequencyModal"
                    title="Frecuencia"
                    :mainOption="'Diario'"
                    :secondaryOptions="['Semanal', 'Mensual']"
                    :variantOptions="frequencyVariants"
                    :previousSelection="getPreviousFrequencySelection()"
                    @confirm="handleFrequencySelect"
                />
                <FormError v-if="errors.frequencyVariant">{{ errors.frequencyVariant }}</FormError>
            </div>

            <!-- Meta -->
            <fieldset class="w-full flex flex-col gap-1 border-none p-0">
                <div class="w-full flex items-center justify-between">
                    <FormLabelSecondary>Meta</FormLabelSecondary>
                    <div class="flex items-center gap-1">
                        <input
                            v-model.number="formData.goalValue"
                            type="number"
                            class="w-12 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1 border border-transparent outline-none"
                            placeholder="2" min="1" max="9999" step="1"
                        />
                        <input
                            v-model="formData.habitUnit"
                            type="text"
                            class="w-16 text-center text-xs text-dark font-bold bg-accent rounded-lg p-1 border border-transparent outline-none"
                            placeholder="km" maxlength="20"
                        />
                        <p class="text-xs text-dark font-semibold ml-1">
                            /{{ formData.frequencyType === 'diario' ? 'día' : formData.frequencyType === 'semanal' ? 'semana' : 'mes' }}
                        </p>
                    </div>
                </div>
                <FormError v-if="errors.goalValue">{{ errors.goalValue }}</FormError>
                <FormError v-if="errors.habitUnit">{{ errors.habitUnit }}</FormError>
            </fieldset>

            <!-- Preview -->
            <div class="w-full bg-green-dark rounded p-1">
                <p class="text-center text-xs text-light">
                    {{ formData.habitName || 'Hábito' }}: {{ formData.goalValue }} {{ formData.habitUnit }} {{ getFrequencyDescription() }}
                </p>
            </div>

            <ButtonPrimary type="submit" :disabled="isLoading">
                {{ isLoading ? 'Creando...' : 'Crear comunidad' }}
            </ButtonPrimary>
        </form>
    </DefaultSection>
</template>

<script setup>
const route = useRoute()

const frequencyModal = ref(null)
const isLoading = ref(false)

const formData = reactive({
    habitName: '',
    habitIcon: '',
    habitUnit: 'veces',
    habitIdentity: '',
    goalValue: 1,
    frequencyType: 'diario',
    frequencyVariant: null,
    frequencyVariantData: {}
})

const errors = ref({
    habitName: null,
    habitIcon: null,
    habitUnit: null,
    habitIdentity: null,
    goalValue: null,
    frequencyVariant: null
})

const frequencyVariants = {
    'Diario': ['Todos los días', 'Dias especificos de la semana', 'Cantidad de dias de la semana', 'Dias especificos del mes', 'Cantidad de dias del mes'],
    'Semanal': ['Toda la semana', 'Dias especificos de la semana'],
    'Mensual': ['Todo el mes', 'Dias especificos del mes']
}

const validateEmojiInput = () => {
    formData.habitIcon = [...formData.habitIcon]
        .filter(char => /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u.test(char))
        .join('')
}

const getPreviousFrequencySelection = () => {
    if (!formData.frequencyVariant) return null
    return {
        mainOption: formData.frequencyType === 'diario' ? 'Diario' : formData.frequencyType === 'semanal' ? 'Semanal' : 'Mensual',
        variant: formData.frequencyVariant.includes('(') ? formData.frequencyVariant.split('(')[0].trim() : formData.frequencyVariant,
        variantData: formData.frequencyVariantData
    }
}

const getFrequencyDescription = () => {
    if (!formData.frequencyVariant) {
        return { diario: 'cada día', semanal: 'cada semana', mensual: 'cada mes' }[formData.frequencyType] ?? 'cada día'
    }
    if (/Todos|Toda|Todo/.test(formData.frequencyVariant)) {
        return { diario: 'cada día', semanal: 'cada semana', mensual: 'cada mes' }[formData.frequencyType] ?? 'cada día'
    }
    const match = formData.frequencyVariant.match(/\(([^)]+)\)/)
    if (formData.frequencyVariant.includes('especificos de la semana') && match) return `los días: ${match[1]}`
    if (formData.frequencyVariant.includes('especificos del mes') && match) return `los días del mes: ${match[1]}`
    if (formData.frequencyVariant.includes('Cantidad de') && match) {
        return formData.frequencyVariant.includes('semana') ? `${match[1]} días a la semana` : `${match[1]} días del mes`
    }
    return { diario: 'cada día', semanal: 'cada semana', mensual: 'cada mes' }[formData.frequencyType] ?? 'cada día'
}

const handleFrequencySelect = (confirmData) => {
    formData.frequencyType = { 'Diario': 'diario', 'Semanal': 'semanal', 'Mensual': 'mensual' }[confirmData.mainOption] ?? 'diario'
    formData.frequencyVariant = confirmData.variant ?? null
    formData.frequencyVariantData = confirmData.variantData ?? {}
    if (confirmData.variant) {
        const { weekDays, monthDays, counter } = confirmData.variantData ?? {}
        if (weekDays?.length) formData.frequencyVariant = `${confirmData.variant} (${weekDays.join(', ')})`
        else if (monthDays?.length) formData.frequencyVariant = `${confirmData.variant} (${monthDays.join(', ')})`
        else if (counter) formData.frequencyVariant = `${confirmData.variant} (${counter})`
    }
}

const validateForm = () => {
    Object.keys(errors.value).forEach(k => errors.value[k] = null)
    if (!formData.habitName?.trim() || formData.habitName.trim().length < 3) {
        errors.value.habitName = 'El nombre del hábito es obligatorio (mínimo 3 caracteres)'
        return false
    }
    if (!formData.habitIcon?.trim()) {
        errors.value.habitIcon = 'El icono es obligatorio'
        return false
    }
    if (!formData.habitIdentity?.trim() || formData.habitIdentity.trim().length < 5) {
        errors.value.habitIdentity = 'Por favor describí la identidad de forma más detallada'
        return false
    }
    if (!formData.habitUnit?.trim()) {
        errors.value.habitUnit = 'La unidad de medida es obligatoria'
        return false
    }
    if (!formData.goalValue || formData.goalValue <= 0) {
        errors.value.goalValue = 'La meta debe ser un número mayor a 0'
        return false
    }
    return true
}

const handleSubmit = async () => {
    if (!validateForm()) return
    isLoading.value = true
    try {
        // TODO: crear comunidad con los datos del formulario y los miembros del paso anterior
        // const memberIds = route.query.members?.split(',').filter(Boolean) ?? []
        navigateTo('/comunidades')
    } finally {
        isLoading.value = false
    }
}
</script>
