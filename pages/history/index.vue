<script setup>
import { ref, onMounted, watch, computed } from 'vue'

const API_URL = 'https://tx9j0chj-5001.asse.devtunnels.ms';
const orders = ref([]);
const isLoading = ref(true);
const error = ref(null);
const selectedDate = ref(new Date().toISOString().split('T')[0]); // Default to today

async function fetchOrderHistory() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_URL}/orders/history?date=${selectedDate.value}`);
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลสรุปรายการได้');
    }
    orders.value = await response.json();
  } catch (err) {
    console.error("Error fetching order history:", err);
    error.value = err.message;
    orders.value = [];
  } finally {
    isLoading.value = false;
  }
}

// Fetch data when component is mounted and when the date changes
onMounted(fetchOrderHistory);
watch(selectedDate, fetchOrderHistory);

// --- Computed Properties for Summary ---
const summaryStats = computed(() => {
    const billedOrders = orders.value.filter(o => o.status === 'billed');
    const totalSales = billedOrders.reduce((sum, order) => sum + order.total_amount, 0);
    const billCount = billedOrders.length;
    const averageBill = billCount > 0 ? totalSales / billCount : 0;
    
    return {
        totalSales,
        billCount,
        averageBill,
        totalOrders: orders.value.length,
        cancelledCount: orders.value.filter(o => o.status === 'cancelled').length
    };
});


function getStatusClass(status) {
  switch (status) {
    case 'billed':
      return 'bg-green-100 text-green-800';
    case 'open':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '฿0.00';
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
}

function formatTime(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
</script>

<template>
  <main class="bg-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <header class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">รายงานสรุปยอดขาย</h1>
          <p class="text-gray-500">ภาพรวมรายการทั้งหมดในวันที่เลือก</p>
        </div>
        <div class="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm">
          <label for="order-date" class="font-semibold text-gray-700">เลือกวันที่:</label>
          <input type="date" id="order-date" v-model="selectedDate" class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
        </div>
      </header>

      <!-- Summary Cards -->
       <div v-if="!isLoading && !error" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
          <h2 class="text-sm font-medium text-gray-500">ยอดขายรวม (ที่ชำระแล้ว)</h2>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ formatCurrency(summaryStats.totalSales) }}</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
          <h2 class="text-sm font-medium text-gray-500">จำนวนบิล (ที่ชำระแล้ว)</h2>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ summaryStats.billCount }} บิล</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-500">
          <h2 class="text-sm font-medium text-gray-500">ยอดเฉลี่ยต่อบิล</h2>
          <p class="text-3xl font-bold text-gray-900 mt-1">{{ formatCurrency(summaryStats.averageBill) }}</p>
        </div>
      </div>

      <!-- Main Content: Table -->
      <div class="bg-white rounded-xl shadow-md overflow-hidden">
        <div v-if="isLoading" class="text-center py-20">
          <p class="text-lg text-gray-500 animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
        <div v-else-if="error" class="text-center py-20 px-6">
          <p class="text-lg text-red-700">⚠️ เกิดข้อผิดพลาด: {{ error }}</p>
        </div>
        <div v-else-if="orders.length === 0" class="text-center py-20 px-6">
          <p class="text-lg text-blue-700">ไม่พบรายการสำหรับวันที่ {{ selectedDate }}</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">เวลา</th>
                <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">เลขที่บิล</th>
                <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">โต๊ะ</th>
                <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="order in orders" :key="order.order_id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ formatTime(order.order_timestamp) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{{ order.order_code }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600 font-bold">{{ order.table_number }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <span :class="getStatusClass(order.status)" class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-800 font-semibold">{{ formatCurrency(order.total_amount) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <NuxtLink v-if="order.order_id" :to="`/history/${order.order_id}`" class="text-indigo-600 hover:text-indigo-900 font-semibold">ดูรายละเอียด</NuxtLink>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
       <div class="mt-8 text-center">
          <NuxtLink to="/" class="bg-white text-gray-700 font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-100 border border-gray-300 transition-all">
            กลับหน้าหลัก
          </NuxtLink>
        </div>
    </div>
  </main>
</template>
