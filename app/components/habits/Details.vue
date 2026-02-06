<template>
    <DefaultSection>
        <div class="relative w-full flex items-center">
            <NavigationBackArrow :url="ROUTE_NAMES.HABITS_CREATE" class="absolute text-gray" @click="goBack" />
            <HeadingH2 class="text-center">{{ currentIcon }} {{ currentName || 'Nuevo hábito' }}</HeadingH2>
        </div>

        <HabitsForm
            :initialData="initialData"
            :isEditing="isEditing"
            @success="handleFormSuccess"
            @error="handleFormError"
            @update="handleFormUpdate"
        ></HabitsForm>
    </DefaultSection>
</template>

<script setup>
import { ROUTE_NAMES } from '~/constants/ROUTE_NAMES'
import { ref, onMounted } from 'vue'
import { useHabitStore } from '~/stores/habitStore'

const habitStore = useHabitStore()

const initialData = ref(null)
const isEditing = ref(false)

const currentName = ref('')
const currentIcon = ref('📝')

const goBack = () => {
    habitStore.clearSelection()
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
}

const handleFormSuccess = () => {
    habitStore.clearSelection()
    navigateTo('/')
}

const handleFormError = (err) => {
    console.error('Error with habit:', err)
}

const handleFormUpdate = (data) => {
    currentName.value = data.name
    currentIcon.value = data.icon || '📝'
}

onMounted(() => {
    if (habitStore.selectedHabit) {
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
        currentName.value = habitStore.selectedHabit.name
        currentIcon.value = habitStore.selectedHabit.icon
        isEditing.value = false
    } else {
        initialData.value = {
            name: '',
            icon: '',
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