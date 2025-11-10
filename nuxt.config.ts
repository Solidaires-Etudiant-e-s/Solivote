// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  nitro: {
    experimental: {
      database: true
    }
  },

  $development: {
    runtimeConfig: {
      db_name: process.env.db_name,
      db_user: process.env.db_user,
      db_pwd: process.env.db_pwd,
    },
    nitro: {
      database: {
        default: {
          connector: 'mysql2',
          options: {
            host: process.env.db_name,
            user: process.env.db_user,
            password: process.env.db_pwd,
            database: 'mydb', //todo
          }
        }
      }
    },
  },

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/test-utils',
    '@nuxt/ui'
  ]
})