import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

const request = axios.create({ baseURL: '/api/admin', timeout: 15000 });

request.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  res => {
    if (res.data.code === 0) return res.data.data;
    ElMessage.error(res.data.message || '请求失败');
    return Promise.reject(res.data);
  },
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      router.push('/login');
    }
    ElMessage.error(err.response?.data?.message || '网络错误');
    return Promise.reject(err);
  }
);

export default request;
