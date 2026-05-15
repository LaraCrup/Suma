import { defineStore } from 'pinia'

export const useXpNotificationStore = defineStore('xpNotification', {
    state: () => ({
        queue: [],
        current: null,
        visible: false,
    }),
    actions: {
        enqueue(xpAmount, actionKey) {
            this.queue.push({ xpAmount, actionKey })
            if (!this.visible) this._processNext()
        },
        _processNext() {
            if (this.queue.length === 0) {
                this.visible = false
                this.current = null
                return
            }
            this.current = this.queue.shift()
            this.visible = true
        },
        dismiss() {
            this.visible = false
            setTimeout(() => this._processNext(), 400)
        },
    },
})
