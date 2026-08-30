<template>
  <el-card>
    <el-button type="success" @click="openDialog()" style="margin-bottom:16px">新增门店</el-button>
    <el-table :data="list" stripe>
      <el-table-column prop="name" label="门店名称" />
      <el-table-column prop="address" label="地址" />
      <el-table-column prop="phone" label="电话" width="130" />
      <el-table-column prop="delivery_fee" label="配送费" width="80" />
      <el-table-column prop="free_delivery_amount" label="免配送门槛" width="110" />
      <el-table-column prop="business_hours" label="营业时间" width="130" />
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="门店" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.address" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.phone" /></el-form-item>
        <el-form-item label="配送费"><el-input-number v-model="form.delivery_fee" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="免配送门槛"><el-input-number v-model="form.free_delivery_amount" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="营业时间">
          <BusinessHoursPicker v-model="form.business_hours" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';
import BusinessHoursPicker from '../components/BusinessHoursPicker.vue';

const list = ref([]);
const visible = ref(false);
const form = ref({});

onMounted(loadData);

async function loadData() {
  list.value = await request.get('/stores');
}

function openDialog(row) {
  form.value = row
    ? { ...row }
    : { name: '', address: '', delivery_fee: 5, free_delivery_amount: 39, business_hours: '08:00-21:00', status: 1 };
  visible.value = true;
}

async function save() {
  await request.post('/stores', form.value);
  ElMessage.success('保存成功');
  visible.value = false;
  loadData();
}
</script>
