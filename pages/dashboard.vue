<script setup>
import { ref, onMounted, watch } from 'vue'

const API_URL = 'https://tx9j0chj-5001.asse.devtunnels.ms';
const summaryData = ref(null);
const isLoading = ref(true);
const error = ref(null);

// ตั้งค่า Default เป็นวันที่ปัจจุบัน
const today = new Date().toISOString().split('T')[0];
const startDate = ref(today);
const endDate = ref(today);

async function fetchDashboardData() {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await fetch(`${API_URL}/dashboard/summary?start_date=${startDate.value}&end_date=${endDate.value}`);
    if (!response.ok) {
      throw new Error('ไม่สามารถดึงข้อมูลสรุปยอดขายได้');
    }
    summaryData.value = await response.json();
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    error.value = err.message;
    summaryData.value = null;
  } finally {
    isLoading.value = false;
  }
}

// ดึงข้อมูลเมื่อเปิดหน้า และเมื่อวันที่เปลี่ยนแปลง
onMounted(fetchDashboardData);
watch([startDate, endDate], fetchDashboardData);

function formatCurrency(value) {
  if (value === null || value === undefined) return '฿0.00';
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(value);
}
</script>

<template>
  <main class="bg-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <!-- Header and Date Filters -->
      <header class="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard สรุปยอดขาย</h1>
          <p class="text-gray-500">ภาพรวมยอดขายตามช่วงวันที่ที่เลือก</p>
        </div>
        <div class="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm border">
          <div class="flex items-center gap-2">
            <label for="start-date" class="font-semibold text-gray-700 text-sm">จาก:</label>
            <input type="date" id="start-date" v-model="startDate" class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>
          <div class="flex items-center gap-2">
            <label for="end-date" class="font-semibold text-gray-700 text-sm">ถึง:</label>
            <input type="date" id="end-date" v-model="endDate" class="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>
        </div>
      </header>

      <!-- Loading and Error States -->
      <div v-if="isLoading" class="text-center py-20">
        <p class="text-lg text-gray-500 animate-pulse">กำลังประมวลผลข้อมูล...</p>
      </div>
      <div v-else-if="error" class="text-center py-10 bg-red-50 p-6 rounded-lg">
        <p class="text-lg text-red-700">⚠️ เกิดข้อผิดพลาด: {{ error }}</p>
      </div>

      <!-- Dashboard Content -->
      <div v-else-if="summaryData">
        <!-- Total Revenue Card -->
        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-xl shadow-lg mb-8">
          <h2 class="text-lg font-medium opacity-80">รายรับทั้งหมด (ที่ชำระแล้ว)</h2>
          <p class="text-5xl font-extrabold mt-2">{{ formatCurrency(summaryData.total_revenue) }}</p>
        </div>

        <!-- Sales Breakdown Grids -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Noodle Bowl Sizes -->
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">ยอดขายตามขนาดชาม</h3>
            <ul v-if="summaryData.size_sales.length > 0" class="space-y-3">
              <li v-for="item in summaryData.size_sales" :key="item.name" class="flex justify-between items-center text-sm">
                <span class="font-semibold text-gray-700">{{ item.name }}</span>
                <div class="text-right">
                  <span class="font-bold text-blue-600">{{ item.quantity }} ชาม</span>
                  <span class="text-gray-500 ml-3">{{ formatCurrency(item.total) }}</span>
                </div>
              </li>
            </ul>
            <p v-else class="text-gray-500">ไม่พบข้อมูล</p>
          </div>

          <!-- Noodle Types -->
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">ยอดขายตามประเภทเส้น</h3>
            <ul v-if="summaryData.noodle_type_sales.length > 0" class="space-y-3">
              <li v-for="item in summaryData.noodle_type_sales" :key="item.name" class="flex justify-between items-center text-sm">
                <span class="font-semibold text-gray-700">{{ item.name }}</span>
                 <div class="text-right">
                  <span class="font-bold text-blue-600">{{ item.quantity }} ชาม</span>
                  <span class="text-gray-500 ml-3">{{ formatCurrency(item.total) }}</span>
                </div>
              </li>
            </ul>
             <p v-else class="text-gray-500">ไม่พบข้อมูล</p>
          </div>

          <!-- Other Menu Items -->
          <div class="bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-xl font-bold text-gray-800 border-b pb-3 mb-4">ยอดขายเมนูอื่นๆ</h3>
            <ul v-if="summaryData.item_sales.length > 0" class="space-y-3">
              <li v-for="item in summaryData.item_sales" :key="item.name" class="flex justify-between items-center text-sm">
                <span class="font-semibold text-gray-700">{{ item.name }}</span>
                 <div class="text-right">
                  <span class="font-bold text-blue-600">{{ item.quantity }} รายการ</span>
                  <span class="text-gray-500 ml-3">{{ formatCurrency(item.total) }}</span>
                </div>
              </li>
            </ul>
             <p v-else class="text-gray-500">ไม่พบข้อมูล</p>
          </div>

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
