const TAB_PAGES = [
  '/pages/category/category',
  '/pages/cart/cart',
  '/pages/user/user'
];

function preloadTabPages() {
  if (!wx.preloadPage) return;
  TAB_PAGES.forEach(url => {
    wx.preloadPage({ url }).catch(() => {});
  });
}

function prefetchTabData(app) {
  const { request } = require('./request');

  if (!app.globalData.categoriesCache) {
    request({ url: '/categories' })
      .then(cats => { app.globalData.categoriesCache = cats; })
      .catch(() => {});
  }

  if (app.globalData.token && !app.globalData.cartCache) {
    request({ url: '/cart' })
      .then(res => { app.globalData.cartCache = res; })
      .catch(() => {});
  }
}

module.exports = { preloadTabPages, prefetchTabData };
