import { ref } from 'vue'

const isRefreshing = ref(false)
let _callback = null

export const usePullToRefresh = () => {
    const registerRefresh = (fn) => {
        _callback = fn
    }

    const triggerRefresh = async () => {
        if (isRefreshing.value || !_callback) return
        isRefreshing.value = true
        try {
            await _callback()
        } finally {
            isRefreshing.value = false
        }
    }

    return { isRefreshing, registerRefresh, triggerRefresh }
}
