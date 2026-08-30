const api = require('../../services/api');

Page({
  data: {
    orderId: '',
    type: 'refund',
    reason: '',
    description: '',
    refundAmount: ''
  },

  onLoad(options) {
    this.setData({
      orderId: options.orderId || '',
      refundAmount: options.amount || ''
    });
  },

  selectType(e) {
    this.setData({ type: e.currentTarget.dataset.type });
  },

  onReasonInput(e) { this.setData({ reason: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },
  onAmountInput(e) { this.setData({ refundAmount: e.detail.value }); },

  async submit() {
    const { orderId, type, reason, description, refundAmount } = this.data;
    if (!orderId) return wx.showToast({ title: '订单信息异常', icon: 'none' });
    if (!reason.trim()) return wx.showToast({ title: '请填写原因', icon: 'none' });
    await api.createAfterSale({
      orderId: Number(orderId),
      type,
      reason,
      description,
      refundAmount: refundAmount ? Number(refundAmount) : undefined
    });
    wx.showToast({ title: '已提交', icon: 'success' });
    setTimeout(() => wx.navigateTo({ url: '/pages/after-sale/list' }), 1500);
  }
});
