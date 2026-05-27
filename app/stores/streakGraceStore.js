import { defineStore } from 'pinia'

export const useStreakGraceStore = defineStore('streakGrace', {
    state: () => ({
        visible: false,
        missedHabits: [],            // [{ habitId, habitName, streak, graceAvailable }]
        navigateToYesterday: false,  // index.vue lo observa para cambiar la fecha seleccionada
    }),
    actions: {
        add(habitId, habitName, streak, graceAvailable) {
            this.missedHabits.push({ habitId, habitName, streak, graceAvailable })
        },
        show() {
            if (this.missedHabits.length > 0) this.visible = true
        },
        dismiss() {
            this.visible = false
            this.missedHabits = []
        },
        triggerNavigateToYesterday() {
            this.navigateToYesterday = true
            this.dismiss()
        },
        clearNavigateToYesterday() {
            this.navigateToYesterday = false
        },
    },
})
