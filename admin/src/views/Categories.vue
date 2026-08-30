<template>

  <el-card>

    <el-button type="success" @click="openDialog()" style="margin-bottom:16px">新增分类</el-button>

    <el-table :data="list" stripe>

      <el-table-column prop="id" label="ID" width="60" />

      <el-table-column label="图标" width="80">

        <template #default="{ row }">

          <el-image v-if="row.icon" :src="resolveImage(row.icon)" style="width:40px;height:40px" fit="cover" />

        </template>

      </el-table-column>

      <el-table-column prop="name" label="分类名称" />

      <el-table-column prop="sort" label="排序" width="80" />

      <el-table-column prop="status" label="状态" width="80">

        <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '禁用' }}</el-tag></template>

      </el-table-column>

      <el-table-column label="操作" width="120">

        <template #default="{ row }"><el-button size="small" @click="openDialog(row)">编辑</el-button></template>

      </el-table-column>

    </el-table>



    <el-dialog v-model="visible" :title="form.id ? '编辑' : '新增'" width="450px">

      <el-form :model="form" label-width="60px">

        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>

        <el-form-item label="图标">

          <ImageUpload v-model="form.icon" :size="80" />

        </el-form-item>

        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>

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

import { resolveImage } from '../utils/image';

import ImageUpload from '../components/ImageUpload.vue';



const list = ref([]);

const visible = ref(false);

const form = ref({});



onMounted(loadData);

async function loadData() { list.value = await request.get('/categories'); }

function openDialog(row) { form.value = row ? { ...row } : { name: '', icon: '', sort: 0, status: 1 }; visible.value = true; }

async function save() { await request.post('/categories', form.value); ElMessage.success('保存成功'); visible.value = false; loadData(); }

</script>

