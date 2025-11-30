// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    i18n: {
        locales: [
            {code: 'en', file: 'en.json'},
            {code: 'fr', file: 'fr.json'}
        ],
        defaultLocale: 'fr',
    },

    modules: [
        '@nuxt/image',
        '@nuxt/ui',
        '@nuxtjs/i18n',
        '@nuxt/eslint',
        '@vueuse/nuxt',
    ],
    css: ['~/assets/css/main.css'],
})