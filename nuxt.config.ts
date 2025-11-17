// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  srcDir: 'app/',
  css: ['~/assets/css/main.css'],
  modules: [
    '@nuxt/fonts',
    '@nuxt/image',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/supabase',
    '@pinia/nuxt'
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
        { name: 'theme-color', content: '#ffffff' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: 'shared/.svg' }
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
        '/nueva-contrasena'
      ]
    },
    cookieOptions: {
      maxAge: 60 * 60 * 8,
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
  fonts: {
    families: [
      { name: 'Montserrat Alternates', provider: 'google' }
    ],
    defaults: {
      weights: [300, 400, 500, 600, 700, 800, 900],
    }
  },
  // plugins: [
  //   { src: '~/plugins/preload-data.js', mode: 'client' }
  // ],
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