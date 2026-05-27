import { defineStore } from 'pinia'

let batchTimer = null

export const useXpNotificationStore = defineStore('xpNotification', {
    state: () => ({
        queue: [],
        current: null,
        visible: false,
        _pendingXP: 0,
        _pendingKeys: [],
    }),
    actions: {
        enqueue(xpAmount, actionKey) {
            this._pendingXP += xpAmount
            this._pendingKeys.push(actionKey)
            clearTimeout(batchTimer)
            batchTimer = setTimeout(() => this._flushBatch(), 1500)
        },
        _flushBatch() {
            if (this._pendingKeys.length === 0) return
            const xpAmount = this._pendingXP
            const actionKeys = [...this._pendingKeys]
            this._pendingXP = 0
            this._pendingKeys = []
            batchTimer = null
            this.queue.push({ type: 'xp', xpAmount, actionKeys })
            if (!this.visible) this._processNext()
        },
        enqueueLevelUp(level) {
            this.queue.push({ type: 'level_up', level })
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
