import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/Login.vue') },
  {
    path: '/',
    component: () => import('../layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '数据概览' } },
      { path: 'homepage', name: 'Homepage', component: () => import('../views/Homepage.vue'), meta: { title: '首页运营' } },
      { path: 'banners', name: 'Banners', component: () => import('../views/Banners.vue'), meta: { title: '轮播图管理' } },
      { path: 'products', name: 'Products', component: () => import('../views/Products.vue'), meta: { title: '商品管理' } },
      { path: 'categories', name: 'Categories', component: () => import('../views/Categories.vue'), meta: { title: '分类管理' } },
      { path: 'orders', name: 'Orders', component: () => import('../views/Orders.vue'), meta: { title: '订单管理' } },
      { path: 'users', name: 'Users', component: () => import('../views/Users.vue'), meta: { title: '用户管理' } },
      { path: 'coupons', name: 'Coupons', component: () => import('../views/Coupons.vue'), meta: { title: '优惠券' } },
      { path: 'stores', name: 'Stores', component: () => import('../views/Stores.vue'), meta: { title: '门店管理' } },
      { path: 'after-sales', name: 'AfterSales', component: () => import('../views/AfterSales.vue'), meta: { title: '售后管理' } }
    ]
  }
];

const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach((to, from, next) => {
  if (to.path !== '/login' && !localStorage.getItem('admin_token')) {
    next('/login');
  } else {
    next();
  }
});

export default router;
