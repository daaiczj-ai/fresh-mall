const api = require('../../services/api');
const { COUPON_TYPE } = require('../../utils/util');

function formatCouponValue(coupon) {
  if (!coupon) return '';
  if (coupon.type === 'discount') return `${(parseFloat(coupon.value) * 10).toFixed(1).replace(/\.0$/, '')}折`;
  return `¥${coupon.value}`;
}

Page({
  data: {
    activeTab: 'mine',
    available: [],
    coupons: [],
    COUPON_TYPE,
    loading: false
  },

  onLoad(options) {
    if (options.tab === 'center') this.setData({ activeTab: 'center' });
  },

  onShow() {
    this.loadData();
  },

  switchTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      if (this.data.activeTab === 'center') {
        const available = await api.getAvailableCoupons();
        this.setData({
          available: (available || []).map(item => ({
            ...item,
            displayValue: formatCouponValue(item)
          }))
        });
      } else {
        const coupons = await api.getMyCoupons();
        this.setData({
          coupons: (coupons || []).map(item => ({
            ...item,
            displayValue: formatCouponValue(item.coupon)
          }))
        });
      }
    } catch {
      this.setData({ available: [], coupons: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  async receive(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.receiveCoupon(id);
      wx.showToast({ title: '领取成功', icon: 'success' });
      this.loadData();
    } catch {
      // request.js 已提示
    }
  },

  goCenter() {
    this.setData({ activeTab: 'center' }, () => this.loadData());
  }
});
