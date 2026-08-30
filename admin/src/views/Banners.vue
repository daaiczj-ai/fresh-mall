<template>
  <el-card>
    <el-button type="success" @click="openDialog()" style="margin-bottom:16px">新增轮播图</el-button>

    <el-table :data="list" stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="图片" width="120">
        <template #default="{ row }">
          <el-image :src="resolveImage(row.image)" style="width:100px;height:50px" fit="cover" />
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="120" />
      <el-table-column prop="link_type" label="跳转类型" width="100">
        <template #default="{ row }">{{ linkTypeMap[row.link_type] || row.link_type }}</template>
      </el-table-column>
      <el-table-column prop="link_value" label="跳转值" width="120" />
      <el-table-column prop="sort" label="排序" width="70" />
      <el-table-column prop="status" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="visible" :title="form.id ? '编辑轮播图' : '新增轮播图'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="可选" /></el-form-item>
        <el-form-item label="图片" required>
          <ImageUpload v-model="form.image" :size="160" />
        </el-form-item>
        <el-form-item label="跳转类型">
          <el-select v-model="form.link_type">
            <el-option label="无" value="none" />
            <el-option label="商品" value="product" />
            <el-option label="分类" value="category" />
            <el-option label="外链" value="url" />
          </el-select>
        </el-form-item>
        <el-form-item label="跳转值">
          <el-input v-model="form.link_value" placeholder="商品ID / 分类ID / 链接地址" />
        </el-form-item>
        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" />
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
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import { resolveImage } from '../utils/image';
import ImageUpload from '../components/ImageUpload.vue';

const list = ref([]);
const visible = ref(false);
const form = ref({});

const linkTypeMap = { none: '无', product: '商品', category: '分类', url: '外链' };

onMounted(loadData);

async function loadData() {
  list.value = await request.get('/banners');
}

function openDialog(row) {
  form.value = row
    ? { ...row }
    : { title: '', image: '', link_type: 'none', link_value: '', sort: 0, status: 1 };
  visible.value = true;
}

async function save() {
  if (!form.value.image) return ElMessage.warning('请上传图片');
  await request.post('/banners', form.value);
  ElMessage.success('保存成功');
  visible.value = false;
  loadData();
}

async function handleDelete(row) {
  await ElMessageBox.confirm('确定删除该轮播图？');
  await request.delete(`/banners/${row.id}`);
  ElMessage.success('已删除');
  loadData();
}
</script>
