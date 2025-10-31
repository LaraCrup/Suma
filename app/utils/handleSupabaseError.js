const errorMessages = {
    'Invalid login credentials': 'El correo o contraseña no coinciden. Por favor verifica tus datos e intenta nuevamente.',
    'Email not confirmed': 'Tu correo electrónico aún no ha sido verificado. Por favor revisa tu bandeja de entrada y haz click en el enlace de confirmación.',
    'User not found': 'No encontramos una cuenta con esos datos.',
    'Password recovery token is invalid or has expired': 'El enlace de recuperación ha expirado. Por favor solicita uno nuevo.',
    'Rate limit exceeded': 'Has realizado demasiados intentos. Por favor espera unos minutos antes de intentar nuevamente.',
    'Email already taken': 'Este correo ya está registrado.',
    'User already registered': 'Este correo ya está registrado.',
    'Username taken': 'Este nombre de usuario ya está en uso. Por favor elige otro.',
    'Weak password': 'Tu contraseña debe ser más segura. Incluye al menos 8 caracteres, números y símbolos.',
    'Password should contain at least one uppercase letter, one lowercase letter, one digit, and one special character': 'Tu contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial.',
    'Insufficient permissions': 'No tienes permisos para realizar esta acción. Contacta al administrador si crees que es un error.',
    'Invalid API key': 'Error de configuración del sistema. Por favor contacta al equipo de soporte.',
    'JWT expired': 'Tu sesión ha expirado por inactividad. Por favor inicia sesión nuevamente.',
    'JWT invalid': 'Ha ocurrido un problema con tu sesión. Por favor inicia sesión nuevamente.',
    'Row not found': 'No pudimos encontrar la información solicitada. Puede haber sido modificada o eliminada.',
    'Foreign key violation': 'No se puede realizar esta acción porque hay información relacionada. Intenta primero con otros elementos.',
    'Unique constraint violation': 'Ya existe información con estos datos. Por favor utiliza valores únicos.',
    'Value too long for type': 'Uno de los campos contiene demasiados caracteres. Por favor acorta tu texto.',
    'New password should be different from the old password.': 'La nueva contraseña debe ser diferente a la anterior.',
    'Invalid email': 'El formato del correo electrónico no es válido.',
    'Unable to validate email address: invalid format': 'El formato del correo electrónico no es válido.',
    'Database error saving new user': 'Este correo electrónico ya está registrado. Por favor inicia sesión o usa otro correo.',
}

export function handleSupabaseError(error) {
    const errorMessage = error?.message || error?.error_description || 'Error desconocido';

    const rateLimitMatch = errorMessage.match(/For security purposes, you can only request this after (\d+) seconds?/);
    if (rateLimitMatch) {
        const seconds = rateLimitMatch[1];
        return `Por seguridad, debes esperar ${seconds} segundos antes de intentar nuevamente.`;
    }

    return errorMessages[errorMessage] || `Error: ${errorMessage}`;
}
