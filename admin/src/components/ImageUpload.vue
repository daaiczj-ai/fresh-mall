<template>
  <div class="image-upload">
    <el-upload
      class="uploader"
      :show-file-list="false"
      accept="image/*"
      :http-request="handleUpload"
      :disabled="uploading"
    >
      <img v-if="modelValue" :src="previewUrl" class="preview" />
      <el-icon v-else class="uploader-icon"><Plus /></el-icon>
    </el-upload>
    <div v-if="modelValue" class="actions">
      <el-button size="small" type="danger" text @click="clear">清除</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';
import { resolveImage } from '../utils/image';

const props = defineProps({
  modelValue: { type: String, default: '' },
  size: { type: Number, default: 100 }
});

const emit = defineEmits(['update:modelValue']);

const uploading = ref(false);

const previewUrl = computed(() => resolveImage(props.modelValue));

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
      emit('update:modelValue', res.data.data.url);
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

function clear() {
  emit('update:modelValue', '');
}
</script>

<style scoped>
.image-upload { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 4px; }
.uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  overflow: hidden;
  width: v-bind('size + "px"');
  height: v-bind('size + "px"');
  display: flex;
  align-items: center;
  justify-content: center;
}
.uploader :deep(.el-upload:hover) { border-color: #2ECC71; }
.preview { width: 100%; height: 100%; object-fit: cover; }
.uploader-icon { font-size: 28px; color: #8c939d; }
</style>
