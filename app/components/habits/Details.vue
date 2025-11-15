<template>
    <DefaultSection>
        <div class="relative w-full flex items-center">
            <NavigationBackArrow class="absolute text-gray" @click="goBack" />
            <HeadingH2 class="text-center">{{ displayIcon }} {{ initialData?.name || 'Nuevo hábito' }}</HeadingH2>
        </div>

        <HabitsForm
            :initialData="initialData"
            :isEditing="isEditing"
            @success="handleFormSuccess"
            @error="handleFormError"
        ></HabitsForm>
    </DefaultSection>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useHabitStore } from '~/stores/habitStore'

// Store
const habitStore = useHabitStore()

// Estado
const initialData = ref(null)
const isEditing = ref(false)

// Computed
const displayIcon = computed(() => initialData.value?.icon || '📝')

// Métodos
const goBack = () => {
    habitStore.clearSelection()
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

const handleFormSuccess = () => {
    habitStore.clearSelection()

    // Redirigir a la página de hábitos después de 1.5 segundos
    setTimeout(() => {
        navigateTo('/mis-habitos')
    }, 1500)
}

const handleFormError = (err) => {
    console.error('Error with habit:', err)
}

// Inicializar con datos del store si existen
onMounted(() => {
    if (habitStore.selectedHabit) {
        // Convertir el formato del store al formato esperado por el formulario
        initialData.value = {
            name: habitStore.selectedHabit.name,
            icon: habitStore.selectedHabit.icon,
            unit: 'veces',
            when_where: '',
            identity: '',
            goal_value: 1,
            frequency_type: 'diario',
            frequency_option: 'todos',
            frequency_variant: null,
            frequency_variant_data: {},
            reminder_enabled: false
        }
        isEditing.value = false
    } else {
        // Para hábito personalizado, inicializar con valores vacíos
        initialData.value = {
            name: '',
            icon: '📝',
            unit: 'veces',
            when_where: '',
            identity: '',
            goal_value: 1,
            frequency_type: 'diario',
            frequency_option: 'todos',
            frequency_variant: null,
            frequency_variant_data: {},
            reminder_enabled: false
        }
    }
})
</script>