<script setup>
import { ref, onMounted, watch, computed } from 'vue'

// --- การตั้งค่า ---
const config = useRuntimeConfig();
const API_URL = config.public.apiUrl; // <-- ดึงค่ามาจาก ENV ผ่าน runtimeConfig
const summaryData = ref(null);
const isLoading = ref(true);
const error = ref(null);

const today = new Date().toISOString().split('T')[0];
const startDate = ref(today);
const endDate = ref(today);

// --- State ใหม่สำหรับเก็บข้อมูลรายจ่าย (เหมือนเดิม) ---
const expenseData = ref(null);

// --- 1. State ใหม่สำหรับจัดการ Modal ---
const selectedImage = ref(null); // จะเก็บ URL ของรูปภาพที่ถูกเลือก

// --- ฟังก์ชันดึงข้อมูล (อัปเดตแล้ว) ---
async function fetchAllData() {
  isLoading.value = true;
  error.value = null;
  
  try {
    const [summaryResponse, expenseResponse] = await Promise.all([
      fetch(`${API_URL}/dashboard/summary?start_date=${startDate.value}&end_date=${endDate.value}`),
      // ✅  แก้ไขตรงนี้: เพิ่ม start_date และ end_date เข้าไปใน request ของ expense
      fetch(`${API_URL}/transactions/expense?start_date=${startDate.value}&end_date=${endDate.value}`) 
    ]);

    if (!summaryResponse.ok) throw new Error('ไม่สามารถดึงข้อมูลสรุปยอดขายได้');
    if (!expenseResponse.ok) throw new Error('ไม่สามารถดึงข้อมูลรายจ่ายได้');
    
    const summaryJson = await summaryResponse.json();
    const expenseJson = await expenseResponse.json();

    summaryData.value = summaryJson;
    // API ของ expense อาจจะส่งข้อมูลกลับมาในรูปแบบ { data: [...] } เหมือน API อื่นๆ
    // ถ้าข้อมูลไม่ขึ้น ให้ลองตรวจสอบโครงสร้าง JSON ที่ได้กลับมา
    expenseData.value = Array.isArray(expenseJson) ? expenseJson : expenseJson.data;


  } catch (err) {
    console.error("Error fetching data:", err);
    error.value = err.message;
    summaryData.value = null;
    expenseData.value = null;
  } finally {
    isLoading.value = false;
  }
}

// --- Computed Property (เหมือนเดิม) ---
const totalExpense = computed(() => {
  if (!expenseData.value || !Array.isArray(expenseData.value) || expenseData.value.length === 0) return 0;
  return expenseData.value.reduce((total, item) => total + item.amount, 0);
});

onMounted(fetchAllData);
watch([startDate, endDate], fetchAllData);

// --- ฟังก์ชัน Helpers (เหมือนเดิม) ---
function formatCurrency(value) {
  if (value === null || value === undefined) return '฿0';
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('th-TH', {
    year: '2-digit', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }).format(date);
}

// --- 2. ฟังก์ชันสำหรับเปิด-ปิด Modal ---
function showImageModal(imagePath) {
  if (!imagePath) return;
  // ดึงเอาเฉพาะชื่อไฟล์จาก path เต็มๆ ที่ API ส่งมา
  // เช่น "saved_images/file.jpg" หรือ "saved_images\file.jpg" -> "file.jpg"
  const filename = imagePath.split(/[\\/]/).pop();
  
  // สร้าง URL เต็มเพื่อเรียกไปที่ endpoint /images/<filename>
  selectedImage.value = `${API_URL}/images/${filename}`;
}

function closeImageModal() {
  selectedImage.value = null;
}
</script>

<template>
  <main class="bg-gray-100 min-h-screen">
    <div class="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header class="mb-8 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard สรุปยอด</h1>
          <p class="text-gray-500">ภาพรวมยอดขายและรายจ่ายตามช่วงวันที่ที่เลือก</p>
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

      <div v-if="isLoading" class="text-center py-20">
        <p class="text-lg text-gray-500 animate-pulse">กำลังประมวลผลข้อมูล...</p>
      </div>
      <div v-else-if="error" class="text-center py-10 bg-red-50 p-6 rounded-lg">
        <p class="text-lg text-red-700">⚠️ เกิดข้อผิดพลาด: {{ error }}</p>
      </div>

      <div v-else-if="summaryData && expenseData">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-8 rounded-xl shadow-lg">
                <h2 class="text-lg font-medium opacity-80">รายรับจากยอดขาย (ชำระแล้ว)</h2>
                <p class="text-5xl font-extrabold mt-2">{{ formatCurrency(summaryData.total_revenue) }}</p>
            </div>
            <div class="bg-gradient-to-r from-red-500 to-orange-500 text-white p-8 rounded-xl shadow-lg">
                <h2 class="text-lg font-medium opacity-80">รายจ่ายอื่นๆ (จาก LINE)</h2>
                <p class="text-5xl font-extrabold mt-2">{{ formatCurrency(totalExpense) }}</p>
            </div>
        </div>
        
        <div class="mb-10">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">สรุปยอดตามเจ้าของ</h2>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div 
                    v-for="(ownerData, ownerName) in summaryData.owner_summary" 
                    :key="ownerName"
                    class="bg-white p-6 rounded-xl shadow-md"
                >
                    <div class="flex justify-between items-baseline border-b pb-3 mb-4">
                    <h3 class="text-xl font-bold text-gray-800">{{ ownerName }}</h3>
                    <p class="text-xl font-bold text-green-600">{{ formatCurrency(ownerData.total) }}</p>
                    </div>
                    
                    <ul v-if="ownerData.items.length > 0" class="space-y-3">
                    <li v-for="item in ownerData.items" :key="item.name" class="flex justify-between items-center text-sm">
                        <span class="font-semibold text-gray-700">{{ item.name }}</span>
                        <div class="text-right">
                        <span class="font-bold text-blue-600">{{ item.quantity }} รายการ</span>
                        <span class="text-gray-500 ml-3">{{ formatCurrency(item.total) }}</span>
                        </div>
                    </li>
                    </ul>
                    <p v-else class="text-gray-500">ไม่พบข้อมูลการขาย</p>
                </div>
            </div>
        </div>
        <h2 class="text-2xl font-bold text-gray-800 mb-4 pt-4 border-t">รายละเอียดเพิ่มเติม</h2>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

        <div class="mt-10 bg-white p-6 rounded-xl shadow-md">
            <h3 class="text-2xl font-bold text-gray-800 mb-4">รายละเอียดรายจ่ายอื่นๆ (จาก LINE)</h3>
            <div class="overflow-x-auto">
                <table v-if="expenseData.length > 0" class="w-full text-sm text-left text-gray-500">
                    <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3">วันที่ / เวลา</th>
                            <th scope="col" class="px-6 py-3">ผู้บันทึก</th>
                            <th scope="col" class="px-6 py-3 text-right">จำนวนเงิน</th>
                            <th scope="col" class="px-6 py-3 text-center">รูปภาพ</th> </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in expenseData" :key="item.id" class="bg-white border-b hover:bg-gray-50">
                            <td class="px-6 py-4">{{ formatDateTime(item.created_at) }}</td>
                            <td class="px-6 py-4 font-medium text-gray-900">{{ item.display_name }}</td>
                            <td class="px-6 py-4 text-right font-semibold text-red-600">{{ formatCurrency(item.amount) }}</td>
                            <td class="px-6 py-4 text-center">
                                <button 
                                v-if="item.image_path"
                                @click="showImageModal(item.image_path)"
                                class="text-blue-600 hover:text-blue-800 transition-colors"
                                title="ดูรูปภาพ"
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                                </button>
                                <span v-else class="text-gray-400">-</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p v-else class="text-gray-500 text-center py-4">ไม่พบข้อมูลรายจ่ายในช่วงเวลานี้</p>
            </div>
        </div>
      </div>
      
      <div class="mt-8 text-center">
        <NuxtLink to="/" class="bg-white text-gray-700 font-bold py-3 px-6 rounded-lg shadow-sm hover:bg-gray-100 border border-gray-300 transition-all">
          กลับหน้าหลัก
        </NuxtLink>
      </div>
    </div>

    <div v-if="selectedImage" @click="closeImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300">
      <div @click.stop class="relative bg-white p-2 rounded-lg shadow-xl max-w-lg w-full">
        <button @click="closeImageModal" class="absolute -top-4 -right-4 bg-white text-black rounded-full h-9 w-9 flex items-center justify-center font-bold text-xl z-10 shadow-lg">&times;</button>
        <img :src="selectedImage" alt="ใบเสร็จ" class="max-w-full max-h-[85vh] object-contain rounded mx-auto">
      </div>
    </div>

  </main>
</template>