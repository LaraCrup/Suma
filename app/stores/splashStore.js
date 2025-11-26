import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSplashStore = defineStore('splash', () => {
    const isVisible = ref(true)

    /**
     * Ocultar el splash screen
     */
    const hideSplash = () => {
        isVisible.value = false
    }

    /**
     * Mostrar el splash screen
     */
    const showSplash = () => {
        isVisible.value = true
    }

    return {
        isVisible,
        hideSplash,
        showSplash
    }
})
