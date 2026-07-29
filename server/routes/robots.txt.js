const DISALLOWED = [
    '/mis-habitos',
    '/progreso',
    '/comunidades',
    '/novedades',
    '/amigos',
    '/usuarios',
    '/mi-perfil',
    '/confirmar-cuenta',
    '/nueva-contrasena',
    '/restablecer-contrasena',
    '/restablecer-contrasena-confirmacion',
    '/contrasena-actualizada',
    '/callback',
]

export default defineEventHandler((event) => {
    const { origin } = getRequestURL(event)

    const body = [
        'User-agent: *',
        ...DISALLOWED.map((path) => `Disallow: ${path}`),
        '',
        `Sitemap: ${origin}/sitemap.xml`,
        '',
    ].join('\n')

    setHeader(event, 'content-type', 'text/plain; charset=utf-8')
    setHeader(event, 'cache-control', 'public, max-age=3600')

    return body
})
