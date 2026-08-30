const api = require('../../services/api');
const { resolveImage } = require('../../utils/image');
const { ORDER_STATUS } = require('../../utils/util');
const app = getApp();

Page({
  data: {
    tabs: [
      { key: '', label: '全部' },
      { key: 'pending_payment', label: '待付款' },
      { key: 'processing', label: '待处理' },
      { key: 'receiving', label: '待收货' },
      { key: 'completed', label: '已完成' }
    ],
    activeTab: '',
    orders: [],
    loading: false,
    ORDER_STATUS
  },

  onLoad(options) {
    this._entryStatus = options.status;
  },

  onShow() {
    if (this._entryStatus !== undefined) {
      const status = this._entryStatus || '';
      this._entryStatus = undefined;
      if (status !== this.data.activeTab) {
        this.setData({ activeTab: status }, () => this.loadOrders());
        return;
      }
    }
    this.loadOrders();
  },

  switchTab(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ activeTab: key }, () => this.loadOrders());
  },

  formatOrders(list) {
    return (list || []).map(order => ({
      ...order,
      items: (order.items || []).map(item => ({
        ...item,
        product_image: resolveImage(item.product_image)
      }))
    }));
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      await app.checkLogin();
      const { activeTab } = this.data;
      const params = { pageSize: 50 };
      if (activeTab) params.status = activeTab;
      const res = await api.getOrders(params);
      this.setData({ orders: this.formatOrders(res.list), loading: false });
    } catch {
      this.setData({ orders: [], loading: false });
    } finally {
      wx.stopPullDownRefresh();
    }
  },

  goDetail(e) {
    wx.navigateTo({ url: `/pages/order/detail?id=${e.currentTarget.dataset.id}` });
  },

  async cancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    await api.cancelOrder(id, { reason: '用户取消' });
    wx.showToast({ title: '已取消' });
    this.loadOrders();
  },

  async confirmOrder(e) {
    await api.confirmOrder(e.currentTarget.dataset.id);
    wx.showToast({ title: '已确认收货' });
    this.loadOrders();
  },

  payOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/pay/pay?orderId=${id}` });
  },

  preventBubble() {},

  onPullDownRefresh() {
    this.loadOrders();
  }
});
