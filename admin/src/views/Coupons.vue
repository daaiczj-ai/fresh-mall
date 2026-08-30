<template>
  <el-card>
    <el-button type="success" @click="openDialog()" style="margin-bottom:16px">新增优惠券</el-button>
    <el-table :data="list" stripe>
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="type" label="类型" width="100">
        <template #default="{ row }">{{ typeMap[row.type] }}</template>
      </el-table-column>
      <el-table-column prop="value" label="面值" width="80" />
      <el-table-column prop="min_amount" label="门槛" width="80" />
      <el-table-column prop="received_count" label="已领" width="60" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>
      </el-table-column>
      <el-table-column label="操作" width="100"><template #default="{ row }"><el-button size="small" @click="openDialog(row)">编辑</el-button></template></el-table-column>
    </el-table>

    <el-dialog v-model="visible" title="优惠券" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type">
            <el-option v-for="(l, k) in typeMap" :key="k" :label="l" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="面值"><el-input-number v-model="form.value" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="门槛"><el-input-number v-model="form.min_amount" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="form.description" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="visible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';
const list = ref([]); const visible = ref(false); const form = ref({});
const typeMap = { new_user: '新人券', full_reduce: '满减券', discount: '折扣券', product: '商品券', delivery: '配送券' };
onMounted(loadData);
async function loadData() { list.value = await request.get('/coupons'); }
function openDialog(row) { form.value = row ? { ...row } : { name: '', type: 'full_reduce', value: 0, min_amount: 0, status: 1 }; visible.value = true; }
async function save() { await request.post('/coupons', form.value); ElMessage.success('保存成功'); visible.value = false; loadData(); }
</script>
