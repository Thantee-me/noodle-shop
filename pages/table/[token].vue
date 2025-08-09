<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

definePageMeta({
  layout: false
});

// --- การตั้งค่าและข้อมูลหลัก ---
const API_URL = 'https://tx9j0chj-5001.asse.devtunnels.ms';
const route = useRoute();
const token = ref(route.params.token);

// --- Refs สำหรับ Auto-Scrolling ---
const sizeSectionEl = ref(null);
const noodleSectionEl = ref(null);
const addToOrderButtonEl = ref(null);

// --- State หลักของหน้า ---
const tableNumber = ref(null);
const isValidSession = ref(false);
const isLoading = ref(true);
const errorMessage = ref('');

// --- State ของเมนูและตะกร้า ---
const prices = ref([ { size: 'เล็ก', price: 20 }, { size: 'ธรรมดา', price: 40 }, { size: 'พิเศษ', price: 50 }, { size: 'จุกๆ', price: 60 }]);
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
  { name: 'ข้าวเปล่า', price: 10 }, { name: 'แคบหมู', price: 10 }, { name: 'น้ำเปล่า', price: 10 },
  { name: 'น้ำอัดลม', price: 20 }, { name: 'สะเต๊ะ(เล็ก)', price: 40 }, { name: 'สะเต๊ะ(ใหญ่)', price: 80 },{ name: 'ลูกชิ้น', price: 5 }
]);
const selectedPriceInfo = ref(null);
const selectedNoodle = ref(null);
const selectedOptions = ref([]);
const isSubmitting = ref(false);
const showNotes = ref(false);
const orderSummaryEl = ref(null);
const modalState = ref({ show: false, title: '', message: '', status: 'success' });
const modalTimer = ref(null);
const existingOrderItems = ref([]);
const newOrderItems = ref([]);

// --- Logic หลักของหน้า ---
async function initializeSession() {
  isLoading.value = true;
  try {
    const response = await fetch(`${API_URL}/session/verify/${token.value}`);
    const data = await response.json();
    if (!response.ok) { throw new Error(data.error || 'Token ไม่ถูกต้อง'); }
    tableNumber.value = data.table_number;
    if (data.items && data.items.length > 0) {
        const mappedItems = data.items.map(item => ({
            id: `${item.noodle_type || item.menu_name}-${item.size}-${(item.item_notes || []).join(',')}-${Math.random()}`,
            name: item.noodle_type || item.menu_name, size: item.size || null, price: item.unit_price,
            options: Array.isArray(item.item_notes) ? item.item_notes : [], quantity: item.quantity
        }));
        existingOrderItems.value = mappedItems;
    }
    isValidSession.value = true;
  } catch (error) {
    isValidSession.value = false;
    errorMessage.value = error.message;
  } finally {
    isLoading.value = false;
  }
}
onMounted(() => { initializeSession(); });

// --- Computed Properties ---
const combinedOrder = computed(() => [...newOrderItems.value, ...existingOrderItems.value]);
const totalQuantity = computed(() => combinedOrder.value.reduce((sum, item) => sum + item.quantity, 0));
const isReadyToAdd = computed(() => !!selectedPriceInfo.value && !!selectedNoodle.value);
const totalPrice = computed(() => combinedOrder.value.reduce((sum, item) => sum + (item.price * item.quantity), 0));

// --- Functions ---
function showModal(title, message, status = 'success') { if (modalTimer.value) clearTimeout(modalTimer.value); modalState.value = { show: true, title, message, status }; if (status === 'success') { setTimeout(closeModal, 2500); } }
function closeModal() { if (modalTimer.value) clearTimeout(modalTimer.value); modalState.value.show = false; }
function getUserId() { let userId = localStorage.getItem('noodleShopUserId_customer'); if (!userId) { userId = 'customer_' + Date.now() + Math.floor(Math.random() * 1000); localStorage.setItem('noodleShopUserId_customer', userId); } return userId; }
async function submitOrder() {
  if (newOrderItems.value.length === 0) { showModal('รายการว่าง', 'กรุณาเพิ่มรายการอาหารใหม่ก่อนยืนยัน', 'warning'); return; }
  isSubmitting.value = true;
  try {
    const fullOrderPayload = combinedOrder.value;
    const sortedOrder=fullOrderPayload.sort((a,b)=>{const t=null!==a.size,e=null!==b.size;return t&&!e?-1:!t&&e?1:0});
    const itemsPayload=sortedOrder.map((item,index)=>{const t=null!==item.size;return{item_number:index+1,menu_name:t?"ก๋วยเตี๋ยว":item.name,noodle_type:t?item.name:"",size:item.size||"",quantity:item.quantity,unit_price:item.price,sub_total:item.price*item.quantity,item_notes:item.options||[]}});
    const now=new Date;
    const payload={ table_number:String(tableNumber.value), user_id:getUserId(), order_timestamp:now.toISOString(), status:"open", total_amount:totalPrice.value, items:itemsPayload, print_ticket: true };
    const response=await fetch(`${API_URL}/submit_order`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!response.ok){const t=await response.json().catch(()=>({message:"ไม่สามารถอ่านข้อมูลข้อผิดพลาดได้"}));throw new Error(`Server ตอบกลับมาว่า: ${response.status} - ${t.message||"ข้อผิดพลาดไม่ทราบสาเหตุ"}`)}
    showModal("ส่งรายการสำเร็จ","ส่งรายการอาหารไปที่ครัวเรียบร้อยแล้ว!","success");
    existingOrderItems.value = [...combinedOrder.value];
    newOrderItems.value = [];
    nextTick(() => {
      sizeSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }catch(error){
    showModal("เกิดข้อผิดพลาด",error.message,"error")
  }finally{
    isSubmitting.value=false
  }
}
function createCompositeId(name, size, options) { const sortedOptions = [...options].sort().join(','); return `${name}-${size}-${sortedOptions}`; }
function resetCurrentSelection() { selectedNoodle.value = null; selectedOptions.value = []; showNotes.value = false; }
function selectPrice(priceInfo) {
  selectedPriceInfo.value = priceInfo;
  nextTick(() => {
    noodleSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
function selectNoodle(noodleObject) {
  selectedNoodle.value = noodleObject;
  nextTick(() => {
    addToOrderButtonEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}
function addItemToOrder() { 
  if (!isReadyToAdd.value) { alert('กรุณาเลือกขนาดชามและเส้นก่อนครับ'); return; } 
  const itemId = createCompositeId(selectedNoodle.value.name, selectedPriceInfo.value.size, selectedOptions.value); 
  const existingItem = newOrderItems.value.find(item => item.id === itemId); 
  if (existingItem) { existingItem.quantity++; } 
  else { newOrderItems.value.unshift({ id: itemId, name: selectedNoodle.value.name, size: selectedPriceInfo.value.size, price: selectedPriceInfo.value.price, options: [...selectedOptions.value], quantity: 1 }); } 
  resetCurrentSelection(); 
  nextTick(() => {
    sizeSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
function toggleOption(option) { if (!selectedNoodle.value) { alert('กรุณาเลือกเส้นก่อนครับ'); return; } const index = selectedOptions.value.indexOf(option); if (index > -1) { selectedOptions.value.splice(index, 1); } else { selectedOptions.value.push(option); } }
function addOtherItem(itemToAdd) { const itemId = itemToAdd.name; const existingItem = newOrderItems.value.find(item => item.id === itemId); if (existingItem) { existingItem.quantity++; } else { newOrderItems.value.unshift({ id: itemId, name: itemToAdd.name, size: null, price: itemToAdd.price, options: [], quantity: 1 }); } }
function increaseQuantity(itemId) { const item = newOrderItems.value.find(p => p.id === itemId); if (item) { item.quantity++; } }
function decreaseQuantity(itemId) { const item = newOrderItems.value.find(p => p.id === itemId); if (item) { item.quantity--; if (item.quantity === 0) { removeItem(itemId); } } }
function removeItem(itemId) { newOrderItems.value = newOrderItems.value.filter(item => item.id !== itemId); }
function scrollToOrderSummary() { if (orderSummaryEl.value) { orderSummaryEl.value.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
</script>

<template>
  <Modal 
    :show="modalState.show"
    :title="modalState.title"
    :message="modalState.message"
    :status="modalState.status"
    @close="closeModal"
  />
  
  <div v-if="isLoading" class="flex items-center justify-center min-h-screen text-center">
    <p class="text-xl text-slate-600">กำลังตรวจสอบ QR Code...</p>
  </div>
  <div v-else-if="!isValidSession" class="flex items-center justify-center min-h-screen text-center p-4">
    <h2 class="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด: {{ errorMessage }}</h2>
  </div>
  
  <main v-else class="bg-slate-100 min-h-screen font-sans text-slate-800">
    <button v-if="totalQuantity > 0" @click="scrollToOrderSummary" class="z-40 fixed top-6 right-6 flex items-center justify-center w-12 h-12 bg-red-500 text-white rounded-full shadow-lg ring-4 ring-white/50 animate-fade-in transition-transform hover:scale-110" title="ไปที่สรุปรายการ">
      <span class="text-xl font-bold">{{ totalQuantity }}</span>
    </button>
    <div class="w-full p-4 md:p-8">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-7xl mx-auto">
        
        <div class="md:col-span-3 bg-white p-6 rounded-2xl shadow-sm">
          <header class="mb-8 text-left">
            <h1 class="text-4xl font-bold text-slate-700">โต๊ะ {{ tableNumber }}</h1>
            <p class="text-slate-500 mt-1">เลือกรายการอาหารที่ต้องการสั่งเพิ่มได้เลยครับ/ค่ะ</p>
          </header>
          
           <section ref="sizeSectionEl" class="mb-8">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">1. เลือกขนาดชาม</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button v-for="p in prices" :key="p.price" @click="selectPrice(p)" :class="['p-4 rounded-lg border-2 transition-all duration-200 text-center', selectedPriceInfo?.price === p.price ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105 ring-2 ring-red-300' : 'bg-white hover:border-red-400 hover:bg-red-50']">
                <span class="block text-lg font-bold">{{ p.size }}</span>
                <span class="block text-sm">{{ p.price }} บาท</span>
              </button>
            </div>
          </section>
          <section ref="noodleSectionEl" class="mb-8">
            <h2 class="text-xl font-semibold border-b pb-3 mb-4">2. เลือกเส้น</h2>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <button v-for="noodle in noodleTypes" :key="noodle.name" @click="selectNoodle(noodle)" :class="['border-2 rounded-lg transition-all duration-200 overflow-hidden flex flex-col justify-between', selectedNoodle?.name === noodle.name ? 'border-sky-500 bg-sky-100 ring-2 ring-sky-300' : 'bg-slate-50 border-slate-200 hover:border-sky-400']">
                <img v-if="noodle.imageUrl" :src="noodle.imageUrl" :alt="noodle.name" class="w-full h-20 object-cover">
                <div v-else class="w-full h-20 bg-slate-200 flex items-center justify-center text-slate-400"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                <span class="block text-center font-semibold p-2">{{ noodle.name }}</span>
              </button>
            </div>
          </section>
          <section class="mb-8" :class="{ 'opacity-30 pointer-events-none': !selectedNoodle }">
            <button @click="showNotes = !showNotes" class="w-full flex justify-between items-center text-left border-b pb-3 mb-4 transition-colors hover:bg-slate-50 p-2 -m-2 rounded-lg">
                <h2 class="text-xl font-semibold text-slate-700">3. เพิ่มหมายเหตุ (ถ้ามี)</h2>
                <svg :class="{'rotate-180': showNotes}" class="w-6 h-6 transition-transform duration-300 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
            </button>
            <div v-if="showNotes" class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
              <button v-for="option in extraOptions" :key="option" @click="toggleOption(option)" class="p-4 rounded-lg border-2 transition-all" :class="{'bg-amber-400 border-amber-500 text-white scale-105 shadow-md': selectedOptions.includes(option), 'bg-slate-50 hover:border-amber-500': !selectedOptions.includes(option) }">
                {{ option }}
              </button>
            </div>
          </section>
           <section ref="addToOrderButtonEl" class="mt-8 pt-6 border-t">
            <button @click="addItemToOrder" :disabled="!isReadyToAdd" class="w-full bg-green-600 text-white font-bold py-4 rounded-lg hover:bg-green-700 transition-all disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-lg hover:shadow-xl disabled:shadow-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="mr-3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              เพิ่มก๋วยเตี๋ยวลงรายการ
            </button>
          </section>
           <section class="mt-6 pt-6 border-t">
              <h2 class="text-xl font-bold text-slate-700 mb-4">เมนูอื่น ๆ</h2>
              <div class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in">
                  <button v-for="item in otherMenuItems" :key="item.name" @click="addOtherItem(item)" class="p-2 rounded-lg border-2 text-center bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm flex flex-col justify-center min-h-[6rem]">
                      <span class="block text-base font-bold break-words">{{ item.name }}</span>
                      <span class="block text-sm mt-1">{{ item.price }} บาท</span>
                  </button>
              </div>
          </section>
        </div>

        <div ref="orderSummaryEl" class="md:col-span-2 bg-white p-6 rounded-2xl shadow-sm flex flex-col h-fit sticky top-8">
          <h2 class="text-2xl font-bold mb-4 border-b pb-3">สรุปรายการอาหาร</h2>
          
          <div v-if="existingOrderItems.length === 0 && newOrderItems.length === 0" class="text-center text-slate-500 py-16">
            <p>ยังไม่มีรายการในตะกร้า</p>
          </div>
          <div v-else class="flex-grow space-y-2 overflow-y-auto max-h-[60vh] p-1">
            
            <div v-if="newOrderItems.length > 0">
              <p class="text-sm font-bold text-blue-600 mb-2 px-1">รายการใหม่ในตะกร้า</p>
              <div class="space-y-2">
                <div v-for="(item, index) in newOrderItems" :key="item.id" class="flex flex-col bg-blue-50 p-3 rounded-lg animate-fade-in shadow-sm">
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
                    <p class="break-words"><span class="font-medium">หมายเหตุ:</span> {{ item.options.join(', ') }}</p>
                  </div>
                  <div class="flex justify-between items-center mt-2 border-t border-slate-200 pt-2">
                     <div class="flex items-center gap-2 bg-white rounded-full border border-slate-300 px-1">
                       <button @click="decreaseQuantity(item.id)" class="w-7 h-7 flex items-center justify-center text-lg font-bold text-red-500 rounded-full hover:bg-red-100 transition-colors">-</button>
                       <span class="font-bold w-6 text-center text-slate-700">{{ item.quantity }}</span>
                       <button @click="increaseQuantity(item.id)" class="w-7 h-7 flex items-center justify-center text-lg font-bold text-green-500 rounded-full hover:bg-green-100 transition-colors">+</button>
                     </div>
                     <button @click="removeItem(item.id)" class="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-100 transition-colors" title="ลบรายการนี้ทั้งหมด">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                     </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="existingOrderItems.length > 0" class="mt-4">
              <p class="text-sm font-bold text-slate-500 mb-2 px-1">รายการที่สั่งไปแล้ว</p>
              <div class="space-y-1">
                  <div v-for="(item, index) in existingOrderItems" :key="item.id" class="flex flex-col p-3 rounded-lg border-b border-dashed border-slate-200 last:border-none">
                    <div class="flex justify-between items-start">
                        <p class="font-semibold text-slate-700 flex-1 break-words">
                            {{ newOrderItems.length + index + 1 }}. {{ item.name }} 
                            <span class="text-slate-500 font-medium">x {{ item.quantity }}</span>
                        </p>
                        <p class="text-sm font-bold text-slate-700 pl-2 whitespace-nowrap">{{ item.price * item.quantity }} บาท</p>
                    </div>
                    <div class="flex justify-between items-center mt-1 text-sm text-slate-600">
                      <p v-if="item.size">ขนาด {{ item.size }}</p><div v-else></div>
                    </div>
                    <p v-if="item.options.length > 0" class="text-xs text-slate-500 mt-1">
                        หมายเหตุ: {{ item.options.join(', ') }}
                    </p>
                  </div>
              </div>
            </div>
          </div>
          
          <div v-if="combinedOrder.length > 0" class="border-t mt-6 pt-4">
            <div class="flex justify-between items-center text-xl font-bold">
              <span>รวมทั้งหมด:</span>
              <span>{{ totalPrice }} บาท</span>
            </div>
            <button @click="submitOrder" :disabled="isSubmitting || newOrderItems.length === 0" class="w-full bg-blue-500 text-white font-bold py-3 mt-4 rounded-lg hover:bg-blue-600 transition-all disabled:bg-slate-400 disabled:cursor-not-allowed">
              {{ isSubmitting ? 'กำลังส่ง...' : 'ส่งรายการอาหาร' }}
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
</style>