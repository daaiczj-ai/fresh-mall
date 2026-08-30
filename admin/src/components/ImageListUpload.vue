<template>
  <div class="image-list-upload">
    <div class="list">
      <div v-for="(url, index) in modelValue" :key="url + index" class="item">
        <img :src="resolveImage(url)" class="preview" />
        <div class="item-actions">
          <el-button size="small" circle :disabled="index === 0" @click="move(index, -1)">↑</el-button>
          <el-button size="small" circle :disabled="index === modelValue.length - 1" @click="move(index, 1)">↓</el-button>
          <el-button size="small" circle type="danger" @click="remove(index)">×</el-button>
        </div>
      </div>
      <el-upload
        v-if="modelValue.length < limit"
        class="uploader"
        :show-file-list="false"
        accept="image/*"
        :http-request="handleUpload"
        :disabled="uploading"
      >
        <el-icon class="uploader-icon"><Plus /></el-icon>
      </el-upload>
    </div>
    <div class="tip">最多 {{ limit }} 张，首张可作为封面参考</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { resolveImage } from '../utils/image';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  limit: { type: Number, default: 9 },
  size: { type: Number, default: 100 }
});

const emit = defineEmits(['update:modelValue']);

const uploading = ref(false);

function update(list) {
  emit('update:modelValue', list);
}

async function handleUpload({ file }) {
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token');
    const res = await axios.post('/api/admin/upload', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.data.code === 0) {
      update([...props.modelValue, res.data.data.url]);
      ElMessage.success('上传成功');
    } else {
      ElMessage.error(res.data.message || '上传失败');
    }
  } catch {
    ElMessage.error('上传失败');
  } finally {
    uploading.value = false;
  }
}

function remove(index) {
  const list = [...props.modelValue];
  list.splice(index, 1);
  update(list);
}

function move(index, step) {
  const list = [...props.modelValue];
  const target = index + step;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  update(list);
}
</script>

<style scoped>
.image-list-upload { width: 100%; }
.list { display: flex; flex-wrap: wrap; gap: 12px; }
.item {
  position: relative;
  width: v-bind('size + "px"');
  height: v-bind('size + "px"');
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #eee;
}
.preview { width: 100%; height: 100%; object-fit: cover; display: block; }
.item-actions {
  position: absolute; left: 0; right: 0; bottom: 0;
  display: flex; justify-content: center; gap: 4px;
  padding: 4px; background: rgba(0,0,0,0.45);
}
.uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: v-bind('size + "px"');
  height: v-bind('size + "px"');
  display: flex; align-items: center; justify-content: center;
}
.uploader :deep(.el-upload:hover) { border-color: #2ECC71; }
.uploader-icon { font-size: 28px; color: #8c939d; }
.tip { margin-top: 8px; color: #999; font-size: 12px; }
</style>
