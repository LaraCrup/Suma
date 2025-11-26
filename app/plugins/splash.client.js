/**
 * Plugin para manejar el splash screen
 * Se ejecuta cuando la app inicializa
 */
import { useRouter } from 'vue-router'

export default defineNuxtPlugin((nuxtApp) => {
    const splashStore = useSplashStore()
    const router = useRouter()

    // Esperar a que Nuxt esté completamente listo
    nuxtApp.hook('app:mounted', () => {
        // Ocultar el splash screen después de 2.5 segundos
        // Esto es un tiempo mínimo de visualización para dar tiempo a que carguen los datos
        setTimeout(() => {
            splashStore.hideSplash()
        }, 2500)
    })

    // Opcionalmente, ocultar el splash cuando el usuario navegue
    router.beforeEach(() => {
        // Asegurarse de que el splash esté oculto cuando navegamos
        splashStore.hideSplash()
        return true
    })
})
