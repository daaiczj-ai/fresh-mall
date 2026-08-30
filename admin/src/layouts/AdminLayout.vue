<template>
  <el-container class="layout" :class="{ 'is-mobile': isMobile }">
    <el-aside v-if="!isMobile" width="220px" class="sidebar">
      <AdminMenu :active="$route.path" />
    </el-aside>

    <el-drawer
      v-model="menuVisible"
      direction="ltr"
      :with-header="false"
      size="260px"
      class="mobile-menu-drawer"
    >
      <AdminMenu :active="$route.path" @navigate="menuVisible = false" />
    </el-drawer>

    <el-container class="content-wrap">
      <el-header class="header">
        <div class="header-left">
          <el-button v-if="isMobile" class="menu-btn" text @click="menuVisible = true">
            <el-icon :size="22"><Expand /></el-icon>
          </el-button>
          <span class="page-title">{{ $route.meta.title }}</span>
        </div>
        <el-button type="danger" text @click="logout">退出</el-button>
      </el-header>
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Expand } from '@element-plus/icons-vue';
import AdminMenu from '../components/AdminMenu.vue';
import { useMobile } from '../composables/useMobile';

const router = useRouter();
const { isMobile } = useMobile();
const menuVisible = ref(false);

function logout() {
  localStorage.removeItem('admin_token');
  router.push('/login');
}
</script>

<style scoped>
.layout { height: 100vh; min-height: 100vh; }
.sidebar { background: #001529; overflow: hidden; }
.content-wrap { min-width: 0; flex: 1; }
.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 16px;
  height: 52px;
}
.header-left { display: flex; align-items: center; gap: 4px; min-width: 0; }
.menu-btn { padding: 8px; margin-right: 4px; }
.page-title {
  font-size: 17px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.main {
  padding: 20px;
  overflow-x: hidden;
  background: #f0f2f5;
}

.layout.is-mobile .main {
  padding: 12px;
}

.layout.is-mobile .header {
  position: sticky;
  top: 0;
  z-index: 100;
}
</style>

<style>
.mobile-menu-drawer .el-drawer__body {
  padding: 0;
  background: #001529;
}
</style>
