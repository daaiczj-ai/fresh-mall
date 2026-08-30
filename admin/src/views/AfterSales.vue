<template>
  <el-card>
    <div class="toolbar">
      <el-select v-model="status" placeholder="售后状态" clearable @change="search" style="width:140px">
        <el-option v-for="(label, key) in AFTER_SALE_STATUS" :key="key" :label="label" :value="key" />
      </el-select>
      <el-button v-if="status" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="list" stripe style="margin-top:16px">
      <el-table-column prop="id" label="售后ID" width="72" />
      <el-table-column label="订单" min-width="200">
        <template #default="{ row }">
          <div class="order-no">{{ row.order?.order_no || `#${row.order_id}` }}</div>
          <div class="sub-text">订单ID：{{ row.order_id }}</div>
          <div v-if="row.order" class="sub-text">
            实付 ¥{{ row.order.pay_amount }}
            · {{ ORDER_STATUS[row.order.status] || row.order.status }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="用户" width="140">
        <template #default="{ row }">
          <div>{{ row.user?.nickname || '微信用户' }}</div>
          <div class="sub-text">{{ row.user?.phone || '-' }}</div>
        </template>
      </el-table-column>
      <el-table-column label="商品" min-width="160">
        <template #default="{ row }">
          <template v-if="row.order?.items?.length">
            <div v-for="item in row.order.items.slice(0, 2)" :key="item.id" class="goods-line">
              {{ item.product_name }}{{ item.sku_name ? `（${item.sku_name}）` : '' }}
            </div>
            <div v-if="row.order.items.length > 2" class="sub-text">等 {{ row.order.items.length }} 件商品</div>
          </template>
          <span v-else class="sub-text">-</span>
        </template>
      </el-table-column>
      <el-table-column label="类型" width="72">
        <template #default="{ row }">{{ AFTER_SALE_TYPE[row.type] }}</template>
      </el-table-column>
      <el-table-column prop="reason" label="原因" min-width="120" show-overflow-tooltip />
      <el-table-column label="退款" width="88">
        <template #default="{ row }"><span class="price">¥{{ row.refund_amount || '0.00' }}</span></template>
      </el-table-column>
      <el-table-column label="状态" width="88">
        <template #default="{ row }">
          <el-tag :type="AFTER_SALE_STATUS_TYPE[row.status]" size="small">{{ AFTER_SALE_STATUS[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openDetail(row)">详情</el-button>
          <template v-if="row.status === 'pending'">
            <el-button size="small" type="success" link @click="handle(row, 'approved')">通过</el-button>
            <el-button size="small" type="danger" link @click="handle(row, 'rejected')">拒绝</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      class="pagination"
      v-model:current-page="page"
      :page-size="20"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="loadData"
    />
  </el-card>

  <el-drawer v-model="drawerVisible" title="售后详情" size="640px" destroy-on-close>
    <div v-if="detail" class="detail-wrap">
      <div class="detail-header">
        <div>
          <div class="title">售后单 #{{ detail.id }}</div>
          <div class="sub-text">{{ formatDate(detail.created_at) }}</div>
        </div>
        <el-tag :type="AFTER_SALE_STATUS_TYPE[detail.status]" size="large">{{ AFTER_SALE_STATUS[detail.status] }}</el-tag>
      </div>

      <el-descriptions :column="2" border class="section" title="关联订单">
        <el-descriptions-item label="订单号" :span="2">{{ detail.order?.order_no || '-' }}</el-descriptions-item>
        <el-descriptions-item label="订单ID">{{ detail.order_id }}</el-descriptions-item>
        <el-descriptions-item label="订单状态">{{ ORDER_STATUS[detail.order?.status] || '-' }}</el-descriptions-item>
        <el-descriptions-item label="实付金额">¥{{ detail.order?.pay_amount || '-' }}</el-descriptions-item>
        <el-descriptions-item label="配送方式">{{ detail.order?.delivery_type === 'delivery' ? '配送' : '自提' }}</el-descriptions-item>
        <el-descriptions-item label="下单时间" :span="2">{{ formatDate(detail.order?.created_at) }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="2" border class="section" title="申请用户">
        <el-descriptions-item label="昵称">{{ detail.user?.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ detail.user?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detail.user_id }}</el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <div class="section-title">售后信息</div>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="类型">{{ AFTER_SALE_TYPE[detail.type] }}</el-descriptions-item>
          <el-descriptions-item label="退款金额"><span class="price">¥{{ detail.refund_amount || '0.00' }}</span></el-descriptions-item>
          <el-descriptions-item label="原因" :span="2">{{ detail.reason }}</el-descriptions-item>
          <el-descriptions-item label="说明" :span="2">{{ detail.description || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.admin_remark" label="处理备注" :span="2">{{ detail.admin_remark }}</el-descriptions-item>
          <el-descriptions-item v-if="detail.handle_time" label="处理时间" :span="2">{{ formatDate(detail.handle_time) }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="detail.images?.length" class="image-list">
          <el-image
            v-for="(img, idx) in detail.images"
            :key="idx"
            :src="resolveImage(img)"
            :preview-src-list="detail.images.map(resolveImage)"
            fit="cover"
            class="proof-img"
          />
        </div>
      </div>

      <div v-if="detail.order?.items?.length" class="section">
        <div class="section-title">订单商品</div>
        <el-table :data="detail.order.items" size="small" border>
          <el-table-column label="商品" min-width="180">
            <template #default="{ row }">
              <div class="goods-cell">
                <el-image :src="resolveImage(row.product_image)" class="goods-img" fit="cover" />
                <div>
                  <div>{{ row.product_name }}</div>
                  <div v-if="row.sku_name" class="sub-text">{{ row.sku_name }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="数量" width="80">
            <template #default="{ row }">{{ row.weight ? `${row.weight}g` : row.quantity }}</template>
          </el-table-column>
          <el-table-column label="单价" width="80">
            <template #default="{ row }">¥{{ row.price }}</template>
          </el-table-column>
        </el-table>
      </div>

      <div v-if="detail.status === 'pending'" class="action-bar">
        <el-button type="success" @click="handle(detail, 'approved')">通过售后</el-button>
        <el-button type="danger" @click="handle(detail, 'rejected')">拒绝申请</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import { resolveImage } from '../utils/image';
import {
  formatDate,
  ORDER_STATUS,
  AFTER_SALE_TYPE,
  AFTER_SALE_STATUS,
  AFTER_SALE_STATUS_TYPE
} from '../utils/format';

const list = ref([]);
const status = ref('');
const page = ref(1);
const total = ref(0);
const drawerVisible = ref(false);
const detail = ref(null);

onMounted(loadData);

async function loadData() {
  const res = await request.get('/after-sales', {
    params: { status: status.value || undefined, page: page.value, pageSize: 20 }
  });
  list.value = res.list;
  total.value = res.total;
}

function search() {
  page.value = 1;
  loadData();
}

function resetSearch() {
  status.value = '';
  search();
}

function openDetail(row) {
  detail.value = row;
  drawerVisible.value = true;
}

async function handle(row, nextStatus) {
  const action = nextStatus === 'approved' ? '通过' : '拒绝';
  let adminRemark = '';
  try {
    const { value } = await ElMessageBox.prompt(`确定${action}该售后申请？可填写处理备注（选填）`, '处理售后', {
      confirmButtonText: action,
      cancelButtonText: '取消',
      inputPlaceholder: '处理备注（选填）',
      inputType: 'textarea'
    });
    adminRemark = value || '';
  } catch {
    return;
  }

  await request.put(`/after-sales/${row.id}`, { status: nextStatus, adminRemark });
  ElMessage.success('处理成功');
  drawerVisible.value = false;
  loadData();
}
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; flex-wrap: wrap; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.sub-text { color: #909399; font-size: 12px; line-height: 1.5; }
.order-no { font-weight: 500; }
.price { color: #f56c6c; font-weight: 500; }
.goods-line { font-size: 13px; line-height: 1.5; }
.detail-wrap { padding: 0 4px 24px; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.detail-header .title { font-size: 18px; font-weight: 600; }
.section { margin-top: 20px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.image-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.proof-img { width: 80px; height: 80px; border-radius: 6px; }
.goods-cell { display: flex; align-items: center; gap: 8px; }
.goods-img { width: 40px; height: 40px; border-radius: 4px; flex-shrink: 0; }
.action-bar { display: flex; gap: 12px; margin-top: 24px; }
</style>
