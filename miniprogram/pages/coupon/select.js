const api = require('../../services/api');
const { COUPON_TYPE } = require('../../utils/util');
const app = getApp();

function formatCouponValue(coupon) {
  if (!coupon) return '';
  if (coupon.type === 'discount') return `${(parseFloat(coupon.value) * 10).toFixed(1).replace(/\.0$/, '')}折`;
  return `¥${coupon.value}`;
}

function canUseCoupon(userCoupon, ctx) {
  const coupon = userCoupon.coupon;
  if (!coupon || userCoupon.status !== 'unused') return { ok: false, tip: '不可用' };
  if (userCoupon.expire_time && new Date(userCoupon.expire_time) < new Date()) {
    return { ok: false, tip: '已过期' };
  }
  const minAmount = parseFloat(coupon.min_amount) || 0;
  if (minAmount > ctx.productAmount) return { ok: false, tip: `满${minAmount}元可用` };
  if (coupon.type === 'delivery' && ctx.deliveryType !== 'delivery') {
    return { ok: false, tip: '仅配送单可用' };
  }
  return { ok: true, tip: '' };
}

Page({
  data: {
    coupons: [],
    selectedId: null,
    COUPON_TYPE,
    loading: false
  },

  onLoad() {
    const ctx = app.globalData.checkoutContext || {};
    this.setData({ selectedId: ctx.selectedCouponId || null });
    this.loadCoupons();
  },

  async loadCoupons() {
    const ctx = app.globalData.checkoutContext || {};
    this.setData({ loading: true });
    try {
      const list = await api.getMyCoupons({ status: 'unused' });
      const coupons = (list || []).map(item => {
        const check = canUseCoupon(item, ctx);
        return {
          ...item,
          displayValue: formatCouponValue(item.coupon),
          canUse: check.ok,
          disableTip: check.tip
        };
      }).sort((a, b) => Number(b.canUse) - Number(a.canUse));
      this.setData({ coupons });
    } catch {
      this.setData({ coupons: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  selectNone() {
    if (!app.globalData.checkoutContext) app.globalData.checkoutContext = {};
    app.globalData.checkoutContext.selectedCouponId = null;
    app.globalData.checkoutContext.selectedCouponName = '';
    wx.navigateBack();
  },

  selectCoupon(e) {
    const item = e.currentTarget.dataset.item;
    if (!item.canUse) return;
    if (!app.globalData.checkoutContext) app.globalData.checkoutContext = {};
    app.globalData.checkoutContext.selectedCouponId = item.id;
    app.globalData.checkoutContext.selectedCouponName = item.coupon.name;
    wx.navigateBack();
  }
});
