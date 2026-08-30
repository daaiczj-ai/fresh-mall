const api = require('../../services/api');
const { resolveImage } = require('../../utils/image');

Page({
  data: { keyword: '', products: [], searched: false },

  onInput(e) { this.setData({ keyword: e.detail.value }); },

  async onSearch() {
    if (!this.data.keyword.trim()) return;
    const res = await api.searchProducts({ keyword: this.data.keyword });
    this.setData({ products: (res.list || []).map(item => ({ ...item, cover: resolveImage(item.cover) })), searched: true });
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/detail?id=${e.currentTarget.dataset.id}` });
  }
});
