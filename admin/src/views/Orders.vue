<template>
  <el-card>
    <div class="toolbar">
      <el-select v-model="status" placeholder="订单状态" clearable @change="search" style="width:150px">
        <el-option v-for="(label, key) in ORDER_STATUS" :key="key" :label="label" :value="key" />
      </el-select>
      <el-input
        v-model="keyword"
        placeholder="订单号 / 手机号 / 收货人 / 商品名 / 取货码"
        style="width:300px"
        clearable
        @clear="search"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button v-if="keyword || status" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="list" stripe style="margin-top:16px">
      <el-table-column prop="order_no" label="订单号" min-width="180" />
      <el-table-column label="用户" width="150">
        <template #default="{ row }">
          <div>{{ row.display_contact || row.user?.nickname || '-' }}</div>
          <div class="sub-text">
            {{ row.display_phone || row.user?.phone || '-' }}
            <span v-if="row.phone_from_snapshot" class="phone-tag">收货</span>
          </div>
          <div v-if="row.match_tip" class="match-tip">{{ row.match_tip }}</div>
        </template>
      </el-table-column>
      <el-table-column label="商品" width="80">
        <template #default="{ row }">{{ row.items?.length || 0 }}件</template>
      </el-table-column>
      <el-table-column label="实付" width="90">
        <template #default="{ row }"><span class="price">¥{{ row.pay_amount }}</span></template>
      </el-table-column>
      <el-table-column label="配送" width="80">
        <template #default="{ row }">{{ row.delivery_type === 'delivery' ? '配送' : '自提' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="ORDER_STATUS_TYPE[row.status]" size="small">{{ ORDER_STATUS[row.status] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="下单时间" width="170">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openDetail(row)">详情</el-button>
          <el-dropdown v-if="canUpdate(row.status)" @command="cmd => updateStatus(row, cmd)">
            <el-button size="small" link>状态</el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="s in nextStatuses(row)" :key="s" :command="s">{{ ORDER_STATUS[s] }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pagination" v-model:current-page="page" :page-size="20" :total="total" @current-change="loadData" layout="total, prev, pager, next" />
  </el-card>

  <el-drawer v-model="drawerVisible" title="订单详情" size="640px" destroy-on-close>
    <div v-if="order" class="detail-wrap">
      <div class="order-header">
        <div>
          <div class="order-no">{{ order.order_no }}</div>
          <div class="sub-text">{{ formatDate(order.created_at) }}</div>
        </div>
        <el-tag :type="ORDER_STATUS_TYPE[order.status]" size="large">{{ ORDER_STATUS[order.status] }}</el-tag>
      </div>

      <el-descriptions :column="2" border class="section" title="用户信息">
        <el-descriptions-item label="昵称">{{ order.user?.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机">{{ order.user?.phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ order.user?.id || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">Lv.{{ order.user?.member_level || 0 }}</el-descriptions-item>
      </el-descriptions>

      <el-descriptions :column="1" border class="section" title="配送信息">
        <el-descriptions-item label="配送方式">{{ order.delivery_type === 'delivery' ? '同城配送' : '到店自提' }}</el-descriptions-item>
        <el-descriptions-item v-if="order.delivery_type === 'delivery' && order.address_snapshot" label="收货地址">
          {{ order.address_snapshot.name }} {{ order.address_snapshot.phone }}<br />
          {{ order.address_snapshot.province }}{{ order.address_snapshot.city }}{{ order.address_snapshot.district }}{{ order.address_snapshot.detail }}
        </el-descriptions-item>
        <el-descriptions-item v-if="order.delivery_type === 'pickup' && order.pickupStore" label="自提门店">
          {{ order.pickupStore.name }} · {{ order.pickupStore.address }}
        </el-descriptions-item>
        <el-descriptions-item v-if="order.pickup_code" label="取货码">
          <span class="pickup-code">{{ order.pickup_code }}</span>
        </el-descriptions-item>
        <el-descriptions-item v-if="order.delivery_time_slot" label="配送时间">{{ order.delivery_time_slot }}</el-descriptions-item>
        <el-descriptions-item v-if="order.remark" label="备注">{{ order.remark }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">商品清单</div>
      <el-table :data="order.items" size="small" stripe>
        <el-table-column label="商品" min-width="200">
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
        <el-table-column label="单价" width="80">
          <template #default="{ row }">¥{{ row.price }}</template>
        </el-table-column>
        <el-table-column label="数量" width="70">
          <template #default="{ row }">x{{ row.quantity }}{{ row.weight ? ` (${row.weight}g)` : '' }}</template>
        </el-table-column>
        <el-table-column label="小计" width="80">
          <template #default="{ row }">¥{{ row.subtotal }}</template>
        </el-table-column>
      </el-table>

      <el-descriptions :column="2" border class="section" title="费用明细">
        <el-descriptions-item label="商品金额">¥{{ order.product_amount }}</el-descriptions-item>
        <el-descriptions-item label="配送费">¥{{ order.delivery_fee }}</el-descriptions-item>
        <el-descriptions-item label="优惠抵扣">-¥{{ order.discount_amount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="优惠券">-¥{{ order.coupon_amount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="积分抵扣">-¥{{ order.points_amount || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="实付金额"><span class="price">¥{{ order.pay_amount }}</span></el-descriptions-item>
      </el-descriptions>

      <el-descriptions v-if="order.pay_time" :column="2" border class="section" title="支付信息">
        <el-descriptions-item label="支付时间">{{ formatDate(order.pay_time) }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ payTypeMap[order.pay_type] || order.pay_type || '-' }}</el-descriptions-item>
        <el-descriptions-item v-if="order.transaction_id" label="交易号">{{ order.transaction_id }}</el-descriptions-item>
        <el-descriptions-item label="获得积分">{{ order.points_earned || 0 }}</el-descriptions-item>
      </el-descriptions>

      <div v-if="canUpdate(order.status)" class="action-bar">
        <span>更新状态：</span>
        <el-button
          v-for="s in nextStatuses(order)"
          :key="s"
          size="small"
          type="primary"
          @click="updateStatus(order, s)"
        >{{ ORDER_STATUS[s] }}</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import { resolveImage } from '../utils/image';
import { formatDate, ORDER_STATUS, ORDER_STATUS_TYPE } from '../utils/format';

const list = ref([]);
const status = ref('');
const keyword = ref('');
const page = ref(1);
const total = ref(0);
const drawerVisible = ref(false);
const order = ref(null);

const payTypeMap = { wechat: '微信支付', wechat_mock: '模拟支付' };

function nextStatuses(row) {
  const s = row.status;
  const isPickup = row.delivery_type === 'pickup';
  if (s === 'paid') return ['preparing', 'cancelled'];
  if (s === 'preparing') return isPickup ? ['ready_pickup', 'cancelled'] : ['delivering', 'cancelled'];
  if (s === 'delivering' || s === 'ready_pickup') return ['completed'];
  return [];
}

function canUpdate(s) {
  return ['paid', 'preparing', 'delivering', 'ready_pickup'].includes(s);
}

onMounted(loadData);

function search() {
  page.value = 1;
  loadData();
}

function resetSearch() {
  keyword.value = '';
  status.value = '';
  page.value = 1;
  loadData();
}

async function loadData() {
  const res = await request.get('/orders', { params: { status: status.value, keyword: keyword.value, page: page.value } });
  list.value = res.list;
  total.value = res.total;
}

async function openDetail(row) {
  order.value = await request.get(`/orders/${row.id}`);
  drawerVisible.value = true;
}

async function updateStatus(row, newStatus) {
  await ElMessageBox.confirm(`确定将订单状态更新为「${ORDER_STATUS[newStatus]}」？`, '提示');
  await request.put(`/orders/${row.id}/status`, { status: newStatus });
  ElMessage.success('状态已更新');
  if (drawerVisible.value && order.value?.id === row.id) {
    order.value = await request.get(`/orders/${row.id}`);
  }
  loadData();
}
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.sub-text { color: #999; font-size: 12px; }
.phone-tag { margin-left: 4px; padding: 0 4px; font-size: 10px; color: #E6A23C; background: #FDF6EC; border-radius: 3px; }
.match-tip { color: #909399; font-size: 11px; margin-top: 2px; }
.price { color: #E74C3C; font-weight: 600; }
.detail-wrap { padding: 0 4px; }
.order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.order-no { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.section { margin-bottom: 20px; }
.section-title { font-weight: 600; margin: 16px 0 12px; font-size: 15px; }
.goods-cell { display: flex; align-items: center; gap: 10px; }
.goods-img { width: 48px; height: 48px; border-radius: 6px; flex-shrink: 0; }
.pickup-code { font-size: 20px; font-weight: bold; color: #E74C3C; letter-spacing: 4px; }
.action-bar { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
</style>
