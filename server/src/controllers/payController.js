const { Order } = require('../models');
const config = require('../config');
const { success, fail } = require('../utils/response');
const { isPayConfigured, createJsapiPayment, verifyNotifySign, parseXml } = require('../utils/wechatPay');

async function createPayment(req, res) {
  const order = await Order.findOne({
    where: { id: req.params.orderId, user_id: req.user.id, status: 'pending_payment' }
  });
  if (!order) return fail(res, '订单不存在或已支付');

  if (!isPayConfigured(config)) {
    return success(res, {
      mock: true,
      orderId: order.id,
      orderNo: order.order_no,
      payAmount: parseFloat(order.pay_amount).toFixed(2),
      message: '未配置微信支付商户号，当前为模拟支付'
    });
  }

  if (!req.user.openid) {
    return fail(res, '用户未绑定微信，请重新登录');
  }

  try {
    const payParams = await createJsapiPayment({
      config,
      order,
      openid: req.user.openid,
      clientIp: req.ip
    });
    success(res, { orderId: order.id, payParams });
  } catch (err) {
    fail(res, err.message || '微信支付下单失败');
  }
}

async function payNotify(req, res) {
  try {
    let data = req.body;
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      data = parseXml(String(data));
    } else if (!data?.out_trade_no && req.rawBody) {
      data = parseXml(String(req.rawBody));
    }

    if (!data?.out_trade_no) {
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
    }

    if (config.wx.apiKey && data.sign && !verifyNotifySign(data, config.wx.apiKey)) {
      return res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
    }

    if (data.return_code === 'SUCCESS' && data.result_code === 'SUCCESS') {
      const order = await Order.findOne({ where: { order_no: data.out_trade_no } });
      if (order && order.status === 'pending_payment') {
        await order.update({
          status: 'paid',
          pay_time: new Date(),
          pay_type: 'wechat',
          transaction_id: data.transaction_id
        });
      }
    }
    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch {
    res.send('<xml><return_code><![CDATA[FAIL]]></return_code></xml>');
  }
}

async function mockPay(req, res) {
  const order = await Order.findOne({
    where: { id: req.params.orderId, user_id: req.user.id, status: 'pending_payment' }
  });
  if (!order) return fail(res, '订单不存在或已支付');

  await order.update({
    status: 'paid',
    pay_time: new Date(),
    pay_type: 'wechat_mock'
  });
  success(res, { orderId: order.id, status: 'paid' }, '支付成功');
}

module.exports = { createPayment, payNotify, mockPay };
