<script setup>
import { ref, computed } from 'vue'
import Modal from './Modal.vue'

// --- การตั้งค่าและข้อมูลหลัก ---
const API_URL = 'https://tx9j0chj-5001.asse.devtunnels.ms/submit_order';
const tableNumber = ref(5);

const prices = ref([
  { size: 'เล็ก', price: 20 },
  { size: 'ธรรมดา', price: 40 },
  { size: 'พิเศษ', price: 50 },
  { size: 'จุกๆ', price: 60 },
]);

const noodleTypes = ref([
  { name: 'เส้นใหญ่', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/Gemini_Generated_Image_8sttux8sttux8stt_11zon.png' },
  { name: 'เส้นเล็ก', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/iloveimg-resized/Gemini_Generated_Image_8sttv08sttv08stt.png' },
  { name: 'เส้นหมี่', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/iloveimg-resized/Gemini_Generated_Image_8sttuz8sttuz8stt.png' },
  { name: 'เส้นเหลือง', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/Gemini_Generated_Image_8sttuy8sttuy8stt_11zon.png' },
  { name: 'เกาเหลา', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/Gemini_Generated_Image_v7ix4av7ix4av7ix_11zon.png' },
  { name: 'มาม่า', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/iloveimg-resized/Gemini_Generated_Image_8sttuw8sttuw8stt.png' },
  { name: 'วุ้นเส้น', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/Gemini_Generated_Image_6iaqln6iaqln6iaq+(1)_11zon.png' },
  { name: 'บะหมี่', imageUrl: 'https://all-banner-bot.s3.ap-southeast-1.amazonaws.com/all-bot/noodle/Gemini_Generated_Image_8sttv18sttv18stt_11zon.png' },
]);

const extraOptions = ref(['ไม่ผัก', 'ไม่เผ็ด', 'ไม่งอก', 'ไม่ชิ้น', 'ไม่ตับ', 'ไม่ผักบุ้ง', 'ลูกชิ้น']);
const otherMenuItems = ref([
  { name: 'ข้าวเปล่า', price: 10 },
  { name: 'แคบหมู', price: 10 },
  { name: 'น้ำเปล่า', price: 10 },
  { name: 'น้ำอัดลม', price: 20 },
  { name: 'หมูสะเต๊ะ(เล็ก)', price: 40 },
  { name: 'หมูสะเต๊ะ(ใหญ่)', price: 80 },
]);

// --- State ของแอปพลิเคชัน ---
const selectedPriceInfo = ref(null);
const selectedNoodle = ref(null);
const selectedOptions = ref([]);
const order = ref([]);
const isSubmitting = ref(false);
const showOtherMenu = ref(false);
const showNotes = ref(false);
const showTableSelection = ref(false);

// --- State และฟังก์ชันสำหรับ Scroll และ Badge ---
const orderSummaryEl = ref(null);

const totalQuantity = computed(() => {
  if (!order.value || order.value.length === 0) return 0;
  return order.value.reduce((sum, item) => sum + item.quantity, 0);
});

function scrollToOrderSummary() {
  if (orderSummaryEl.value) {
    orderSummaryEl.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// --- State และฟังก์ชันสำหรับ Modal ---
const modalState = ref({ show: false, title: '', message: '', status: 'success' });
const modalTimer = ref(null);

function showModal(title, message, status = 'success') {
  if (modalTimer.value) clearTimeout(modalTimer.value);
  modalState.value = { show: true, title, message, status };
  if (status === 'success') {
    modalTimer.value = setTimeout(closeModal, 2500);
  }
}

function closeModal() {
  if (modalTimer.value) clearTimeout(modalTimer.value);
  modalState.value.show = false;
}

// --- Computed Properties ---
const isReadyToAdd = computed(() => !!selectedPriceInfo.value && !!selectedNoodle.value);

const totalPrice = computed(() => {
  return order.value.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// --- Functions ---
function selectTable(newTableNumber) {
  tableNumber.value = newTableNumber;
  showTableSelection.value = false;
}

function getUserId() {
  let userId = localStorage.getItem('noodleShopUserId');
  if (!userId) {
    userId = 'user_' + Date.now() + Math.floor(Math.random() * 1000);
    localStorage.setItem('noodleShopUserId', userId);
  }
  return userId;
}

async function submitOrder() {
  if (order.value.length === 0) {
    showModal('รายการว่าง', 'กรุณาเพิ่มรายการอาหารก่อนยืนยันการสั่งซื้อ', 'warning');
    return;
  }
  isSubmitting.value = true;
  try {
    const sortedOrder=[...order.value].sort((a,b)=>{const t=null!==a.size,e=null!==b.size;return t&&!e?-1:!t&&e?1:0});
    const itemsPayload=sortedOrder.map((item,index)=>{const t=null!==item.size;return{item_number:index+1,menu_name:t?"ก๋วยเตี๋ยว":item.name,noodle_type:t?item.name:"",size:item.size||"",quantity:item.quantity,unit_price:item.price,sub_total:item.price*item.quantity,item_notes:item.options||[]}});
    const now=new Date;
    const codeTimestamp=now.getFullYear()+String(now.getMonth()+1).padStart(2,"0")+String(now.getDate()).padStart(2,"0")+String(now.getHours()).padStart(2,"0")+String(now.getMinutes()).padStart(2,"0")+String(now.getSeconds()).padStart(2,"0");
    const payload={table_number:String(tableNumber.value),user_id:getUserId(),order_timestamp:now.toISOString(),status:"ai_confirmed",total_amount:totalPrice.value,items:itemsPayload,order_code:`AI_CONFIRMED-${codeTimestamp}`};
    const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok){const t=await response.json().catch(()=>({message:"ไม่สามารถอ่านข้อมูลข้อผิดพลาดได้"}));throw new Error(`Server ตอบกลับมาว่า: ${response.status} - ${t.message||"ข้อผิดพลาดไม่ทราบสาเหตุ"}`)}
    const result=await response.json();
    console.log("Order submitted successfully:",result);
    showModal("สำเร็จ","ส่งรายการสั่งซื้อเรียบร้อยแล้ว!","success");
    order.value=[];
    selectedPriceInfo.value=null;
    resetCurrentSelection()
  }catch(error){
    console.error("Failed to submit order:",error);
    showModal("เกิดข้อผิดพลาด",error.message,"error")
  }finally{
    isSubmitting.value=false
  }
}

function createCompositeId(name, size, options) {
  const sortedOptions = [...options].sort().join(',');
  return `${name}-${size}-${sortedOptions}`;
}

function resetCurrentSelection() {
  selectedNoodle.value = null;
  selectedOptions.value = [];
  showNotes.value = false;
}

function selectPrice(priceInfo) {
  selectedPriceInfo.value = priceInfo;
}

function selectNoodle(noodleObject) {
  selectedNoodle.value = noodleObject;
}

function toggleOption(option) {
  if (!selectedNoodle.value) {
    alert('กรุณาเลือกเส้นก่อนครับ');
    return;
  }
  const index = selectedOptions.value.indexOf(option);
  if (index > -1) {
    selectedOptions.value.splice(index, 1);
  } else {
    selectedOptions.value.push(option);
  }
}

function addItemToOrder() {
  if (!isReadyToAdd.value) {
    alert('กรุณาเลือกขนาดชามและเส้นก่อนครับ');
    return;
  }
  const itemId = createCompositeId(selectedNoodle.value.name, selectedPriceInfo.value.size, selectedOptions.value);
  const existingItem = order.value.find(item => item.id === itemId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    order.value.push({
      id: itemId,
      name: selectedNoodle.value.name,
      size: selectedPriceInfo.value.size,
      price: selectedPriceInfo.value.price,
      options: [...selectedOptions.value],
      quantity: 1
    });
  }
  resetCurrentSelection();
}

function addOtherItem(itemToAdd) {
  const itemId = itemToAdd.name;
  const existingItem = order.value.find(item => item.id === itemId);
  if (existingItem) {
    existingItem.quantity++;
  } else {
    order.value.push({
      id: itemId,
      name: itemToAdd.name,
      size: null,
      price: itemToAdd.price,
      options: [],
      quantity: 1
    });
  }
}

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
  order.value = order.value.filter(item => item.id !== itemId);
}
</script>

<template>
  <Modal 
    :show="modalState.show"
    :title="modalState.title"
    :message="modalState.message"
    :status="modalState.status"
    @close="closeModal"
  />

  <div v-if="showTableSelection" @click.self="showTableSelection = false" class="z-50 fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md animate-fade-in">
          <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold">เลือกโต๊ะ</h3>
              <button @click="showTableSelection = false" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-5 gap-3">
              <button
                  v-for="n in 10"
                  :key="n"
                  @click="selectTable(n)"
                  :class="[
                      'py-4 rounded-lg border-2 text-xl font-bold transition-all',
                      tableNumber === n ? 'bg-blue-500 border-blue-600 text-white scale-105' : 'bg-slate-50 hover:bg-blue-100 hover:border-blue-400'
                  ]"
              >
                  {{ n }}
              </button>
          </div>
      </div>
  </div>


  <main class="bg-slate-100 min-h-screen font-sans text-slate-800">

    <button
      v-if="totalQuantity > 0"
      @click="scrollToOrderSummary"
      class="z-40 fixed top-6 right-6 flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-lg ring-4 ring-white/50 animate-fade-in transition-transform hover:scale-110"
      title="ไปที่สรุปรายการ"
    >
      <span class="text-xl font-bold">{{ totalQuantity }}</span>
    </button>
    <div class="w-full p-4 md:p-8">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-7xl mx-auto">
        
        <div class="md:col-span-3 bg-white p-6 rounded-2xl shadow-sm">
          
          <header class="mb-8">
            <button @click="showTableSelection = true" class="w-full text-left p-2 -m-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300">
              <h1 class="text-4xl font-bold text-slate-700">โต๊ะ {{ tableNumber }}</h1>
              <p class="text-slate-500 mt-1">กดเพื่อเปลี่ยนหมายเลขโต๊ะ</p>
            </button>
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

          <section class="mb-8">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">2. เลือกเส้น</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button 
                v-for="noodle in noodleTypes" 
                :key="noodle.name" 
                @click="selectNoodle(noodle)" 
                :class="[
                  'border-2 rounded-lg transition-all duration-200 overflow-hidden flex flex-col justify-between', 
                  selectedNoodle?.name === noodle.name ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-300' : 'bg-slate-50 border-slate-200 hover:border-sky-400'
                ]"
              >
                <img v-if="noodle.imageUrl" :src="noodle.imageUrl" :alt="noodle.name" class="w-full h-20 object-cover">
                <div v-else class="w-full h-20 bg-slate-200 flex items-center justify-center text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <span class="block text-center font-semibold p-2">{{ noodle.name }}</span>
              </button>
            </div>
          </section>

          <section class="mb-8" :class="{ 'opacity-30 pointer-events-none': !selectedNoodle }">
            <button @click="showNotes = !showNotes" class="w-full flex justify-between items-center text-left border-b pb-3 mb-4 transition-colors hover:bg-slate-50 p-2 -m-2 rounded-lg">
                <h2 class="text-xl font-semibold text-slate-700">3. เพิ่มหมายเหตุ (ถ้ามี)</h2>
                <svg :class="{'rotate-180': showNotes}" class="w-6 h-6 transition-transform duration-300 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            <div v-if="showNotes" class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
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
              <button @click="showOtherMenu = !showOtherMenu" class="w-full flex justify-between items-center text-left p-4 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors">
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

        <div ref="orderSummaryEl" class="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm flex flex-col h-fit sticky top-8">
          <h2 class="text-2xl font-bold mb-4 border-b pb-3">สรุปรายการ (Order)</h2>
          <div v-if="order.length === 0" class="text-center text-slate-500 py-16">
            <p>ยังไม่มีรายการสั่งซื้อ</p>
          </div>
          
          <div v-else class="flex-grow space-y-4 overflow-y-auto max-h-[60vh] p-1">
            <div v-for="(item, index) in order" :key="item.id" class="flex flex-col bg-slate-50 p-3 rounded-lg animate-fade-in shadow-sm">
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
            <button @click="submitOrder" :disabled="isSubmitting" class="w-full bg-blue-500 text-white font-bold py-3 mt-4 rounded-lg hover:bg-blue-600 transition-all disabled:bg-slate-400 disabled:cursor-wait">
              {{ isSubmitting ? 'กำลังส่ง...' : 'ยืนยันการสั่งซื้อ' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
@keyframes fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
body {
  font-family: 'IBM Plex Sans Thai', sans-serif;
  scroll-behavior: smooth;
}
</style>