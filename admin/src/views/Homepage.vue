<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="热销推荐" name="hot" />
      <el-tab-pane label="新品上市" name="new" />
      <el-tab-pane label="为你推荐" name="recommend" />
    </el-tabs>

    <el-card>
      <div class="toolbar">
        <span class="tip">拖拽排序或点击上下移动，保存后小程序首页生效</span>
        <div>
          <el-button type="primary" @click="openPicker">添加商品</el-button>
          <el-button type="success" :loading="saving" @click="saveSection">保存当前区块</el-button>
        </div>
      </div>

      <el-table :data="currentList" stripe style="margin-top:16px">
        <el-table-column label="排序" width="100">
          <template #default="{ $index }">
            <el-button size="small" :disabled="$index === 0" @click="moveUp($index)">↑</el-button>
            <el-button size="small" :disabled="$index === currentList.length - 1" @click="moveDown($index)">↓</el-button>
          </template>
        </el-table-column>
        <el-table-column label="图片" width="80">
          <template #default="{ row }">
            <el-image :src="resolveImage(row.cover)" style="width:50px;height:50px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" min-width="180" />
        <el-table-column prop="price" label="价格" width="90" />
        <el-table-column prop="category.name" label="分类" width="100" />
        <el-table-column label="操作" width="100">
          <template #default="{ $index }">
            <el-button size="small" type="danger" @click="removeItem($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!currentList.length" description="暂无商品，点击添加商品" />
    </el-card>

    <el-dialog v-model="pickerVisible" title="选择商品" width="700px">
      <div class="picker-toolbar">
        <el-input v-model="pickerKeyword" placeholder="搜索商品名称" style="width:220px" clearable @keyup.enter="searchProducts" />
        <el-button type="primary" @click="searchProducts">搜索</el-button>
      </div>
      <el-table :data="pickerList" stripe style="margin-top:12px" max-height="400" @selection-change="onPickerSelect">
        <el-table-column type="selection" width="50" :selectable="row => !isSelected(row.id)" />
        <el-table-column label="图片" width="70">
          <template #default="{ row }">
            <el-image :src="resolveImage(row.cover)" style="width:40px;height:40px" fit="cover" />
          </template>
        </el-table-column>
        <el-table-column prop="name" label="商品名称" />
        <el-table-column prop="price" label="价格" width="80" />
      </el-table>
      <template #footer>
        <el-button @click="pickerVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmPicker">添加选中</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';
import { resolveImage } from '../utils/image';

const activeTab = ref('hot');
const sections = ref({ hot: [], new: [], recommend: [] });
const saving = ref(false);

const pickerVisible = ref(false);
const pickerKeyword = ref('');
const pickerList = ref([]);
const pickerSelected = ref([]);

const currentList = computed(() => sections.value[activeTab.value] || []);

onMounted(loadData);
watch(activeTab, () => {});

async function loadData() {
  sections.value = await request.get('/home');
}

function isSelected(id) {
  return currentList.value.some(p => p.id === id);
}

function openPicker() {
  pickerKeyword.value = '';
  pickerSelected.value = [];
  pickerVisible.value = true;
  searchProducts();
}

async function searchProducts() {
  const res = await request.get('/products/search', { params: { keyword: pickerKeyword.value, pageSize: 50 } });
  pickerList.value = res.list;
}

function onPickerSelect(rows) {
  pickerSelected.value = rows;
}

function confirmPicker() {
  const existing = new Set(currentList.value.map(p => p.id));
  const toAdd = pickerSelected.value.filter(p => !existing.has(p.id));
  sections.value[activeTab.value] = [...currentList.value, ...toAdd];
  pickerVisible.value = false;
  ElMessage.success(`已添加 ${toAdd.length} 个商品`);
}

function removeItem(index) {
  sections.value[activeTab.value].splice(index, 1);
}

function moveUp(index) {
  const list = sections.value[activeTab.value];
  [list[index - 1], list[index]] = [list[index], list[index - 1]];
}

function moveDown(index) {
  const list = sections.value[activeTab.value];
  [list[index], list[index + 1]] = [list[index + 1], list[index]];
}

async function saveSection() {
  saving.value = true;
  try {
    await request.put('/home', {
      section: activeTab.value,
      productIds: currentList.value.map(p => p.id)
    });
    ElMessage.success('保存成功');
    loadData();
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.toolbar { display: flex; justify-content: space-between; align-items: center; }
.tip { color: #909399; font-size: 13px; }
.picker-toolbar { display: flex; gap: 12px; }
</style>
