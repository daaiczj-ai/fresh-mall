<template>

  <div>

    <el-card>

      <div class="toolbar">

        <el-input v-model="keyword" placeholder="搜索商品" style="width:200px" clearable @clear="loadData" />

        <el-button type="primary" @click="loadData">搜索</el-button>

        <el-button type="success" @click="openDialog()">新增商品</el-button>

      </div>



      <el-table :data="list" stripe style="margin-top:16px">

        <el-table-column prop="id" label="ID" width="60" />

        <el-table-column label="图片" width="70">

          <template #default="{ row }">

            <el-image :src="resolveImage(row.cover)" style="width:50px;height:50px" fit="cover" />

          </template>

        </el-table-column>

        <el-table-column prop="name" label="商品名称" min-width="150" />

        <el-table-column prop="category.name" label="分类" width="100" />

        <el-table-column prop="price" label="价格" width="80" />

        <el-table-column prop="stock" label="库存" width="80">

          <template #default="{ row }">

            <span :style="{ color: row.stock <= 10 ? '#E74C3C' : '' }">{{ row.stock }}</span>

          </template>

        </el-table-column>

        <el-table-column prop="sales" label="销量" width="80" />

        <el-table-column label="首页" width="140">

          <template #default="{ row }">

            <el-tag v-if="row.is_hot" size="small" type="danger" style="margin-right:4px">热销</el-tag>

            <el-tag v-if="row.is_new" size="small" type="success" style="margin-right:4px">新品</el-tag>

            <el-tag v-if="row.is_recommend" size="small" type="warning">推荐</el-tag>

          </template>

        </el-table-column>

        <el-table-column prop="product_type" label="类型" width="80">

          <template #default="{ row }">{{ { normal: '普通', sku: '多规格', weight: '称重' }[row.product_type] }}</template>

        </el-table-column>

        <el-table-column prop="status" label="状态" width="80">

          <template #default="{ row }"><el-tag :type="row.status ? 'success' : 'info'">{{ row.status ? '上架' : '下架' }}</el-tag></template>

        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">

          <template #default="{ row }">

            <el-button size="small" @click="openDialog(row)">编辑</el-button>

            <el-button size="small" type="danger" @click="handleDelete(row)">下架</el-button>

          </template>

        </el-table-column>

      </el-table>



      <el-pagination class="pagination" v-model:current-page="page" :page-size="20" :total="total" @current-change="loadData" layout="total, prev, pager, next" />

    </el-card>



    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑商品' : '新增商品'" width="720px">

      <el-form :model="form" label-width="90px">

        <el-form-item label="封面图">
          <ImageUpload v-model="form.cover" :size="120" />
        </el-form-item>

        <el-form-item label="商品图集">
          <ImageListUpload v-model="form.images" :size="100" />
        </el-form-item>

        <el-form-item label="名称"><el-input v-model="form.name" /></el-form-item>

        <el-form-item label="分类">

          <el-select v-model="form.category_id"><el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" /></el-select>

        </el-form-item>

        <el-form-item :label="form.product_type === 'weight' ? '单价(元/斤)' : '价格'"><el-input-number v-model="form.price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="原价"><el-input-number v-model="form.original_price" :min="0" :precision="2" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="form.stock" :min="0" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="form.unit" :placeholder="form.product_type === 'weight' ? '斤' : '份'" /></el-form-item>
        <template v-if="form.product_type === 'weight'">
          <el-form-item label="起售重量(g)"><el-input-number v-model="form.min_weight" :min="50" :step="50" /></el-form-item>
          <el-form-item label="重量步进(g)"><el-input-number v-model="form.weight_step" :min="10" :step="10" /></el-form-item>
        </template>

        <el-form-item label="类型">

          <el-select v-model="form.product_type">

            <el-option label="普通商品" value="normal" /><el-option label="多规格" value="sku" /><el-option label="称重" value="weight" />

          </el-select>

        </el-form-item>

        <el-form-item label="副标题"><el-input v-model="form.subtitle" /></el-form-item>

        <el-form-item label="排序"><el-input-number v-model="form.sort" :min="0" /></el-form-item>

        <el-form-item label="首页展示">

          <el-checkbox v-model="form.is_hot">热销推荐</el-checkbox>

          <el-checkbox v-model="form.is_new">新品上市</el-checkbox>

          <el-checkbox v-model="form.is_recommend">为你推荐</el-checkbox>

        </el-form-item>

      </el-form>

      <template #footer>

        <el-button @click="dialogVisible = false">取消</el-button>

        <el-button type="primary" @click="handleSave">保存</el-button>

      </template>

    </el-dialog>

  </div>

</template>



<script setup>

import { ref, onMounted } from 'vue';

import { ElMessage, ElMessageBox } from 'element-plus';

import request from '../utils/request';

import { resolveImage } from '../utils/image';

import ImageUpload from '../components/ImageUpload.vue';
import ImageListUpload from '../components/ImageListUpload.vue';



const list = ref([]);

const categories = ref([]);

const keyword = ref('');

const page = ref(1);

const total = ref(0);

const dialogVisible = ref(false);

const form = ref({});



onMounted(() => { loadData(); loadCategories(); });



async function loadData() {

  const res = await request.get('/products', { params: { keyword: keyword.value, page: page.value } });

  list.value = res.list;

  total.value = res.total;

}



async function loadCategories() {

  categories.value = await request.get('/categories');

}



function openDialog(row) {
  form.value = row
    ? {
        ...row,
        images: Array.isArray(row.images) ? [...row.images] : []
      }
    : {
        name: '', category_id: categories.value[0]?.id || 1, price: 0, original_price: 0,
        stock: 0, unit: '份', product_type: 'normal', status: 1, cover: '', images: [],
        is_hot: false, is_new: false, is_recommend: false, sort: 0
      };
  dialogVisible.value = true;
}

async function handleSave() {
  if (form.value.product_type === 'weight') {
    form.value.price_per_unit = form.value.price;
    form.value.unit = form.value.unit || '斤';
    form.value.min_weight = form.value.min_weight || 250;
    form.value.weight_step = form.value.weight_step || 50;
  }
  if (!form.value.cover && form.value.images?.length) {
    form.value.cover = form.value.images[0];
  }
  form.value.images = (form.value.images || []).filter(Boolean);

  if (form.value.id) await request.put(`/products/${form.value.id}`, form.value);
  else await request.post('/products', form.value);

  ElMessage.success('保存成功');

  dialogVisible.value = false;

  loadData();

}



async function handleDelete(row) {

  await ElMessageBox.confirm('确定下架该商品？');

  await request.delete(`/products/${row.id}`);

  ElMessage.success('已下架');

  loadData();

}

</script>



<style scoped>

.toolbar { display: flex; gap: 12px; }

.pagination { margin-top: 16px; justify-content: flex-end; }

</style>

