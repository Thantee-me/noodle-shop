<script setup>
import { ref, onMounted, computed } from 'vue'

const API_URL = 'https://tx9j0chj-5001.asse.devtunnels.ms';
const route = useRoute();
const orderId = route.params.id;
const order = ref(null);
const isLoading = ref(true);
const error = ref(null);

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

onMounted(fetchOrderDetails);

const totalPrice = computed(() => {
    if (!order.value || !order.value.items) return 0;
    return order.value.items.reduce((sum, item) => sum + item.sub_total, 0);
});

function getStatusClass(status) {
  switch (status) {
    case 'billed': return 'bg-green-100 text-green-800';
    case 'open': return 'bg-blue-100 text-blue-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function formatDateTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}
</script>

<template>
  <main class="bg-gray-50 min-h-screen p-4 sm:p-8">
    <div class="max-w-3xl mx-auto">
      <div v-if="isLoading" class="text-center py-10">
        <p class="text-lg text-gray-500 animate-pulse">กำลังโหลดข้อมูลออเดอร์...</p>
      </div>
      <div v-else-if="error" class="text-center py-10 bg-red-50 p-6 rounded-lg">
        <p class="text-lg text-red-700">⚠️ เกิดข้อผิดพลาด: {{ error }}</p>
      </div>
      
      <div v-else-if="order" class="bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <header class="border-b border-gray-200 pb-6 mb-6">
          <div class="flex justify-between items-start">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">รายละเอียดบิล: {{ order.order_code }}</h1>
              <p class="text-lg text-gray-600 font-semibold">โต๊ะ {{ order.table_number }}</p>
            </div>
            <span :class="getStatusClass(order.status)" class="px-4 py-1.5 text-sm font-bold rounded-full">
              {{ order.status }}
            </span>
          </div>
          <p class="text-sm text-gray-500 mt-2">วันที่: {{ formatDateTime(order.order_timestamp) }}</p>
        </header>

        <div>
          <h2 class="text-xl font-semibold mb-4 text-gray-700">รายการอาหาร</h2>
          <div class="space-y-3">
            <div v-for="item in order.items" :key="item.order_item_id" class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p class="font-semibold text-gray-800">
                    {{ item.noodle_type || item.menu_name }}
                    <span v-if="item.size" class="text-sm text-gray-600">({{ item.size }})</span>
                    <span class="font-bold text-blue-600"> x {{ item.quantity }}</span>
                </p>
                <div v-if="item.item_notes && item.item_notes.length > 0" class="text-xs text-orange-600 pl-2">
                    * {{ item.item_notes.join(', ') }}
                </div>
              </div>
              <p class="font-semibold text-gray-900">{{ item.sub_total.toFixed(2) }} บาท</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 mt-6 pt-6">
            <div class="flex justify-between items-center text-2xl font-bold text-gray-800">
                <span>ยอดรวมทั้งสิ้น:</span>
                <span>{{ order.total_amount.toFixed(2) }} บาท</span>
            </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <NuxtLink to="/history" class="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-300 transition-all">
          กลับไปหน้ารายงาน
        </NuxtLink>
      </div>
    </div>
  </main>
</template>
