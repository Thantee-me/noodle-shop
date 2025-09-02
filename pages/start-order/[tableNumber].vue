<script setup>
import { ref, onMounted } from 'vue'

const config = useRuntimeConfig();
const API_URL = config.public.apiUrl; // <-- ดึงค่ามาจาก ENV ผ่าน runtimeConfig
const route = useRoute();
const tableNumber = route.params.tableNumber;
const errorMessage = ref('');
const isLoading = ref(true);

async function startOrderSession() {
  console.log('1. Starting order session for table:', tableNumber);
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const targetUrl = `${API_URL}/session/start/${tableNumber}`;
    console.log('2. Sending POST request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'POST',
    });

    console.log('3. Received response from server. Status:', response.status);

    const data = await response.json();
    if (!response.ok) {
      console.error('API Error Response:', data);
      throw new Error(data.error || 'ไม่สามารถเริ่ม Session การสั่งอาหารได้');
    }

    console.log('4. API call successful. Received data:', data);

    if (data.token) {
      const redirectUrl = `/table/${data.token}`;
      console.log('5. Token received. Redirecting to:', redirectUrl);
      await navigateTo(redirectUrl);
    } else {
      throw new Error('ไม่ได้รับ Token จากเซิร์ฟเวอร์');
    }

  } catch (error) {
    console.error("6. CATCH an error:", error);
    errorMessage.value = error.message;
  } finally {
    console.log('7. Process finished.');
    isLoading.value = false;
  }
}

onMounted(() => {
    console.log("555");
  startOrderSession();
});
</script>

<template>
  <div class="flex items-center justify-center min-h-screen text-center p-4 bg-slate-50">
    <div v-if="isLoading && !errorMessage">
      <h1 class="text-2xl font-bold text-slate-700">โต๊ะ {{ tableNumber }}</h1>
      <p class="text-lg text-slate-500 mt-2">กำลังเตรียมรายการอาหารให้คุณ...</p>
    </div>
    <div v-else-if="errorMessage">
        <h2 class="text-2xl font-bold text-red-600">เกิดข้อผิดพลาด</h2>
        <p class="text-lg text-red-500 mt-2">{{ errorMessage }}</p>
        <p class="text-slate-500 mt-4">กรุณาลองสแกน QR Code ใหม่อีกครั้ง หรือติดต่อพนักงาน</p>
    </div>
  </div>
</template>