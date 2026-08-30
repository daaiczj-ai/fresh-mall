const api = require('../../services/api');

function formatMemberInfo(info) {
  if (!info) return null;
  const levels = (info.levels || []).map(level => ({
    ...level,
    discountText: Number(level.discount) < 1
      ? `${(Number(level.discount) * 10).toFixed(1)}折`
      : '无折扣'
  }));
  return { ...info, levels };
}

Page({
  data: { memberInfo: null },

  onShow() {
    api.getMemberInfo().then(info => this.setData({ memberInfo: formatMemberInfo(info) }));
  }
});