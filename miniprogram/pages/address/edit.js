const api = require('../../services/api');

Page({
  data: { id: '', form: { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false } },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadAddress(options.id);
    }
  },

  async loadAddress(id) {
    const addresses = await api.getAddresses();
    const addr = addresses.find(a => a.id == id);
    if (addr) this.setData({ form: { name: addr.name, phone: addr.phone, province: addr.province, city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.is_default } });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  toggleDefault(e) { this.setData({ 'form.isDefault': e.detail.value }); },

  async save() {
    const { id, form } = this.data;
    if (!form.name || !form.phone || !form.detail) return wx.showToast({ title: '请填写完整', icon: 'none' });
    if (id) await api.updateAddress(id, form);
    else await api.createAddress(form);
    wx.navigateBack();
  }
});
