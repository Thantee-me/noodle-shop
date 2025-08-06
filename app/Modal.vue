<script setup>
import { computed } from 'vue';

// รับค่า props จาก parent component เพื่อแสดงผล
const props = defineProps({
  show: Boolean,
  title: String,
  message: String,
  status: {
    type: String,
    default: 'success', // 'success', 'error', 'warning'
  },
});

// Event ที่จะส่งกลับไปหา parent component
const emit = defineEmits(['close']);

// Computed property สำหรับเปลี่ยนสีของไอคอนและปุ่มตามสถานะ
const statusClasses = computed(() => {
  switch (props.status) {
    case 'success':
      return { iconBg: 'bg-green-100', iconText: 'text-green-600', button: 'bg-green-600 hover:bg-green-700 focus:ring-green-500' };
    case 'error':
      return { iconBg: 'bg-red-100', iconText: 'text-red-600', button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500' };
    case 'warning':
      return { iconBg: 'bg-yellow-100', iconText: 'text-yellow-500', button: 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500' };
    default:
      return { iconBg: 'bg-gray-100', iconText: 'text-gray-600', button: 'bg-gray-600 hover:bg-gray-700 focus:ring-gray-500' };
  }
});
</script>

<template>
  <transition name="modal-fade">
    <div 
      v-if="show" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
      @click.self="emit('close')"
    >
      <div class="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-sm text-center transform transition-all scale-95 opacity-0 animate-scale-in">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full" :class="statusClasses.iconBg">
          <svg v-if="status === 'success'" :class="statusClasses.iconText" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
          <svg v-if="status === 'error'" :class="statusClasses.iconText" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          <svg v-if="status === 'warning'" :class="statusClasses.iconText" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
        </div>

        <h3 class="mt-5 text-xl font-semibold text-gray-900">{{ title }}</h3>
        <div class="mt-2">
          <p class="text-sm text-gray-600">{{ message }}</p>
        </div>

        <div class="mt-6">
          <button @click="emit('close')" type="button" class="w-full inline-flex justify-center rounded-lg border border-transparent px-4 py-2.5 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2" :class="statusClasses.button">
            ปิด
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style>
/* Animation สำหรับ Modal */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.animate-scale-in {
  animation: scale-in 0.3s ease-out forwards;
}
</style>