// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  ssr: false, 
    // เพิ่มการตั้งค่านี้เพื่อบอกให้ Nuxt รู้ว่าทุกหน้าจะถูกจัดการโดยไฟล์ index.html ไฟล์เดียว
  router: {
    options: {
      hashMode: false, // ใช้ URL สวยงาม (ไม่ใช่ /#/start-order)
    }
  },
  modules: ['@nuxtjs/tailwindcss']
})