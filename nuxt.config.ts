export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  srcDir: 'app/',
  runtimeConfig: {
    public: {
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || '',
    },
  },
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
  ],
  app: {
    head: {
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
      htmlAttrs: {
        lang: 'es'
      },
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#157A6E' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
      ]
    }
  },
  supabase: {
    types: false,
    redirectOptions: {
      login: '/iniciar-sesion',
      callback: '/callback',
      exclude: [
        '/iniciar-sesion',
        '/registrarse',
        '/restablecer-contrasena',
        '/restablecer-contrasena-confirmacion',
        '/confirmar-cuenta',
        '/nueva-contrasena',
        '/contrasena-actualizada',
      ]
    },
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.NODE_ENV === 'production'
    },
    clientOptions: {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        autoRefreshToken: true,
        storage: undefined
      }
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Suma — Hábitos que suman',
      short_name: 'Suma',
      description: 'Formá hábitos, ganás XP y vivís mejor cada día.',
      lang: 'es',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: '#157A6E',
      background_color: '#131815',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
      shortcuts: [
        { name: 'Mis hábitos',  short_name: 'Hábitos',    url: '/',            icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Progreso',     short_name: 'Progreso',    url: '/progreso',    icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Comunidades',  short_name: 'Comunidades', url: '/comunidades', icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Novedades',    short_name: 'Novedades',   url: '/novedades',   icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }] },
      ],
    },
    workbox: {
      globPatterns: [
        '_nuxt/**/*.{js,css}',
        '_fonts/**/*.{woff,woff2}',
        'images/**/*.{png,jpg,jpeg,svg,webp}',
        '*.{ico,png}',
      ],
      navigateFallback: null,
      importScripts: ['/sw-push.js'],
      runtimeCaching: [
        {
          urlPattern: ({ url }) =>
            url.hostname.includes('supabase.co') && !url.pathname.startsWith('/auth/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-data',
            networkTimeoutSeconds: 10,
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^\/_fonts\//,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /^\/images\//,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'app-images',
            expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    devOptions: {
      enabled: false,
    },
  },
  fonts: {
    families: [
      { name: 'Montserrat Alternates', provider: 'google' }
    ],
    defaults: {
      weights: [300, 400, 500, 600, 700, 800, 900],
    }
  },
  vite: {
    optimizeDeps: {
      include: ['pinia']
    },
    build: {
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
    },
    server: {
      fs: {
        strict: false
      }
    }
  },
})
