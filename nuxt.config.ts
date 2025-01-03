// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY
  },

  compatibilityDate: '2025-01-03'
})