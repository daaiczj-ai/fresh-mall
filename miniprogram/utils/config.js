/**
 * API 地址配置
 * - 开发者工具模拟器：默认 localhost
 * - 真机预览：复制 config.local.example.js 为 config.local.js，填入电脑局域网 IP
 */
const defaults = {
  host: 'localhost',
  port: 3000
};

let local = {};
try {
  local = require('./config.local');
} catch (e) {}

function detectHost() {
  if (local.host) return local.host;
  try {
    const sys = wx.getSystemInfoSync();
    if (sys.platform !== 'devtools') {
      console.warn('[config] 真机调试请配置 config.local.js 中的局域网 IP');
    }
  } catch (e) {}
  return defaults.host;
}

const host = detectHost();
const port = local.port || defaults.port;
const origin = `http://${host}:${port}`;

module.exports = {
  baseUrl: `${origin}/api`,
  assetBaseUrl: `${origin}/static`
};
