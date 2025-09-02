<script setup>
import { ref, onMounted } from 'vue'

const config = useRuntimeConfig();
const API_URL = config.public.apiUrl;
const route = useRoute();
const orderId = route.params.id;
const order = ref(null);
const isLoading = ref(true);
const error = ref(null);
const isPrinting = ref(false); // State ใหม่สำหรับจัดการสถานะการพิมพ์

async function fetchOrderDetails() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_URL}/order/by_id/${orderId}`);
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลออเดอร์นี้ได้');
    }
    order.value = await response.json();
  } catch (err) {
    console.error("Error fetching order details:", err);
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

// --- ฟังก์ชันใหม่สำหรับพิมพ์ใบเสร็จ ---
async function printReceipt() {
  if (!order.value) return;

  isPrinting.value = true;
  try {
    const response = await fetch(`${API_URL}/print/receipt_by_id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: order.value.order_id
      }),
    });

    if (!response.ok) {
      throw new Error('ส่งคำสั่งพิมพ์ไม่สำเร็จ');
    }

    const result = await response.json();
    console.log('Print success:', result);
    alert('ส่งคำสั่งพิมพ์ไปยังเครื่องพิมพ์สำเร็จ!');

  } catch (err) {
    console.error("Error printing receipt:", err);
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  } finally {
    isPrinting.value = false;
  }
}

onMounted(fetchOrderDetails);

function getStatusClass(status) {
  switch (status) {
    case 'billed': return 'bg-green-100 text-green-800';
    case 'open': return 'bg-blue-100 text-blue-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatFullDateTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  // ปรับ format ให้เหมือนในรูปตัวอย่าง
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: 'Asia/Bangkok'
  }).format(date).replace(' พ.ศ.', '');
}
</script>

<template>
  <main class="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
    <div class="max-w-6xl mx-auto">
        
      <div class="mb-6">
        <NuxtLink to="/history" class="text-gray-600 hover:text-gray-900 font-semibold inline-flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
          กลับไปหน้ารายงาน
        </NuxtLink>
      </div>

      <div v-if="isLoading" class="text-center py-20">
        <p class="text-lg text-gray-500 animate-pulse">กำลังโหลดข้อมูลออเดอร์...</p>
      </div>
      <div v-else-if="error" class="text-center py-20 bg-red-50 p-6 rounded-lg">
        <p class="text-lg text-red-700">⚠️ เกิดข้อผิดพลาด: {{ error }}</p>
      </div>
      
      <div v-else-if="order" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-1 space-y-8">
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">ข้อมูลบิล</h2>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-500">เลขที่:</span>
                <span class="font-semibold text-gray-800">{{ order.order_code }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">โต๊ะ:</span>
                <span class="font-semibold text-gray-800">{{ order.table_number }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">วันที่:</span>
                <span class="font-semibold text-gray-800 text-right">{{ formatFullDateTime(order.order_timestamp) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-500">สถานะ:</span>
                <span :class="getStatusClass(order.status)" class="px-3 py-1 text-xs font-bold rounded-full">
                  {{ order.status }}
                </span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow p-6">
             <h2 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">การทำงาน</h2>
             <button 
                @click="printReceipt" 
                :disabled="isPrinting"
                class="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-300 disabled:cursor-not-allowed"
             >
                <svg v-if="isPrinting" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v3a2 2 0 002 2h6a2 2 0 002-2v-3h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd" />
                </svg>
                <span v-if="isPrinting">กำลังส่งคำสั่ง...</span>
                <span v-else>พิมพ์ใบเสร็จ</span>
             </button>
          </div>
        </div>

        <div class="lg:col-span-2 bg-white rounded-xl shadow p-6">
            <h2 class="text-lg font-bold text-gray-800 border-b pb-3 mb-4">รายการอาหารและเครื่องดื่ม</h2>
            <div class="space-y-2">
              <div v-for="item in order.items" :key="item.order_item_id" class="flex justify-between items-center py-2">
                <p class="font-medium text-gray-700">
                  {{ item.noodle_type || item.menu_name }}
                  <span v-if="item.size" class="text-gray-500">({{ item.size }})</span>
                </p>
                <div class="flex items-center gap-6">
                    <span class="text-sm text-gray-500">x {{ item.quantity }}</span>
                    <span class="font-semibold text-gray-800 w-20 text-right">{{ item.sub_total.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <div class="border-t-2 border-dashed mt-4 pt-4">
                <div class="flex justify-between items-center text-xl font-bold text-blue-600">
                    <span>ยอดรวมทั้งสิ้น</span>
                    <span>฿{{ order.total_amount.toFixed(2) }}</span>
                </div>
            </div>
        </div>
      </div>

    </div>
  </main>
</template>