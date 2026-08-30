const api = require('../../services/api');

Page({
  data: {
    orderId: '',
    productId: '',
    productName: '',
    rating: 5,
    content: '',
    isAnonymous: false
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId || '',
      productId: options.productId || '',
      productName: options.productName || ''
    });
  },

  setRating(e) {
    this.setData({ rating: Number(e.currentTarget.dataset.value) });
  },

  onInput(e) {
    this.setData({ content: e.detail.value });
  },

  toggleAnonymous(e) {
    this.setData({ isAnonymous: e.detail.value });
  },

  async submit() {
    const { orderId, productId, rating, content, isAnonymous } = this.data;
    if (!orderId || !productId) {
      return wx.showToast({ title: '参数错误', icon: 'none' });
    }
    await api.createReview({ orderId: Number(orderId), productId: Number(productId), rating, content, isAnonymous });
    wx.showToast({ title: '评价成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 1500);
  }
});
