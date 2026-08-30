const api = require('../../services/api');
const app = getApp();

Page({
  data: { items: [], total: '0.00', allSelected: true },

  onLoad() {
    const cached = app.globalData.cartCache;
    if (cached) this.applyCart(cached);
  },

  onShow() {
    if (!app.globalData.token) {
      this.setData({ items: [], total: '0.00' });
      return;
    }
    if (app.globalData.cartCache) {
      this.applyCart(app.globalData.cartCache);
      return;
    }
    this.loadCart();
  },

  applyCart(res) {
    const allSelected = res.items.length ? res.items.every(i => i.selected) : true;
    this.setData({ items: res.items, total: res.total, allSelected });
  },

  async loadCart() {
    try {
      const res = await api.getCart();
      app.globalData.cartCache = res;
      this.applyCart(res);
    } catch {
      app.globalData.cartCache = null;
      this.setData({ items: [], total: '0.00' });
    }
  },

  async toggleSelect(e) {
    const id = e.currentTarget.dataset.id;
    const item = this.data.items.find(i => i.id === id);
    await api.updateCart(id, { selected: !item.selected });
    app.globalData.cartCache = null;
    this.loadCart();
  },

  async toggleAll() {
    await api.selectAll({ selected: !this.data.allSelected });
    app.globalData.cartCache = null;
    this.loadCart();
  },

  async changeQty(e) {
    const { id, type } = e.currentTarget.dataset;
    const item = this.data.items.find(i => i.id === id);
    let qty = item.quantity;
    if (type === 'minus' && qty > 1) qty--;
    if (type === 'plus') qty++;
    await api.updateCart(id, { quantity: qty });
    app.globalData.cartCache = null;
    this.loadCart();
  },

  async removeItem(e) {
    const id = e.currentTarget.dataset.id;
    await api.removeFromCart(id);
    app.globalData.cartCache = null;
    this.loadCart();
  },

  async checkout() {
    await app.checkLogin();
    const selectedIds = this.data.items.filter(i => i.selected).map(i => i.id);
    if (!selectedIds.length) return wx.showToast({ title: '请选择商品', icon: 'none' });
    wx.navigateTo({ url: `/pages/checkout/checkout?cartIds=${selectedIds.join(',')}` });
  },

  goShopping() {
    wx.switchTab({ url: '/pages/index/index' });
  }
});
