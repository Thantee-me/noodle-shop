<script setup>
// No script logic needed for this static menu page
</script>

<template>
  <main class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-4xl">
      <header class="text-center mb-10">
        <h1 class="text-5xl font-extrabold text-gray-800">ระบบจัดการร้านก๋วยเตี๋ยว</h1>
        <p class="text-gray-500 mt-2">เลือกรายการที่ต้องการจัดการ</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- สั่งอาหาร -->
        <NuxtLink to="/order" class="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
          <div class="bg-blue-100 text-blue-600 rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">สั่งอาหาร / เช็คบิล</h2>
          <p class="text-gray-500 mt-1 text-sm">รับออเดอร์ลูกค้าและจัดการโต๊ะ</p>
        </NuxtLink>

        <!-- รายการในครัว -->
        <!-- <NuxtLink to="/kitchendisplay" class="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
          <div class="bg-yellow-100 text-yellow-600 rounded-full p-4 mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">จอรายการในครัว</h2>
          <p class="text-gray-500 mt-1 text-sm">แสดงออเดอร์สำหรับพ่อครัว</p>
        </NuxtLink> -->

        <!-- Dashboard -->
        <NuxtLink to="/dashboard" class="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
          <div class="bg-green-100 text-green-600 rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">Dashboard</h2>
          <p class="text-gray-500 mt-1 text-sm">สรุปยอดขายและข้อมูลเชิงลึก</p>
        </NuxtLink>

        <!-- ประวัติการสั่งซื้อ -->
        <NuxtLink to="/history" class="group bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center">
          <div class="bg-indigo-100 text-indigo-600 rounded-full p-4 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-gray-800">ประวัติออเดอร์</h2>
          <p class="text-gray-500 mt-1 text-sm">ดูรายการบิลย้อนหลังทั้งหมด</p>
        </NuxtLink>

      </div>
    </div>
  </main>
</template>
