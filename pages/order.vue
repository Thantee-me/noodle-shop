<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const config = useRuntimeConfig();
const API_URL = config.public.apiUrl;
const tableNumber = ref(null);

// --- Refs สำหรับ Auto-Scrolling ---
const sizeSectionEl = ref(null);
const noodleSectionEl = ref(null);
const addToOrderButtonEl = ref(null);

// --- State สำหรับข้อมูลจาก API ---
const prices = ref([]);
const noodleTypes = ref([]);
const extraOptions = ref([]);
const otherMenuItems = ref([]);
const allTables = ref([]);

// --- State อื่นๆ ---
const selectedPriceInfo = ref(null);
const selectedNoodle = ref(null);
const selectedOptions = ref([]);
const order = ref([]);
const isSubmitting = ref(false);
const showNotes = ref(true); // ✅ <<<< แก้ไขตรงนี้: ทำให้หมายเหตุเปิดเป็นค่าเริ่มต้น
const showTableSelection = ref(false);
const showCheckBillModal = ref(false);
const orderSummaryEl = ref(null);
const modalState = ref({ show: false, title: '', message: '', status: 'success' });
const modalTimer = ref(null);
const activeTables = ref([]);
const isLoadingActiveTables = ref(false);
const isLoadingTablesForSelection = ref(false);
const showAllNotes = ref(false);

// --- Computed Properties ---
const initialNotes = computed(() => extraOptions.value.slice(0, 5));
const totalPrice = computed(() => order.value.reduce((sum, item) => sum + (item.price * item.quantity), 0));
const totalQuantity = computed(() => order.value.reduce((sum, item) => sum + item.quantity, 0));
const isReadyToAdd = computed(() => !!selectedPriceInfo.value && !!selectedNoodle.value);

// --- ฟังก์ชันดึงข้อมูลตอนเริ่มต้น ---
async function fetchMenuData() {
  try {
    const response = await fetch(`${API_URL}/menu`);
    if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลเมนูได้');
    const menuData = await response.json();
    prices.value = menuData.prices;
    noodleTypes.value = menuData.noodleTypes;
    extraOptions.value = menuData.extraOptions;
    otherMenuItems.value = menuData.otherMenuItems;
  } catch (error) {
    console.error("Failed to fetch menu data:", error);
    showModal('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลเมนูได้ กรุณาลองใหม่', 'error');
  }
}

async function fetchAllTables() {
  try {
    const response = await fetch(`${API_URL}/tables`);
    if (!response.ok) throw new Error('ไม่สามารถโหลดข้อมูลโต๊ะได้');
    allTables.value = await response.json();
  } catch (error) {
    console.error("Failed to fetch tables:", error);
    showModal('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลโต๊ะได้', 'error');
  }
}

onMounted(() => {
  Promise.all([
    fetchMenuData(),
    fetchAllTables()
  ]);
});

// --- ฟังก์ชัน Helpers ---
function showModal(title, message, status = 'success') {
  if (modalTimer.value) clearTimeout(modalTimer.value);
  modalState.value = { show: true, title, message, status };
  if (status === 'success') setTimeout(closeModal, 2500);
}

function closeModal() {
  if (modalTimer.value) clearTimeout(modalTimer.value);
  modalState.value.show = false;
}

function getUserId() {
  let userId = localStorage.getItem('noodleShopUserId');
  if (!userId) {
    userId = `user_${Date.now()}${Math.floor(Math.random() * 1000)}`;
    localStorage.setItem('noodleShopUserId', userId);
  }
  return userId;
}

function isTableActive(tableNum) {
  return activeTables.value.some(activeTable => activeTable.table_number == tableNum);
}

function createCompositeId(name, size, options) {
  const sortedOptions = [...options].sort().join(',');
  return `${name}-${size}-${sortedOptions}`;
}

function resetCurrentSelection() {
  selectedNoodle.value = null;
  selectedOptions.value = [];
  // showNotes ไม่ต้อง reset เป็น false แล้ว
  showAllNotes.value = false;
}

function upsertItemInOrder(itemData) {
  const existingItem = order.value.find(item => item.id === itemData.id);
  if (existingItem) {
    existingItem.quantity++;
    const itemIndex = order.value.findIndex(item => item.id === itemData.id);
    if (itemIndex > -1) {
      const [item] = order.value.splice(itemIndex, 1);
      order.value.unshift(item);
    }
  } else {
    order.value.unshift({ ...itemData, quantity: 1 });
  }
}

// --- ฟังก์ชันจัดการ Order ---
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
  if (!isReadyToAdd.value) {
    alert('กรุณาเลือกขนาดชามและเส้นก่อนครับ');
    return;
  }
  upsertItemInOrder({
    id: createCompositeId(selectedNoodle.value.name, selectedPriceInfo.value.size, selectedOptions.value),
    name: selectedNoodle.value.name,
    size: selectedPriceInfo.value.size,
    price: selectedPriceInfo.value.price,
    options: [...selectedOptions.value],
  });
  resetCurrentSelection();
  nextTick(() => sizeSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function addOtherItem(itemToAdd) {
  upsertItemInOrder({
    id: createCompositeId(itemToAdd.name, null, []),
    name: itemToAdd.name,
    size: null,
    price: itemToAdd.price,
    options: [],
  });
}

function increaseQuantity(itemId) {
  const item = order.value.find(p => p.id === itemId);
  if (item) item.quantity++;
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

function scrollToOrderSummary() {
  orderSummaryEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- ฟังก์ชันจัดการ Modal และการส่งข้อมูล ---
async function openCheckBillModal() {
  isLoadingActiveTables.value = true;
  showCheckBillModal.value = true;
  try {
    const response = await fetch(`${API_URL}/active_orders`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลโต๊ะได้');
    activeTables.value = await response.json();
  } catch (error) {
    console.error("Error fetching active tables:", error);
    showModal('เกิดข้อผิดพลาด', 'ไม่สามารถดึงข้อมูลโต๊ะที่ใช้งานได้', 'error');
    showCheckBillModal.value = false;
  } finally {
    isLoadingActiveTables.value = false;
  }
}

function loadOrderForTable(tableNum) {
  showCheckBillModal.value = false;
  return navigateTo(`/check-bill/${tableNum}`);
}

async function handleOrderSubmission() {
  if (order.value.length === 0) {
    showModal('รายการว่าง', 'กรุณาเพิ่มรายการอาหารก่อน', 'warning');
    return;
  }
  isLoadingTablesForSelection.value = true;
  showTableSelection.value = true;
  try {
    const response = await fetch(`${API_URL}/active_orders`);
    if (!response.ok) throw new Error('ไม่สามารถดึงข้อมูลโต๊ะได้');
    activeTables.value = await response.json();
  } catch (error) {
    console.error("Error fetching active tables for selection:", error);
    showModal('เกิดข้อผิดพลาด', 'ไม่สามารถโหลดสถานะโต๊ะได้', 'error');
    showTableSelection.value = false;
  } finally {
    isLoadingTablesForSelection.value = false;
  }
}

async function selectTableAndSubmit(newTableNumber) {
  if (isTableActive(newTableNumber)) {
    showModal('โต๊ะไม่ว่าง', `โต๊ะ ${newTableNumber} มีลูกค้าใช้งานอยู่แล้ว`, 'error');
    return;
  }
  tableNumber.value = newTableNumber;
  showTableSelection.value = false;
  await submitOrder();
}

async function submitOrder() {
  isSubmitting.value = true;
  try {
    const sortedOrder = [...order.value].sort((a, b) => {
      const isANoodle = a.size !== null;
      const isBNoodle = b.size !== null;
      if (isANoodle && !isBNoodle) return -1;
      if (!isANoodle && isBNoodle) return 1;
      return 0;
    });
    const itemsPayload = sortedOrder.map((item, index) => {
      const isNoodle = item.size !== null;
      return {
        item_number: index + 1,
        menu_name: isNoodle ? "ก๋วยเตี๋ยว" : item.name,
        noodle_type: isNoodle ? item.name : "",
        size: item.size || "",
        quantity: item.quantity,
        unit_price: item.price,
        sub_total: item.price * item.quantity,
        item_notes: item.options || []
      };
    });
    const payload = {
      table_number: String(tableNumber.value),
      user_id: getUserId(),
      order_timestamp: new Date().toISOString(),
      status: "open",
      total_amount: totalPrice.value,
      items: itemsPayload
    };
    const response = await fetch(`${API_URL}/submit_order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "ไม่สามารถอ่านข้อมูลข้อผิดพลาดได้" }));
      throw new Error(`Server ตอบกลับมาว่า: ${response.status} - ${errorData.message || "ข้อผิดพลาดไม่ทราบสาเหตุ"}`);
    }
    showModal("สำเร็จ", `ส่งรายการสั่งซื้อโต๊ะ ${tableNumber.value} เรียบร้อยแล้ว!`, "success");
    order.value = [];
    selectedPriceInfo.value = null;
    tableNumber.value = null;
    resetCurrentSelection();
    nextTick(() => {
      sizeSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  } catch (error) {
    showModal("เกิดข้อผิดพลาด", error.message, "error");
  } finally {
    isSubmitting.value = false;
  }
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
              <h3 class="text-2xl font-bold">เลือกโต๊ะสำหรับออเดอร์นี้</h3>
              <button @click="showTableSelection = false" class="text-gray-400 hover:text-gray-600">&times;</button>
          </div>
          <div v-if="isLoadingTablesForSelection" class="text-center py-10">
              <p class="text-gray-500 animate-pulse">กำลังตรวจสอบสถานะโต๊ะ...</p>
          </div>
          <div v-else class="grid grid-cols-4 sm:grid-cols-5 gap-3">
              <button 
                v-for="table in allTables" 
                :key="table.table_id" 
                @click="selectTableAndSubmit(table.table_number)"
                :disabled="isTableActive(table.table_number)"
                class="py-4 rounded-lg border-2 text-xl font-bold transition-all"
                :class="{
                  'bg-slate-50 hover:bg-blue-100 hover:border-blue-400': !isTableActive(table.table_number),
                  'bg-red-100 border-red-300 text-red-500 cursor-not-allowed opacity-60': isTableActive(table.table_number)
                }"
              >
                  {{ table.table_number }}
              </button>
          </div>
      </div>
  </div>

  <div v-if="showCheckBillModal" @click.self="showCheckBillModal = false" class="z-50 fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg animate-fade-in">
          <div class="flex justify-between items-center mb-6">
              <h3 class="text-2xl font-bold">เลือกโต๊ะเพื่อเช็คบิล</h3>
              <button @click="showCheckBillModal = false" class="text-gray-400 hover:text-gray-600">
                  <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
          </div>
          <div v-if="isLoadingActiveTables" class="text-center p-8">
              <p>กำลังโหลดข้อมูลโต๊ะ...</p>
          </div>
          <div v-else-if="activeTables.length === 0" class="text-center p-8 bg-slate-50 rounded-lg">
              <p class="text-slate-500">ไม่มีโต๊ะที่กำลังใช้งาน</p>
          </div>
          <div v-else class="grid grid-cols-3 sm:grid-cols-4 gap-3">
              <button v-for="table in activeTables" :key="table.table_number" @click="loadOrderForTable(table.table_number)" class="p-4 rounded-lg border-2 text-center transition-all bg-slate-50 hover:bg-orange-100 hover:border-orange-400">
                  <span class="block text-xl font-bold">โต๊ะ {{ table.table_number }}</span>
                  <span class="block text-sm text-slate-600">{{ table.total_amount }} บาท</span>
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
          <header class="mb-8 flex justify-between items-center">
            <div class="text-left p-2 -m-2">
                <h1 class="text-4xl font-bold text-slate-700">
                  <span v-if="tableNumber">โต๊ะ {{ tableNumber }}</span>
                  <span v-else class="text-gray-400">สั่งอาหาร</span>
                </h1>
                <p class="text-slate-500 mt-1">
                  <span v-if="tableNumber">ออเดอร์สำหรับโต๊ะ {{ tableNumber }}</span>
                  <span v-else>กรุณาเลือกรายการและยืนยันเพื่อเลือกโต๊ะ</span>
                </p>
            </div>
            <button @click="openCheckBillModal" class="bg-orange-500 text-white font-bold py-3 px-5 rounded-lg shadow-md hover:bg-orange-600 transition-all flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
                </svg>
                เช็คบิล
            </button>
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
            <h2 class="text-xl font-semibold text-slate-700 border-b pb-3 mb-4">3. เพิ่มหมายเหตุ (ถ้ามี)</h2>
            <div v-if="showNotes" class="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
              <template v-if="showAllNotes">
                <button v-for="option in extraOptions" :key="option" @click="toggleOption(option)" class="p-4 rounded-lg border-2 transition-all" :class="{'bg-amber-400 border-amber-500 text-white scale-105 shadow-md': selectedOptions.includes(option), 'bg-slate-50 hover:border-amber-500': !selectedOptions.includes(option) }">
                  {{ option }}
                </button>
              </template>
              <template v-else>
                 <button v-for="option in initialNotes" :key="option" @click="toggleOption(option)" class="p-4 rounded-lg border-2 transition-all" :class="{'bg-amber-400 border-amber-500 text-white scale-105 shadow-md': selectedOptions.includes(option), 'bg-slate-50 hover:border-amber-500': !selectedOptions.includes(option) }">
                  {{ option }}
                </button>
                <button v-if="extraOptions.length > 5" @click="showAllNotes = true" class="p-4 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 bg-slate-50 hover:border-slate-400 hover:text-slate-700 transition-all">
                  ... ดูทั้งหมด
                </button>
              </template>
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
                <button v-for="item in otherMenuItems" :key="item.name" @click="addOtherItem(item)" class="p-4 rounded-lg border-2 text-center bg-white hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm">
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>
                 </button>
              </div>
            </div>
          </div>
          <div v-if="order.length > 0" class="border-t mt-6 pt-4">
            <div class="flex justify-between items-center text-xl font-bold">
              <span>รวมทั้งหมด:</span>
              <span>{{ totalPrice }} บาท</span>
            </div>
            <button @click="handleOrderSubmission" :disabled="isSubmitting" class="w-full bg-blue-500 text-white font-bold py-3 mt-4 rounded-lg hover:bg-blue-600 transition-all disabled:bg-slate-400 disabled:cursor-wait">
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
</style>