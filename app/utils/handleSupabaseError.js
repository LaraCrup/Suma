const errorMessages = {
    'Invalid login credentials': 'El usuario o la contraseña no coinciden. Revisá tus datos e intentá de nuevo.',
    'Email not confirmed': 'Tu correo electrónico todavía no fue verificado. Revisá tu bandeja de entrada y tocá el enlace de confirmación.',
    'User not found': 'No encontramos una cuenta con esos datos.',
    'Password recovery token is invalid or has expired': 'El enlace de recuperación expiró. Pedí uno nuevo.',
    'Rate limit exceeded': 'Hiciste demasiados intentos. Esperá unos minutos antes de volver a probar.',
    'Email already taken': 'Este correo ya está registrado.',
    'User already registered': 'Este correo ya está registrado.',
    'Username taken': 'Este nombre de usuario ya está en uso. Elegí otro.',
    'Weak password': 'Tu contraseña tiene que ser más segura. Usá al menos 8 caracteres, números y símbolos.',
    'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character': 'Tu contraseña tiene que tener al menos una mayúscula, una minúscula, un número y un carácter especial.',
    'Insufficient permissions': 'No tenés permisos para hacer esta acción.',
    'Invalid API key': 'Hubo un problema de configuración. Volvé a intentar en unos minutos.',
    'JWT expired': 'Tu sesión expiró por inactividad. Iniciá sesión de nuevo.',
    'JWT invalid': 'Hubo un problema con tu sesión. Iniciá sesión de nuevo.',
    'Row not found': 'No pudimos encontrar esa información. Puede haber sido modificada o eliminada.',
    'Foreign key violation': 'No se puede hacer esta acción porque hay información relacionada.',
    'Unique constraint violation': 'Ya existe información con estos datos. Probá con otros valores.',
    'Value too long for type': 'Uno de los campos tiene demasiados caracteres. Acortá el texto.',
    'New password should be different from the old password.': 'La nueva contraseña tiene que ser distinta a la anterior.',
    'Invalid email': 'El formato del correo electrónico no es válido.',
    'Unable to validate email address: invalid format': 'El formato del correo electrónico no es válido.',
    'Database error saving new user': 'Este correo electrónico ya está registrado. Iniciá sesión o usá otro correo.',
}

const GENERIC_ERROR = 'Algo salió mal. Volvé a intentar en unos minutos.'

export function handleSupabaseError(error) {
    const errorMessage = error?.message || error?.error_description || ''

    const rateLimitMatch = errorMessage.match(/For security purposes, you can only request this after (\d+) seconds?/)
    if (rateLimitMatch) {
        return `Por seguridad, esperá ${rateLimitMatch[1]} segundos antes de volver a intentar.`
    }

    if (errorMessages[errorMessage]) return errorMessages[errorMessage]

    if (errorMessage) console.error('[SUPABASE]', errorMessage)

    return GENERIC_ERROR
}
