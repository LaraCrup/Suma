/**
 * Plugin para manejar el splash screen
 * Se ejecuta cuando la app inicializa
 */
import { defineNuxtPlugin } from '#app'
import { useRouter } from 'vue-router'
import { useSplashStore } from '~/stores/splashStore'

export default defineNuxtPlugin((nuxtApp) => {
    const splashStore = useSplashStore()
    const router = useRouter()

    nuxtApp.hook('app:mounted', () => {
        setTimeout(() => {
            splashStore.hideSplash()
        }, 2500)
    })

    router.beforeEach(() => {
        splashStore.hideSplash()
        return true
    })
})
