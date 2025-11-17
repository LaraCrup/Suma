<template>
    <DefaultSection class="pb-12">
        <div class="w-full flex items-center">
            <NavigationBackArrow class="absolute text-gray" />
            <HeadingH2 class="text-center">{{ habit?.icon }} {{ habit?.name }}</HeadingH2>
            <div class="w-6"></div>
        </div>
        <div v-if="habit">
            <HabitsForm
                :initialData="habit"
                :isEditing="true"
                @success="handleFormSuccess"
                @error="handleFormError"
                @update="handleFormUpdate"
            />
        </div>
        <div v-else="isLoading" class="mt-8 flex justify-center">
            <Loader />
        </div>
    </DefaultSection>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHabits } from '~/composables/useHabits'

const route = useRoute()
const { getHabitById } = useHabits()

const habit = ref(null)
const isLoading = ref(true)

onMounted(async () => {
    try {
        const habitId = route.params.id
        if (!habitId) {
            throw new Error('ID del h�bito no especificado')
        }

        habit.value = await getHabitById(habitId)

        if (!habit.value) {
            throw new Error('H�bito no encontrado')
        }
    } catch (error) {
        console.error('Error cargando h�bito:', error)
        navigateTo('/mis-habitos')
    } finally {
        isLoading.value = false
    }
})

const handleFormSuccess = (updatedHabit) => {
    navigateTo(`/mis-habitos/${updatedHabit.id}`)
}

const handleFormError = (error) => {
    console.error('Error actualizando h�bito:', error)
}

const handleFormUpdate = (data) => {
    if (habit.value) {
        habit.value.name = data.name
        habit.value.icon = data.icon
    }
}
</script>
