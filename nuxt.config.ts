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
  runtimeConfig: {
    public: {
      // ชื่อตรงนี้ (apiUrl) ต้องตรงกับที่ใช้ใน <script>
      apiUrl: process.env.NUXT_PUBLIC_API_URL 
    }
  },
  modules: ['@nuxtjs/tailwindcss']
})