<template>
  <el-card>
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="昵称 / 手机号 / 地址联系人 / 用户ID"
        style="width:280px"
        clearable
        @clear="search"
        @keyup.enter="search"
      />
      <el-button type="primary" @click="search">搜索</el-button>
      <el-button v-if="keyword" @click="resetSearch">重置</el-button>
    </div>

    <el-table :data="list" stripe style="margin-top:16px">
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户" min-width="160">
        <template #default="{ row }">
          <div class="user-cell">
            <el-avatar :size="36" :src="resolveImage(row.avatar)">{{ row.nickname?.[0] || '用' }}</el-avatar>
            <span>{{ row.nickname || '微信用户' }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="手机号" width="160">
        <template #default="{ row }">
          <div>
            <span>{{ row.display_phone || row.phone || '-' }}</span>
            <span v-if="row.phone_from_address" class="phone-tag">地址</span>
          </div>
          <div v-if="row.matched_address_name" class="match-tip">匹配：{{ row.matched_address_name }}</div>
        </template>
      </el-table-column>
      <el-table-column label="会员" width="100">
        <template #default="{ row }">Lv.{{ row.member_level || 0 }}</template>
      </el-table-column>
      <el-table-column prop="points" label="积分" width="80" />
      <el-table-column label="累计消费" width="100">
        <template #default="{ row }">¥{{ row.total_spent || '0.00' }}</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status ? 'success' : 'danger'" size="small">{{ row.status ? '正常' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="注册时间" width="170">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click="openDetail(row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination class="pagination" v-model:current-page="page" :page-size="20" :total="total" @current-change="loadData" layout="total, prev, pager, next" />
  </el-card>

  <el-drawer v-model="drawerVisible" title="用户详情" size="560px" destroy-on-close>
    <div v-if="detail" class="detail-wrap">
      <div class="profile-card">
        <el-avatar :size="64" :src="resolveImage(detail.user.avatar)">{{ detail.user.nickname?.[0] || '用' }}</el-avatar>
        <div class="profile-info">
          <div class="name">{{ detail.user.nickname || '微信用户' }}</div>
          <div class="sub">ID: {{ detail.user.id }} · {{ detail.user.phone || '未绑定手机' }}</div>
          <el-tag :type="detail.user.status ? 'success' : 'danger'" size="small">{{ detail.user.status ? '正常' : '已禁用' }}</el-tag>
        </div>
        <el-button
          :type="detail.user.status ? 'danger' : 'success'"
          size="small"
          @click="toggleStatus"
        >{{ detail.user.status ? '禁用' : '启用' }}</el-button>
      </div>

      <el-descriptions :column="2" border class="section">
        <el-descriptions-item label="OpenID">{{ maskOpenid(detail.user.openid) }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ ['未知', '男', '女'][detail.user.gender] || '未知' }}</el-descriptions-item>
        <el-descriptions-item label="会员等级">{{ detail.memberLevel?.name || `Lv.${detail.user.member_level}` }}</el-descriptions-item>
        <el-descriptions-item label="积分">{{ detail.user.points }}</el-descriptions-item>
        <el-descriptions-item label="累计消费">¥{{ detail.user.total_spent || '0.00' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatDate(detail.user.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="订单总数">{{ detail.stats.orderCount }}</el-descriptions-item>
        <el-descriptions-item label="有效订单">{{ detail.stats.paidOrderCount }}</el-descriptions-item>
      </el-descriptions>

      <div class="section-title">收货地址</div>
      <el-table :data="detail.addresses" size="small" stripe empty-text="暂无地址">
        <el-table-column prop="name" label="联系人" width="80" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column label="地址">
          <template #default="{ row }">{{ row.province }}{{ row.city }}{{ row.district }}{{ row.detail }}</template>
        </el-table-column>
        <el-table-column label="默认" width="60">
          <template #default="{ row }"><el-tag v-if="row.is_default" size="small" type="success">是</el-tag></template>
        </el-table-column>
      </el-table>

      <div class="section-title">最近订单</div>
      <el-table :data="detail.recentOrders" size="small" stripe empty-text="暂无订单">
        <el-table-column prop="order_no" label="订单号" min-width="150" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }"><el-tag size="small">{{ ORDER_STATUS[row.status] }}</el-tag></template>
        </el-table-column>
        <el-table-column label="金额" width="80">
          <template #default="{ row }">¥{{ row.pay_amount }}</template>
        </el-table-column>
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>

      <div class="section-title">积分记录</div>
      <el-table :data="detail.pointsLogs" size="small" stripe empty-text="暂无记录">
        <el-table-column label="变动" width="80">
          <template #default="{ row }">
            <span :class="row.points > 0 ? 'text-green' : 'text-red'">{{ row.points > 0 ? '+' : '' }}{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="70">
          <template #default="{ row }">{{ POINTS_TYPE[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column prop="remark" label="说明" />
        <el-table-column label="时间" width="150">
          <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import request from '../utils/request';
import { resolveImage } from '../utils/image';
import { formatDate, ORDER_STATUS, POINTS_TYPE, maskOpenid } from '../utils/format';

const list = ref([]);
const keyword = ref('');
const page = ref(1);
const total = ref(0);
const drawerVisible = ref(false);
const detail = ref(null);
const currentId = ref(null);

onMounted(loadData);

function search() {
  page.value = 1;
  loadData();
}

function resetSearch() {
  keyword.value = '';
  page.value = 1;
  loadData();
}

async function loadData() {
  const res = await request.get('/users', { params: { keyword: keyword.value, page: page.value } });
  list.value = res.list;
  total.value = res.total;
}

async function openDetail(row) {
  currentId.value = row.id;
  detail.value = await request.get(`/users/${row.id}`);
  drawerVisible.value = true;
}

async function toggleStatus() {
  const newStatus = detail.value.user.status ? 0 : 1;
  const action = newStatus ? '启用' : '禁用';
  await ElMessageBox.confirm(`确定${action}该用户？`, '提示');
  await request.put(`/users/${currentId.value}/status`, { status: newStatus });
  ElMessage.success(`已${action}`);
  detail.value = await request.get(`/users/${currentId.value}`);
  loadData();
}
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; }
.pagination { margin-top: 16px; justify-content: flex-end; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.detail-wrap { padding: 0 4px; }
.profile-card { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.profile-info { flex: 1; }
.profile-info .name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.profile-info .sub { color: #999; font-size: 13px; margin-bottom: 8px; }
.section { margin-bottom: 24px; }
.section-title { font-weight: 600; margin: 20px 0 12px; font-size: 15px; }
.text-green { color: #2ECC71; }
.text-red { color: #E74C3C; }
.phone-tag { font-size: 11px; color: #999; margin-left: 4px; background: #f5f5f5; padding: 1px 6px; border-radius: 4px; }
.match-tip { font-size: 11px; color: #2ECC71; margin-top: 2px; }
</style>
