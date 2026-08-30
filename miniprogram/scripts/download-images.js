const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..', 'images');
const px = (id, w = 600, h = 600) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}&h=${h}&fit=crop`;

const items = [
  { dir: 'products', file: 'apple.png', url: px(102104) },
  { dir: 'products', file: 'banana.png', url: px(61127) },
  { dir: 'products', file: 'orange.png', url: px(143133) },
  { dir: 'products', file: 'tomato.png', url: px(533360) },
  { dir: 'products', file: 'lettuce.png', url: px(2255935) },
  { dir: 'products', file: 'cucumber.png', url: px(2329440) },
  { dir: 'products', file: 'egg.png', url: px(1407347) },
  { dir: 'products', file: 'pork.png', url: px(618775) },
  { dir: 'products', file: 'milk.png', url: px(416471) },
  { dir: 'products', file: 'rice.png', url: px(4110257) },
  { dir: 'products', file: 'chips.png', url: px(4198379) },
  { dir: 'products', file: 'tissue.png', url: px(3738375) },
  { dir: 'banner', file: 'newuser.png', url: px(264636, 900, 400) },
  { dir: 'banner', file: 'fruit.png', url: px(1132047, 900, 400) },
  { dir: 'banner', file: 'delivery.png', url: px(264537, 900, 400) },
  { dir: '', file: 'default-product.png', url: px(264636) }
];

const categories = [
  { file: 'fruit.png', url: px(1132047, 200, 200) },
  { file: 'vegetable.png', url: px(264537, 200, 200) },
  { file: 'meat.png', url: px(618775, 200, 200) },
  { file: 'dairy.png', url: px(416471, 200, 200) },
  { file: 'grain.png', url: px(4110257, 200, 200) },
  { file: 'snack.png', url: px(4198379, 200, 200) },
  { file: 'daily.png', url: px(3738375, 200, 200) }
];

function download(url) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl) => {
      https.get(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.pexels.com' } }, (res) => {
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          return request(res.headers.location);
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }).on('error', reject);
    };
    request(url);
  });
}

async function main() {
  console.log('正在下载生鲜图片素材（Pexels）...\n');
  for (const item of items) {
    const dest = item.dir ? path.join(root, item.dir, item.file) : path.join(root, item.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = await download(item.url);
    fs.writeFileSync(dest, buf);
    const kb = (buf.length / 1024).toFixed(1);
    console.log(`  ✓ ${item.dir ? item.dir + '/' : ''}${item.file} (${kb} KB)`);
  }

  console.log('\n正在下载分类图标...');
  for (const item of categories) {
    const dest = path.join(root, 'categories', item.file);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const buf = await download(item.url);
    fs.writeFileSync(dest, buf);
    console.log(`  ✓ categories/${item.file}`);
  }
  console.log('\n全部完成！请在微信开发者工具中重新编译。');
}

main().catch(err => { console.error('下载失败:', err.message); process.exit(1); });
