const api = require('../../services/api');
const { resolveImage } = require('../../utils/image');
const { ORDER_STATUS, formatDate } = require('../../utils/util');

const AFTER_SALE_STATUSES = ['paid', 'preparing', 'delivering', 'ready_pickup', 'completed'];

Page({
  data: { order: null, ORDER_STATUS, canAfterSale: false },

  onLoad(options) {
    this.orderId = options.id;
    this.loadOrder();
  },

  async loadOrder() {
    const order = await api.getOrderDetail(this.orderId);
    order.created_at_fmt = formatDate(order.created_at);
    order.items = (order.items || []).map(item => ({
      ...item,
      product_image: resolveImage(item.product_image)
    }));
    const canAfterSale = AFTER_SALE_STATUSES.includes(order.status);
    this.setData({ order, canAfterSale });
  },

  async cancelOrder() {
    await api.cancelOrder(this.orderId, { reason: '用户取消' });
    wx.showToast({ title: '已取消' });
    this.loadOrder();
  },

  async confirmOrder() {
    await api.confirmOrder(this.orderId);
    wx.showToast({ title: '已确认收货' });
    this.loadOrder();
  },

  payOrder() {
    wx.navigateTo({ url: `/pages/pay/pay?orderId=${this.orderId}` });
  },

  goAfterSale() {
    const { order } = this.data;
    wx.navigateTo({
      url: `/pages/after-sale/create?orderId=${order.id}&amount=${order.pay_amount}`
    });
  },

  goAfterSaleList() {
    wx.navigateTo({ url: '/pages/after-sale/list' });
  }
});
