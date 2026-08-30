const { request } = require('../utils/request');

module.exports = {
  getBanners: () => request({ url: '/banners' }),
  getCategories: () => request({ url: '/categories' }),
  getProducts: (params) => request({ url: '/products', data: params }),
  getProductDetail: (id) => request({ url: `/products/${id}` }),
  searchProducts: (params) => request({ url: '/search', data: params }),
  getSeckills: () => request({ url: '/seckills' }),
  getFrequentlyBought: () => request({ url: '/frequently-bought' }),

  getCart: () => request({ url: '/cart' }),
  addToCart: (data) => request({ url: '/cart', method: 'POST', data }).then(res => {
    try { getApp().globalData.cartCache = null; } catch (e) {}
    return res;
  }),
  updateCart: (id, data) => request({ url: `/cart/${id}`, method: 'PUT', data }).then(res => {
    try { getApp().globalData.cartCache = null; } catch (e) {}
    return res;
  }),
  removeFromCart: (id) => request({ url: `/cart/${id}`, method: 'DELETE' }).then(res => {
    try { getApp().globalData.cartCache = null; } catch (e) {}
    return res;
  }),
  selectAll: (data) => request({ url: '/cart/select/all', method: 'PUT', data }).then(res => {
    try { getApp().globalData.cartCache = null; } catch (e) {}
    return res;
  }),

  previewOrder: (data) => request({ url: '/orders/preview', method: 'POST', data, showLoading: true }),
  createOrder: (data) => request({ url: '/orders', method: 'POST', data, showLoading: true }),
  getOrders: (params = {}) => {
    const data = {};
    if (params.status) data.status = params.status;
    if (params.page) data.page = params.page;
    if (params.pageSize) data.pageSize = params.pageSize;
    return request({ url: '/orders', data });
  },
  getOrderDetail: (id) => request({ url: `/orders/${id}` }),
  cancelOrder: (id, data) => request({ url: `/orders/${id}/cancel`, method: 'POST', data }),
  confirmOrder: (id) => request({ url: `/orders/${id}/confirm`, method: 'POST' }),

  getAddresses: () => request({ url: '/addresses' }),
  createAddress: (data) => request({ url: '/addresses', method: 'POST', data }),
  updateAddress: (id, data) => request({ url: `/addresses/${id}`, method: 'PUT', data }),
  deleteAddress: (id) => request({ url: `/addresses/${id}`, method: 'DELETE' }),

  getStores: () => request({ url: '/user/stores' }),
  getAvailableCoupons: () => request({ url: '/user/coupons/available' }),
  receiveCoupon: (id) => request({ url: `/user/coupons/${id}/receive`, method: 'POST' }),
  getMyCoupons: (params) => request({ url: '/user/coupons', data: params }),
  getPointsLog: (params) => request({ url: '/user/points', data: params }),
  getFavorites: () => request({ url: '/user/favorites' }),
  toggleFavorite: (productId) => request({ url: '/user/favorites', method: 'POST', data: { productId } }),
  createReview: (data) => request({ url: '/user/reviews', method: 'POST', data }),
  createAfterSale: (data) => request({ url: '/user/after-sales', method: 'POST', data }),
  getAfterSales: () => request({ url: '/user/after-sales' }),

  createPayment: (orderId) => request({ url: `/pay/${orderId}`, method: 'POST', showLoading: true }),
  mockPay: (orderId) => request({ url: `/pay/${orderId}/mock`, method: 'POST', showLoading: true })
};
