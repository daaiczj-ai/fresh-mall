const config = require('./utils/config');
const { preloadTabPages, prefetchTabData } = require('./utils/tab-prefetch');

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: config.baseUrl,
    categoriesCache: null,
    cartCache: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.getUserInfo().catch(() => this.silentLogin());
    } else {
      this.silentLogin();
    }
    preloadTabPages();
    setTimeout(() => prefetchTabData(this), 300);
  },

  silentLogin() {
    return this.login().catch(err => {
      console.warn('[login] 静默登录失败', err);
    });
  },

  getUserInfo() {
    const { request } = require('./utils/request');
    return request({ url: '/auth/profile' }).then(res => {
      this.globalData.userInfo = res;
      return res;
    }).catch(() => {});
  },

  login() {
    const { request } = require('./utils/request');
    return new Promise((resolve, reject) => {
      wx.login({
        success: async (loginRes) => {
          try {
            const res = await request({
              url: '/auth/wx-login',
              method: 'POST',
              data: { code: loginRes.code }
            });
            this.globalData.token = res.token;
            this.globalData.userInfo = res.user;
            wx.setStorageSync('token', res.token);
            resolve(res);
          } catch (err) {
            reject(err);
          }
        },
        fail: reject
      });
    });
  },

  checkLogin() {
    if (!this.globalData.token) {
      return this.login();
    }
    return Promise.resolve(this.globalData.userInfo);
  }
});
