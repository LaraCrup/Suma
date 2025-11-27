import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useHabitStore = defineStore('habit', () => {
    const selectedHabit = ref(null)
    const isCustom = ref(false)

    const setSelectedHabit = (habit) => {
        selectedHabit.value = {
            name: habit.name,
            icon: habit.icon,
            isFromDefault: true
        }
        isCustom.value = false
    }

    const setCustomHabit = () => {
        selectedHabit.value = null
        isCustom.value = true
    }

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