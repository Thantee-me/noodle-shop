import { onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute();
const order = ref([]);
const tableNumber = ref(null);

// ฟังก์ชันนี้จะทำงานเมื่อหน้าถูกโหลดขึ้นมา
onMounted(async () => {
  const tableId = route.params.tableId; // ดึงหมายเลขโต๊ะจาก URL
  tableNumber.value = tableId;
  
  // ยิง API ไปดึงข้อมูลออเดอร์ของโต๊ะนี้
  const response = await fetch(`${API_URL}/orders/table/${tableId}`);
  const existingOrderData = await response.json();
  
  // นำข้อมูลที่ได้มาใส่ใน State ของเรา
  order.value = mapBackendDataToState(existingOrderData.items);
});