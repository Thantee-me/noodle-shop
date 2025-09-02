<script setup>
import { ref, onMounted, watch } from 'vue'

// --- การตั้งค่า State ---
const config = useRuntimeConfig();
const API_URL = config.public.apiUrl;

const orders = ref([]);
const pagination = ref(null);
const isLoading = ref(true);
const error = ref(null);

// --- State สำหรับ Filters ---
const selectedDate = ref(new Date().toISOString().split('T')[0]); // วันที่ปัจจุบัน
const selectedStatus = ref(''); // สถานะทั้งหมด
const searchQuery = ref(''); // คำค้นหา
const currentPage = ref(1); // หน้าปัจจุบัน

// --- ฟังก์ชันสำหรับดึงข้อมูลจาก API ---
async function fetchHistory() {
  isLoading.value = true;
  error.value = null;

  // สร้าง URL พร้อม query parameters สำหรับการกรอง
  const params = new URLSearchParams({
    date: selectedDate.value,
    page: currentPage.value,
    pageSize: 10 // หรือขนาดที่ต้องการ
  });
  if (selectedStatus.value) {
    params.append('status', selectedStatus.value);
  }
  if (searchQuery.value) {
    params.append('search', searchQuery.value);
  }

  try {
    const response = await fetch(`${API_URL}/orders/history?${params.toString()}`);
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลประวัติรายการได้');
    }
    const responseData = await response.json();
    orders.value = responseData.data;
    pagination.value = responseData.pagination;
  } catch (err) {
    console.error("Error fetching history:", err);
    error.value = err.message;
    orders.value = [];
    pagination.value = null;
  } finally {
    isLoading.value = false;
  }
}

// --- Watchers สำหรับการกรองข้อมูลใหม่เมื่อค่าเปลี่ยน ---
watch([selectedDate, selectedStatus, searchQuery], () => {
  currentPage.value = 1; // กลับไปหน้า 1 เมื่อมีการกรองใหม่
  fetchHistory();
});

watch(currentPage, fetchHistory); // ดึงข้อมูลใหม่เมื่อเปลี่ยนหน้า

// --- เรียกใช้ฟังก์ชันเมื่อ Component ถูก Mount ---
onMounted(fetchHistory);

// --- ฟังก์ชันสำหรับ Pagination ---
function nextPage() {
  if (pagination.value && currentPage.value < pagination.value.totalPages) {
    currentPage.value++;
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
}

// --- ฟังก์ชัน Helpers สำหรับแสดงผล ---
function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '฿0.00';
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
}

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
</script>

<template>
  <div class="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">ประวัติรายการ</h1>

      <div class="bg-white p-4 rounded-lg shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
        <div>
          <label for="date" class="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
          <input type="date" id="date" v-model="selectedDate" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
        </div>
        <div>
          <label for="status" class="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
          <select id="status" v-model="selectedStatus" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
            <option value="">ทั้งหมด</option>
            <option value="open">Open</option>
            <option value="billed">Billed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label for="search" class="block text-sm font-medium text-gray-700 mb-1">ค้นหา (เลขที่บิล / โต๊ะ)</label>
          <input type="text" id="search" v-model="searchQuery" placeholder="ค้นหา..." class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500">
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div v-if="isLoading" class="text-center p-12 text-gray-500">
          กำลังโหลดข้อมูล...
        </div>
        <div v-else-if="error" class="text-center p-12 text-red-600">
          เกิดข้อผิดพลาด: {{ error }}
        </div>
        <div v-else-if="orders.length === 0" class="text-center p-12 text-gray-500">
          ไม่พบข้อมูล
        </div>
        <div v-else>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เลขที่บิล</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">โต๊ะ</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="order in orders" :key="order.order_id">
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{{ formatTime(order.order_timestamp) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ order.order_code }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ order.table_number }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="getStatusClass(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{{ formatCurrency(order.total_amount) }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <NuxtLink :to="`/history/${order.order_id}`" class="text-indigo-600 hover:text-indigo-800">
                      ดูรายละเอียด
                    </NuxtLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-if="pagination" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div class="text-sm text-gray-700">
              หน้าที่ {{ pagination.currentPage }} / {{ pagination.totalPages }} (รวม {{ pagination.totalItems }} รายการ)
            </div>
            <div class="flex gap-2">
              <button @click="prevPage" :disabled="currentPage === 1" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                ก่อนหน้า
              </button>
              <button @click="nextPage" :disabled="!pagination || currentPage === pagination.totalPages" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                ถัดไป
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>