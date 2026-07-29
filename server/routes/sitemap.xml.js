const PUBLIC_ROUTES = [
    { path: '/iniciar-sesion', changefreq: 'monthly', priority: '1.0' },
    { path: '/registrarse', changefreq: 'monthly', priority: '0.9' },
]

export default defineEventHandler((event) => {
    const { origin } = getRequestURL(event)
    const lastmod = new Date().toISOString().split('T')[0]

    const urls = PUBLIC_ROUTES.map(({ path, changefreq, priority }) => [
        '  <url>',
        `    <loc>${origin}${path}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
    ].join('\n')).join('\n')

    const body = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        urls,
        '</urlset>',
        '',
    ].join('\n')

    setHeader(event, 'content-type', 'application/xml; charset=utf-8')
    setHeader(event, 'cache-control', 'public, max-age=3600')

    return body
})
