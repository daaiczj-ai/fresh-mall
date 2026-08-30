const config = require('./config');

let loadingCount = 0;

function getAppInstance() {
  try {
    return getApp();
  } catch (e) {
    return null;
  }
}

function showRequestLoading() {
  if (loadingCount === 0) {
    wx.showLoading({ title: '加载中', mask: true });
  }
  loadingCount++;
}

function hideRequestLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    wx.hideLoading();
  }
}

function request({ url, method = 'GET', data = {}, showLoading = false }) {
  const app = getAppInstance();
  const baseUrl = (app && app.globalData.baseUrl) || config.baseUrl;
  const token = (app && app.globalData.token) || wx.getStorageSync('token') || '';

  if (showLoading) showRequestLoading();

  return new Promise((resolve, reject) => {
    wx.request({
      url: baseUrl + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        if (showLoading) hideRequestLoading();
        if (res.statusCode === 200 && res.data.code === 0) {
          resolve(res.data.data);
        } else if (res.statusCode === 401 && app) {
          app.login().then(() => {
            request({ url, method, data, showLoading: false }).then(resolve).catch(reject);
          }).catch(() => {
            wx.showToast({ title: '请先登录', icon: 'none' });
            reject(res.data);
          });
        } else {
          const tip = res.data?.message || (res.statusCode === 401 ? '请先登录' : '请求失败');
          wx.showToast({ title: tip, icon: 'none' });
          reject(res.data || { message: tip });
        }
      },
      fail(err) {
        if (showLoading) hideRequestLoading();
        const errMsg = err.errMsg || '';
        let tip = '网络错误';
        if (/connect|refused|timeout|abort/i.test(errMsg)) {
          tip = '无法连接服务器，请确认后端已启动';
        }
        wx.showToast({ title: tip, icon: 'none', duration: 2500 });
        reject(err);
      }
    });
  });
}

module.exports = { request };
