export const SITE_NAME = 'Suma'
export const SITE_TAGLINE = 'Hábitos que suman'
export const SITE_DESCRIPTION = 'Formá hábitos que duran: seguí tu progreso día a día, ganá XP y niveles, sumate a comunidades con hábitos compartidos y descubrí beneficios de marcas aliadas.'
export const SITE_IMAGE = '/og-suma.jpg'

export const useSeoTags = (options = {}) => {
    const url = useRequestURL()
    const resolve = (value) => (typeof value === 'function' ? value() : unref(value))

    const title = computed(() => {
        const raw = resolve(options.title)
        return raw ? `${raw} · ${SITE_NAME}` : `${SITE_NAME} — ${SITE_TAGLINE}`
    })

    const description = computed(() => resolve(options.description) || SITE_DESCRIPTION)
    const image = computed(() => new URL(resolve(options.image) || SITE_IMAGE, url.origin).href)
    const imageAlt = computed(() => resolve(options.imageAlt) || `${SITE_NAME} — ${SITE_TAGLINE}`)

    const canonical = `${url.origin}${url.pathname}`
    const robots = options.indexable === true
        ? 'index, follow, max-image-preview:large, max-snippet:-1'
        : 'noindex, nofollow'

    useHead({
        link: [{ rel: 'canonical', href: canonical }],
    })

    useSeoMeta({
        title,
        description,
        robots,
        ogTitle: title,
        ogDescription: description,
        ogImage: image,
        ogImageAlt: imageAlt,
        ogUrl: canonical,
        ogType: options.type || 'website',
        ogSiteName: SITE_NAME,
        ogLocale: 'es_AR',
        twitterCard: 'summary_large_image',
        twitterTitle: title,
        twitterDescription: description,
        twitterImage: image,
        twitterImageAlt: imageAlt,
    })
}
