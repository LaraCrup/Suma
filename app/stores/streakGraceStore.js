import { defineStore } from 'pinia'

export const useStreakGraceStore = defineStore('streakGrace', {
    state: () => ({
        queue: [],
        current: null,
        visible: false,
    }),
    actions: {
        enqueue(habitId, habitName, streak) {
            this.queue.push({ habitId, habitName, streak })
            if (!this.visible) this._processNext()
        },
        _processNext() {
            if (this.queue.length === 0) {
                this.current = null
                this.visible = false
                return
            }
            this.current = this.queue.shift()
            this.visible = true
        },
        dismiss() {
            this.visible = false
            setTimeout(() => this._processNext(), 300)
        },
    },
})
