const https = require('https');
const config = require('../config');
const { User } = require('../models');
const { success, fail, generateToken } = require('../utils/response');

async function wxLogin(req, res) {
  const { code, nickname, avatar } = req.body;
  if (!code) return fail(res, '缺少登录凭证');

  try {
    let wxData;
    const secretMissing = !config.wx.secret || config.wx.secret === 'your_wx_secret';
    const appIdMissing = !config.wx.appId || config.wx.appId === 'your_wx_appid';

    if (appIdMissing || secretMissing) {
      wxData = { openid: `dev_${code}` };
    } else {
      wxData = await getWxSession(code);
      if (wxData.errcode) {
        return fail(res, wxData.errmsg || `微信登录失败(${wxData.errcode})，请检查 AppID 和 AppSecret`);
      }
    }
    if (!wxData.openid) return fail(res, '微信登录失败');

    let [user] = await User.findOrCreate({
      where: { openid: wxData.openid },
      defaults: { nickname: nickname || '微信用户', avatar: avatar || '' }
    });

    if (nickname && user.nickname === '微信用户') {
      await user.update({ nickname, avatar: avatar || user.avatar });
    }

    const token = generateToken({ id: user.id, type: 'user' });
    success(res, { token, user: formatUser(user) });
  } catch (err) {
    fail(res, err.message);
  }
}

function getWxSession(code) {
  return new Promise((resolve, reject) => {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wx.appId}&secret=${config.wx.secret}&js_code=${code}&grant_type=authorization_code`;
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function getProfile(req, res) {
  success(res, formatUser(req.user));
}

async function updateProfile(req, res) {
  const { nickname, avatar, gender } = req.body;
  const updates = {};
  if (nickname) updates.nickname = nickname;
  if (avatar) updates.avatar = avatar;
  if (gender !== undefined) updates.gender = gender;
  await req.user.update(updates);
  success(res, formatUser(req.user));
}

async function bindPhone(req, res) {
  const { phone } = req.body;
  if (!phone || !/^1\d{10}$/.test(phone)) return fail(res, '手机号格式不正确');
  await req.user.update({ phone });
  success(res, formatUser(req.user));
}

function formatUser(user) {
  return {
    id: user.id,
    nickname: user.nickname,
    avatar: user.avatar,
    phone: user.phone,
    gender: user.gender,
    memberLevel: user.member_level,
    points: user.points,
    totalSpent: parseFloat(user.total_spent)
  };
}

module.exports = { wxLogin, getProfile, updateProfile, bindPhone };
