const app = getApp();

Page({
  data: { userInfo: null },

  onShow() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({ userInfo });
      return;
    }
    if (app.globalData.token) {
      app.getUserInfo().then(u => this.setData({ userInfo: u })).catch(() => {
        this.setData({ userInfo: null });
      });
      return;
    }
    app.silentLogin().then(() => {
      this.setData({ userInfo: app.globalData.userInfo });
    });
  },

  async login() {
    await app.login();
    this.setData({ userInfo: app.globalData.userInfo });
  },

  navigate(e) {
    const url = e.currentTarget.dataset.url;
    if (!app.globalData.token) return this.login().then(() => wx.navigateTo({ url }));
    wx.navigateTo({ url });
  },

  goOrders(e) {
    const status = e.currentTarget.dataset.status || '';
    const url = `/pages/order/list${status ? `?status=${status}` : ''}`;
    if (!app.globalData.token) {
      return this.login().then(() => wx.navigateTo({ url }));
    }
    wx.navigateTo({ url });
  }
});
