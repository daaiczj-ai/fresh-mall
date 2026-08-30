<template>
  <div class="login-page">
    <el-card class="login-card">
      <h2>鲜果鲜蔬 · 商家后台</h2>
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item><el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" /></el-form-item>
        <el-form-item><el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password /></el-form-item>
        <el-button type="primary" size="large" style="width:100%" native-type="submit" :loading="loading">登 录</el-button>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import request from '../utils/request';

const router = useRouter();
const loading = ref(false);
const form = ref({ username: '', password: '' });

async function handleLogin() {
  loading.value = true;
  try {
    const res = await request.post('/login', form.value);
    localStorage.setItem('admin_token', res.token);
    router.push('/dashboard');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; background: linear-gradient(135deg, #2ECC71, #27AE60); }
.login-card { width: 100%; max-width: 400px; padding: 20px; }
.login-card h2 { text-align: center; margin-bottom: 30px; color: #333; font-size: 20px; }
</style>
