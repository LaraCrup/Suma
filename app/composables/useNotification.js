/**
 * Composable para mostrar notificaciones al usuario
 */
export const useNotification = () => {
    const success = (message, options = {}) => {
        const title = options.title || 'Éxito'

        console.log(`[${title}]: ${message}`)

        return true
    }

    const error = (message, options = {}) => {
        const title = options.title || 'Error'
        console.error(`[${title}]: ${message}`)
        return true
    }

    const info = (message, options = {}) => {
        const title = options.title || 'Información'
        console.info(`[${title}]: ${message}`)
        return true
    }

    const warning = (message, options = {}) => {
        const title = options.title || 'Advertencia'
        console.warn(`[${title}]: ${message}`)
        return true
    }

    return {
        success,
        error,
        info,
        warning
    }
}
