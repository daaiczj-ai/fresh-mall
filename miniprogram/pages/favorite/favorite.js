const api = require('../../services/api');

Page({
  data: { favorites: [] },
  onShow() { api.getFavorites().then(favorites => this.setData({ favorites })); },
  goProduct(e) { wx.navigateTo({ url: `/pages/product/detail?id=${e.currentTarget.dataset.id}` }); }
});
