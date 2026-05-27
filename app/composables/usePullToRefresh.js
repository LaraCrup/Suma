import { ref } from 'vue'

// Estado singleton a nivel de módulo — compartido entre DefaultMain y la página activa
const isRefreshing = ref(false)
let _callback = null

export const usePullToRefresh = () => {
    /**
     * Cada página registra su función de recarga.
     * Al navegar, la nueva página sobreescribe el callback anterior.
     */
    const registerRefresh = (fn) => {
        _callback = fn
    }

    /**
     * DefaultMain llama a esta función cuando se completa el gesto.
     * Evita llamadas simultáneas con el guard de isRefreshing.
     */
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
