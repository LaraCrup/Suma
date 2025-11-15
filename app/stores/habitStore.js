import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHabitStore = defineStore('habit', () => {
    // Estado para el hábito seleccionado
    const selectedHabit = ref(null)
    const isCustom = ref(false)

    /**
     * Establecer un hábito seleccionado desde la lista predefinida
     */
    const setSelectedHabit = (habit) => {
        selectedHabit.value = {
            name: habit.name,
            icon: habit.icon,
            isFromDefault: true
        }
        isCustom.value = false
    }

    /**
     * Preparar para crear un hábito personalizado
     */
    const setCustomHabit = () => {
        selectedHabit.value = null
        isCustom.value = true
    }

    /**
     * Limpiar la selección
     */
    const clearSelection = () => {
        selectedHabit.value = null
        isCustom.value = false
    }

    return {
        selectedHabit,
        isCustom,
        setSelectedHabit,
        setCustomHabit,
        clearSelection
    }
})