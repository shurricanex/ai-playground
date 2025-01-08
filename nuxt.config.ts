// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    // Google Cloud configuration
    googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    googleProjectId: process.env.GOOGLE_PROJECT_ID,
    googleLocation: process.env.GOOGLE_LOCATION
  },
  compatibilityDate: '2025-01-03'
})
