const api = require('../../services/api');
const { formatDate } = require('../../utils/util');

const TYPE_MAP = { refund: '仅退款', return: '退货退款', exchange: '换货' };
const STATUS_MAP = { pending: '待处理', approved: '已通过', rejected: '已拒绝', completed: '已完成' };

Page({
  data: {
    list: [],
    TYPE_MAP,
    STATUS_MAP,
    loading: false
  },

  onShow() {
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const list = await api.getAfterSales();
      this.setData({
        list: (list || []).map(item => ({
          ...item,
          created_at_fmt: formatDate(item.created_at)
        }))
      });
    } catch {
      this.setData({ list: [] });
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order/detail?id=${id}` });
  }
});
