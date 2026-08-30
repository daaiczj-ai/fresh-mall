const api = require('../../services/api');

Page({
  data: { addresses: [], selectMode: false },

  onLoad(options) { this.setData({ selectMode: options.select === '1' }); },
  onShow() { this.loadAddresses(); },

  async loadAddresses() {
    const addresses = await api.getAddresses();
    this.setData({ addresses });
  },

  selectAddress(e) {
    if (!this.data.selectMode) return;
    const address = this.data.addresses.find(a => a.id === e.currentTarget.dataset.id);
    const pages = getCurrentPages();
    const prev = pages[pages.length - 2];
    if (prev) {
      prev.setData({ address });
      prev.preview && prev.preview();
    }
    wx.navigateBack();
  },

  goEdit(e) {
    const id = e.currentTarget.dataset.id || '';
    wx.navigateTo({ url: `/pages/address/edit?id=${id}` });
  },

  async deleteAddress(e) {
    await api.deleteAddress(e.currentTarget.dataset.id);
    this.loadAddresses();
  }
});
