require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  jwt: {
    secret: process.env.JWT_SECRET || 'fresh_mall_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  wx: {
    appId: process.env.WX_APPID,
    secret: process.env.WX_SECRET,
    mchId: process.env.WX_MCH_ID,
    apiKey: process.env.WX_API_KEY,
    notifyUrl: process.env.WX_NOTIFY_URL
  },
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  },
  delivery: {
    defaultFee: 5,
    freeThreshold: 39,
    maxDistance: 5
  }
};
