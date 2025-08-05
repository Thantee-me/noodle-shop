<script setup>
import { ref, computed } from 'vue'

// --- ข้อมูลหลักของเมนู ---
const prices = ref([
  { size: 'เล็ก', price: 20 },
  { size: 'ธรรมดา', price: 40 },
  { size: 'พิเศษ', price: 50 },
  { size: 'จุกๆ', price: 60 },
])
// นำ 'ข้าวเปล่า' ออกจากหมวดนี้
const noodleTypes = ref(['เส้นเล็ก', 'เส้นใหญ่', 'เส้นหมี่', 'บะหมี่', 'วุ้นเส้น', 'เกาเหลา'])
const extraOptions = ref(['ไม่ผัก', 'ไม่เผ็ด', 'ไม่งอก', 'ไม่ชิ้น', 'ไม่ตับ', 'ไม่ผักบุ้ง', 'ลูกชิ้น'])

// ===== START: ข้อมูลใหม่สำหรับเมนูอื่นๆ =====
const showOtherMenu = ref(false); // State สำหรับซ่อน/แสดงเมนู
const otherMenuItems = ref([
  { name: 'ข้าวเปล่า', price: 10 },
  { name: 'แคบหมู', price: 10 },
  { name: 'น้ำเปล่า', price: 10 },
  { name: 'น้ำอัดลม', price: 20 },
  { name: 'หมูสะเต๊ะ (เล็ก)', price: 40 },
  { name: 'หมูสะเต๊ะ (ใหญ่)', price: 80 },
]);
// ===== END: ข้อมูลใหม่สำหรับเมนูอื่นๆ =====


// --- State ---
const selectedPriceInfo = ref(null)
const selectedNoodle = ref(null)
const selectedOptions = ref([])
const order = ref([])

// --- Computed Properties ---
const isReadyToAdd = computed(() => !!selectedPriceInfo.value && !!selectedNoodle.value)

const totalPrice = computed(() => {
  return order.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

// --- Functions ---

function createCompositeId(name, size, options) {
  const sortedOptions = [...options].sort().join(',');
  return `${name}-${size}-${sortedOptions}`;
}

function resetCurrentSelection() {
  selectedNoodle.value = null
  selectedOptions.value = []
}

function selectPrice(priceInfo) {
  selectedPriceInfo.value = priceInfo
}

function selectNoodle(noodle) {
  selectedNoodle.value = noodle
}

function toggleOption(option) {
  if (!selectedNoodle.value) {
    alert('กรุณาเลือกเส้นก่อนเพิ่มหมายเหตุครับ')
    return
  }
  const optionIndex = selectedOptions.value.indexOf(option)
  if (optionIndex > -1) {
    selectedOptions.value.splice(optionIndex, 1)
  } else {
    selectedOptions.value.push(option)
  }
}

function addItemToOrder() {
  if (!isReadyToAdd.value) {
    alert('กรุณาเลือก "ขนาดชาม" และ "เส้น" ให้ครบก่อนครับ')
    return
  }

  const itemId = createCompositeId(selectedNoodle.value, selectedPriceInfo.value.size, selectedOptions.value);
  const existingItem = order.value.find(item => item.id === itemId);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    order.value.push({
      id: itemId,
      name: selectedNoodle.value,
      size: selectedPriceInfo.value.size,
      price: selectedPriceInfo.value.price,
      options: [...selectedOptions.value],
      quantity: 1
    });
  }
  
  resetCurrentSelection()
}

// ===== START: ฟังก์ชันใหม่สำหรับเพิ่มเมนูอื่นๆ =====
function addOtherItem(itemToAdd) {
  // ใช้ชื่อเมนูเป็น ID เพราะไม่มีตัวเลือกอื่น
  const itemId = itemToAdd.name;
  const existingItem = order.value.find(item => item.id === itemId);

  if (existingItem) {
    existingItem.quantity++;
  } else {
    order.value.push({
      id: itemId,
      name: itemToAdd.name,
      size: null, // ไม่มีขนาดสำหรับเมนูเหล่านี้
      price: itemToAdd.price,
      options: [],
      quantity: 1
    });
  }
}
// ===== END: ฟังก์ชันใหม่สำหรับเพิ่มเมนูอื่นๆ =====


function increaseQuantity(itemId) {
  const item = order.value.find(p => p.id === itemId);
  if (item) {
    item.quantity++;
  }
}

function decreaseQuantity(itemId) {
  const item = order.value.find(p => p.id === itemId);
  if (item) {
    item.quantity--;
    if (item.quantity === 0) {
      removeItem(itemId);
    }
  }
}

function removeItem(itemId) {
  order.value = order.value.filter(item => item.id !== itemId)
}

</script>

<template>
  <main class="bg-slate-100 min-h-screen font-sans text-slate-800">
    <div class="w-full p-4 md:p-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        <div class="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm">
          <header class="text-center mb-8">
            <h1 class="text-4xl font-bold text-slate-700">โต๊ะ 5</h1>
            <p class="text-slate-500 mt-1">กรุณาเลือกรายการอาหารทีละรายการ</p>
          </header>
           <section class="mb-8">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">1. เลือกขนาดชาม</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button v-for="p in prices" :key="p.price" @click="selectPrice(p)" :class="['p-4 rounded-lg border-2 transition-all duration-200 text-center', selectedPriceInfo?.price === p.price ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105 ring-2 ring-red-300' : 'bg-white hover:border-red-400 hover:bg-red-50']">
                <span class="block text-lg font-bold">{{ p.size }}</span>
                <span class="block text-sm">{{ p.price }} บาท</span>
              </button>
            </div>
          </section>
          <section class="mb-8 transition-opacity duration-300">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">2. เลือกเส้น</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button v-for="noodle in noodleTypes" :key="noodle" @click="selectNoodle(noodle)" :class="['p-4 rounded-lg border-2 transition-all duration-200', selectedNoodle === noodle ? 'bg-sky-500 border-sky-600 text-white shadow-lg scale-105 ring-2 ring-sky-300' : 'bg-slate-50 hover:border-sky-400 hover:bg-sky-50']">
                {{ noodle }}
              </button>
            </div>
          </section>
          <section class="mb-8 transition-opacity duration-300" :class="{ 'opacity-30 pointer-events-none': !selectedNoodle }">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">3. เพิ่มหมายเหตุ (ถ้ามี)</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button v-for="option in extraOptions" :key="option" @click="toggleOption(option)" class="p-4 rounded-lg border-2 transition-all" :class="{'bg-amber-400 border-amber-500 text-white scale-105 shadow-md': selectedOptions.includes(option), 'bg-slate-50 hover:border-amber-500': !selectedOptions.includes(option) }">
                {{ option }}
              </button>
            </div>
          </section>
           <section class="mt-8 pt-6 border-t">
            <button @click="addItemToOrder" :disabled="!isReadyToAdd" class="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-lg hover:shadow-xl disabled:shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              เพิ่มก๋วยเตี๋ยวลงรายการ
            </button>
          </section>

          <section class="mt-6 pt-6 border-t">
              <button 
                  @click="showOtherMenu = !showOtherMenu" 
                  class="w-full flex justify-between items-center text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                  <span class="text-xl font-bold text-slate-700">เมนูอื่น ๆ</span>
                  <svg :class="{'rotate-180': showOtherMenu}" class="w-6 h-6 transition-transform duration-300 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
              </button>

              <div v-if="showOtherMenu" class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
                  <button
                      v-for="item in otherMenuItems"
                      :key="item.name"
                      @click="addOtherItem(item)"
                      class="p-4 rounded-lg border-2 text-center bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm"
                  >
                      <span class="block text-lg font-bold">{{ item.name }}</span>
                      <span class="block text-sm">{{ item.price }} บาท</span>
                  </button>
              </div>
          </section>
          </div>

        <div class="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm flex flex-col h-fit sticky top-8">
          <h2 class="text-2xl font-bold mb-4 border-b pb-3">สรุปรายการ (Order)</h2>
          <div v-if="order.length === 0" class="text-center text-slate-500 py-16">
            <p>ยังไม่มีรายการสั่งซื้อ</p>
          </div>
          
          <div v-else class="flex-grow space-y-4 overflow-y-auto max-h-[60vh] p-1">
            <div
              v-for="(item, index) in order"
              :key="item.id"
              class="flex flex-col bg-slate-50 p-3 rounded-lg animate-fade-in shadow-sm"
            >
              <p class="font-semibold text-slate-800 text-base">
                {{ index + 1 }}. {{ item.name }}
                <span class="text-red-500 font-bold ml-2">x {{ item.quantity }}</span>
              </p>
              
              <div class="flex justify-between items-center mt-1.5">
                <p v-if="item.size" class="text-sm text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">ขนาด {{ item.size }}</p>
                <div v-else></div>
                <p class="text-base font-bold text-slate-800">{{ item.price * item.quantity }} บาท</p>
              </div>

              <div v-if="item.options.length > 0" class="mt-2 text-sm text-amber-800 bg-amber-100 p-2 rounded-md">
                <p class="break-words">
                  <span class="font-medium">หมายเหตุ:</span> {{ item.options.join(', ') }}
                </p>
              </div>
              
              <div class="flex justify-between items-center mt-2 border-t border-slate-200 pt-2">
                 <div class="flex items-center gap-2 bg-white rounded-full border border-slate-300 px-1">
                   <button @click="decreaseQuantity(item.id)" class="w-7 h-7 flex items-center justify-center text-lg font-bold text-red-500 rounded-full hover:bg-red-100 transition-colors">-</button>
                   <span class="font-bold w-6 text-center text-slate-700">{{ item.quantity }}</span>
                   <button @click="increaseQuantity(item.id)" class="w-7 h-7 flex items-center justify-center text-lg font-bold text-green-500 rounded-full hover:bg-green-100 transition-colors">+</button>
                 </div>
                 
                 <button @click="removeItem(item.id)" class="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors" title="ลบรายการนี้ทั้งหมด">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" />
                    </svg>
                 </button>
              </div>
            </div>
          </div>
          
          <div v-if="order.length > 0" class="border-t mt-6 pt-4">
            <div class="flex justify-between items-center text-xl font-bold">
              <span>รวมทั้งหมด:</span>
              <span>{{ totalPrice }} บาท</span>
            </div>
            <button class="w-full bg-blue-500 text-white font-bold py-3 mt-4 rounded-lg hover:bg-blue-600 transition-all">
              ยืนยันการสั่งซื้อ
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
body {
  font-family: 'IBM Plex Sans Thai', sans-serif;
}
</style>