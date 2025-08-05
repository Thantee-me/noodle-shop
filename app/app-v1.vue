<script setup>
import { ref, computed } from 'vue'

// --- ข้อมูลหลักของเมนู ---
const prices = [
  { size: 'พิเศษ', price: 60 },
  { size: 'ธรรมดา', price: 50 },
]
const noodleTypes = ['เส้นเล็ก', 'เส้นใหญ่', 'เส้นหมี่', 'บะหมี่', 'วุ้นเส้น', 'เกาเหลา']
const extraOptions = ['ไม่ผัก', 'ไม่เผ็ด', 'ไม่งอก', 'ไม่ชิ้น', 'ไม่ตับ', 'ลูกชิ้น']

// --- State สำหรับจัดการการเลือกในปัจจุบัน ---
// ref() ใช้สำหรับเก็บค่าที่เปลี่ยนแปลงได้ในหน้าจอ
const selectedPriceInfo = ref(null) // เก็บทั้งขนาดและราคาที่เลือก

// --- State หลักสำหรับเก็บรายการสั่งซื้อทั้งหมด (ใช้ useState เพื่อให้แชร์ข้าม component ได้ในอนาคต) ---
const order = useState('order', () => [])

// --- Computed Properties (ค่าที่คำนวณจาก State อื่นๆ) ---
// ตรวจสอบว่าผู้ใช้เลือกราคาแล้วหรือยัง
const isPriceSelected = computed(() => !!selectedPriceInfo.value)

// คำนวณราคารวมของทุกรายการในตะกร้า
const totalPrice = computed(() => {
  return order.value.reduce((sum, item) => sum + item.price, 0)
})

// --- Functions (การกระทำต่างๆ) ---

// ฟังก์ชันเมื่อผู้ใช้เลือกขนาดชาม (ราคา)
function selectPrice(priceInfo) {
  selectedPriceInfo.value = priceInfo
}

// ฟังก์ชันเมื่อผู้ใช้เลือกเส้น
function selectNoodle(noodle) {
  // ต้องเลือกขนาดชามก่อน ถึงจะเลือกเส้นได้
  if (!isPriceSelected.value) {
    alert('กรุณาเลือกขนาดชามก่อนครับ')
    return
  }

  // เพิ่มรายการใหม่ลงในตะกร้า
  order.value.push({
    id: Date.now(), // ใช้เวลาเป็น ID เฉพาะของรายการ
    name: noodle,
    size: selectedPriceInfo.value.size,
    price: selectedPriceInfo.value.price,
    options: [], // เตรียมไว้สำหรับใส่หมายเหตุ
  })

  // เคลียร์การเลือกราคา เพื่อให้พร้อมสำหรับชามถัดไป
  selectedPriceInfo.value = null
}

// ฟังก์ชันเมื่อผู้ใช้เลือกหมายเหตุ
function toggleOption(option) {
  // ต้องมีรายการในตะกร้าอย่างน้อย 1 รายการ
  if (order.value.length === 0) {
    alert('กรุณาเลือกเส้นเพื่อสร้างรายการก่อนครับ')
    return
  }
  
  // แก้ไขรายการล่าสุดในตะกร้า
  const lastItem = order.value[order.value.length - 1]
  const optionIndex = lastItem.options.indexOf(option)

  if (optionIndex > -1) {
    // ถ้ามีหมายเหตุนี้อยู่แล้ว -> ให้เอาออก
    lastItem.options.splice(optionIndex, 1)
  } else {
    // ถ้ายังไม่มี -> ให้เพิ่มเข้าไป
    lastItem.options.push(option)
  }
}

// ฟังก์ชันลบรายการออกจากตะกร้า
function removeItem(itemId) {
  order.value = order.value.filter(item => item.id !== itemId)
}

// ฟังก์ชันสำหรับจัดรูปแบบการแสดงผลของหมายเหตุ
function formatOptions(options) {
  if (!options || options.length === 0) return ''
  return `( ${options.join(', ')} )`
}
</script>

<template>
  <main class="bg-slate-100 min-h-screen font-sans text-slate-800">
    <div class="container mx-auto p-4 md:p-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div class="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
          <header class="text-center mb-8">
            <h1 class="text-4xl font-bold text-slate-700">โต๊ะ 5</h1>
            <p class="text-slate-500 mt-1">กรุณาเลือกรายการอาหาร</p>
          </header>

          <section class="mb-8">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">1. เลือกขนาดชาม</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <button
                v-for="p in prices"
                :key="p.price"
                @click="selectPrice(p)"
                :class="[
                  'p-4 rounded-lg border-2 transition-all duration-200 text-center',
                  selectedPriceInfo?.price === p.price
                    ? 'bg-red-500 border-red-500 text-white shadow-lg scale-105'
                    : 'bg-white hover:border-red-400 hover:bg-red-50'
                ]"
              >
                <span class="block text-lg font-bold">{{ p.size }}</span>
                <span class="block text-sm">{{ p.price }} บาท</span>
              </button>
            </div>
          </section>

          <section
            class="mb-8 transition-opacity duration-300"
            :class="{ 'opacity-40 pointer-events-none': !isPriceSelected }"
          >
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">2. เลือกเส้น (เพิ่มลงรายการ)</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                v-for="noodle in noodleTypes"
                :key="noodle"
                @click="selectNoodle(noodle)"
                class="p-4 rounded-lg border bg-slate-50 hover:border-red-500 hover:bg-red-100 hover:shadow-md transition-all disabled:opacity-50"
                :disabled="!isPriceSelected"
              >
                {{ noodle }}
              </button>
            </div>
          </section>

          <section>
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">3. เพิ่มหมายเหตุ</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button
                v-for="option in extraOptions"
                :key="option"
                @click="toggleOption(option)"
                class="p-4 rounded-lg border transition-all"
                :class="{
                  'bg-amber-400 border-amber-400 text-white': order.at(-1)?.options.includes(option),
                  'bg-slate-50 hover:border-amber-500': !order.at(-1)?.options.includes(option)
                }"
              >
                {{ option }}
              </button>
            </div>
          </section>
        </div>

        <div class="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm flex flex-col h-fit sticky top-8">
          <h2 class="text-2xl font-bold mb-4 border-b pb-3">สรุปรายการ</h2>
          <div v-if="order.length === 0" class="text-center text-slate-500 py-16">
            <p>ยังไม่มีรายการสั่งซื้อ</p>
          </div>
          <div v-else class="flex-grow space-y-3 overflow-y-auto">
            <div
              v-for="(item, index) in order"
              :key="item.id"
              class="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
            >
              <div>
                <p class="font-semibold">{{ index + 1 }}. {{ item.name }} ({{ item.size }})</p>
                <p class="text-sm text-slate-600">{{ formatOptions(item.options) }}</p>
              </div>
              <div class="flex items-center gap-4">
                <p class="font-bold">{{ item.price }}.-</p>
                <button @click="removeItem(item.id)" class="text-red-500 hover:text-red-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="border-t mt-6 pt-4">
            <div class="flex justify-between items-center text-xl font-bold">
              <span>รวมทั้งหมด:</span>
              <span>{{ totalPrice }} บาท</span>
            </div>
            <button class="w-full bg-green-500 text-white font-bold py-3 mt-4 rounded-lg hover:bg-green-600 transition-all">
              ยืนยันการสั่งซื้อ
            </button>
          </div>
        </div>

      </div>
    </div>
  </main>
</template>

<style>
/* เราสามารถเพิ่ม Global Style ที่นี่ได้ถ้าต้องการ */
/* แต่ตอนนี้ Tailwind จัดการให้เกือบหมดแล้ว */
body {
  font-family: 'Inter', sans-serif; /* แนะนำให้ใช้ฟอนต์สวยๆ เช่น Inter หรือ Prompt */
}
</style>