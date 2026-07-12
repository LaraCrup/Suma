import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSplashStore = defineStore('splash', () => {
    const isVisible = ref(true)

    const hideSplash = () => {
        isVisible.value = false
    }

    const showSplash = () => {
        isVisible.value = true
    }

    return {
        isVisible,
        hideSplash,
        showSplash
    }
})
