<template>
  <div class="admin-menu">
    <div class="logo">🥬 鲜果鲜蔬</div>
    <el-menu
      :default-active="active"
      router
      background-color="#001529"
      text-color="#ffffffa6"
      active-text-color="#2ECC71"
      @select="onSelect"
    >
      <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index">
        <el-icon><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<script setup>
defineProps({
  active: { type: String, default: '' }
});

const emit = defineEmits(['navigate']);

const menuItems = [
  { index: '/dashboard', label: '数据概览', icon: 'DataAnalysis' },
  { index: '/homepage', label: '首页运营', icon: 'HomeFilled' },
  { index: '/banners', label: '轮播图管理', icon: 'Picture' },
  { index: '/products', label: '商品管理', icon: 'Goods' },
  { index: '/categories', label: '分类管理', icon: 'Menu' },
  { index: '/orders', label: '订单管理', icon: 'List' },
  { index: '/users', label: '用户管理', icon: 'User' },
  { index: '/coupons', label: '优惠券', icon: 'Ticket' },
  { index: '/stores', label: '门店管理', icon: 'Shop' },
  { index: '/after-sales', label: '售后管理', icon: 'Service' }
];

function onSelect() {
  emit('navigate');
}
</script>

<style scoped>
.admin-menu { height: 100%; background: #001529; }
.logo {
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  padding: 20px 16px;
  text-align: center;
  border-bottom: 1px solid #ffffff1a;
}
.admin-menu :deep(.el-menu) { border-right: none; }
</style>
