const api = require('../services/api');

/**
 * 发起订单支付
 * - 开发环境：跳转支付页 / 模拟支付
 * - 生产环境：配置商户号后走 wx.requestPayment
 */
function payOrder(orderId, { redirect = true } = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      const payment = await api.createPayment(orderId);

      if (payment.mock) {
        const confirmed = await showMockPayConfirm(payment.payAmount);
        if (!confirmed) return reject({ cancelled: true });
        const result = await api.mockPay(orderId);
        resolve(result);
        if (redirect) {
          wx.redirectTo({ url: `/pages/order/detail?id=${orderId}` });
        }
        return;
      }

      if (payment.payParams) {
        wx.requestPayment({
          ...payment.payParams,
          success: () => {
            resolve({ orderId });
            if (redirect) {
              wx.redirectTo({ url: `/pages/order/detail?id=${orderId}` });
            }
          },
          fail: (err) => {
            if (err.errMsg?.includes('cancel')) {
              wx.showToast({ title: '已取消支付', icon: 'none' });
              reject({ cancelled: true });
            } else {
              wx.showToast({ title: '支付失败', icon: 'none' });
              reject(err);
            }
          }
        });
        return;
      }

      wx.showToast({ title: '支付配置异常', icon: 'none' });
      reject(new Error('支付配置异常'));
    } catch (err) {
      reject(err);
    }
  });
}

function showMockPayConfirm(amount) {
  return new Promise(resolve => {
    wx.showModal({
      title: '模拟支付',
      content: `当前未配置微信支付商户号\n将使用模拟支付，金额 ¥${amount}\n\n配置商户号后可使用真实微信支付`,
      confirmText: '模拟支付',
      cancelText: '取消',
      confirmColor: '#2ECC71',
      success: res => resolve(res.confirm)
    });
  });
}

module.exports = { payOrder };
