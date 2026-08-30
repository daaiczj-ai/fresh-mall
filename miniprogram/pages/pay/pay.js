const api = require('../../services/api');
const { payOrder } = require('../../utils/pay');

Page({
  data: {
    order: null,
    paying: false,
    isDev: true
  },

  onLoad(options) {
    this.orderId = options.orderId;
    if (!this.orderId) {
      wx.showToast({ title: '订单不存在', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }
    this.loadOrder();
  },

  async loadOrder() {
    try {
      const order = await api.getOrderDetail(this.orderId);
      if (order.status !== 'pending_payment') {
        wx.showToast({ title: '订单已支付或已关闭', icon: 'none' });
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/order/detail?id=${this.orderId}` });
        }, 1500);
        return;
      }
      this.setData({ order });
    } catch {
      wx.showToast({ title: '加载订单失败', icon: 'none' });
    }
  },

  async handlePay() {
    if (this.data.paying) return;
    this.setData({ paying: true });
    try {
      const payment = await api.createPayment(this.orderId);
      if (payment.mock) {
        const confirmed = await new Promise(resolve => {
          wx.showModal({
            title: '模拟支付',
            content: `未配置微信支付商户号\n将使用模拟支付，金额 ¥${payment.payAmount}`,
            confirmText: '模拟支付',
            cancelText: '取消',
            confirmColor: '#2ECC71',
            success: res => resolve(res.confirm)
          });
        });
        if (!confirmed) return;
        await api.mockPay(this.orderId);
        getApp().globalData.cartCache = null;
        wx.showToast({ title: '支付成功', icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: `/pages/order/detail?id=${this.orderId}` });
        }, 800);
        return;
      }

      if (payment.payParams) {
        await new Promise((resolve, reject) => {
          wx.requestPayment({
            ...payment.payParams,
            success: resolve,
            fail: reject
          });
        });
        getApp().globalData.cartCache = null;
        wx.redirectTo({ url: `/pages/order/detail?id=${this.orderId}` });
      }
    } catch (err) {
      if (!err?.cancelled && !err?.errMsg?.includes('cancel')) {
        wx.showToast({ title: '支付失败', icon: 'none' });
      }
    } finally {
      this.setData({ paying: false });
    }
  }
});
