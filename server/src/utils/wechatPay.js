const crypto = require('crypto');
const https = require('https');

function md5Sign(params, apiKey) {
  const str = Object.keys(params)
    .filter(k => params[k] !== '' && params[k] !== undefined && k !== 'sign')
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&') + `&key=${apiKey}`;
  return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
}

function buildXml(obj) {
  let xml = '<xml>';
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    xml += `<${k}><![CDATA[${v}]]></${k}>`;
  }
  xml += '</xml>';
  return xml;
}

function parseXml(xml) {
  const result = {};
  const re = /<(\w+)><!\[CDATA\[(.*?)\]\]><\/\1>|<(\w+)>(.*?)<\/\3>/g;
  let match;
  while ((match = re.exec(xml)) !== null) {
    const key = match[1] || match[3];
    result[key] = match[2] || match[4];
  }
  return result;
}

function postXml(url, xml) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(xml) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(parseXml(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(xml);
    req.end();
  });
}

function isPayConfigured(config) {
  return !!(config.wx.appId && config.wx.mchId && config.wx.apiKey && config.wx.notifyUrl
    && config.wx.notifyUrl.startsWith('https://'));
}

async function createJsapiPayment({ config, order, openid, clientIp }) {
  const nonceStr = crypto.randomBytes(16).toString('hex');
  const params = {
    appid: config.wx.appId,
    mch_id: config.wx.mchId,
    nonce_str: nonceStr,
    body: '社区生鲜店订单',
    out_trade_no: order.order_no,
    total_fee: Math.round(parseFloat(order.pay_amount) * 100),
    spbill_create_ip: (clientIp || '127.0.0.1').replace('::ffff:', ''),
    notify_url: config.wx.notifyUrl,
    trade_type: 'JSAPI',
    openid
  };
  params.sign = md5Sign(params, config.wx.apiKey);

  const result = await postXml('https://api.mch.weixin.qq.com/pay/unifiedorder', buildXml(params));
  if (result.return_code !== 'SUCCESS') {
    throw new Error(result.return_msg || '微信支付下单失败');
  }
  if (result.result_code !== 'SUCCESS') {
    throw new Error(result.err_code_des || result.err_code || '微信支付下单失败');
  }

  const timeStamp = String(Math.floor(Date.now() / 1000));
  const payNonce = crypto.randomBytes(16).toString('hex');
  const pkg = `prepay_id=${result.prepay_id}`;
  const payParams = {
    timeStamp,
    nonceStr: payNonce,
    package: pkg,
    signType: 'MD5'
  };
  payParams.paySign = md5Sign({
    appId: config.wx.appId,
    timeStamp,
    nonceStr: payNonce,
    package: pkg,
    signType: 'MD5'
  }, config.wx.apiKey);

  return payParams;
}

function verifyNotifySign(data, apiKey) {
  const sign = data.sign;
  const copy = { ...data };
  delete copy.sign;
  return sign === md5Sign(copy, apiKey);
}

module.exports = { isPayConfigured, createJsapiPayment, verifyNotifySign, parseXml };
