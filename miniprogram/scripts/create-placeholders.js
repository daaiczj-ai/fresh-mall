const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..');

function download(url, filePath) {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const file = fs.createWriteStream(filePath);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        return download(res.headers.location, filePath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

const products = [
  ['apple', '苹果', 'E74C3C'],
  ['banana', '香蕉', 'F1C40F'],
  ['orange', '橙子', 'E67E22'],
  ['tomato', '西红柿', 'C0392B'],
  ['lettuce', '生菜', '27AE60'],
  ['cucumber', '黄瓜', '2ECC71'],
  ['egg', '鸡蛋', 'F39C12'],
  ['pork', '猪肉', 'E59866'],
  ['milk', '牛奶', '3498DB'],
  ['rice', '大米', 'F5F5DC'],
  ['chips', '零食', '9B59B6'],
  ['tissue', '抽纸', '95A5A6']
];

const banners = [
  ['newuser', '新人专享', '2ECC71'],
  ['fruit', '时令水果', '27AE60'],
  ['delivery', '满39免配送', '16A085']
];

async function main() {
  for (const [name, text, color] of products) {
    const url = `https://placehold.co/400x400/${color}/FFFFFF/png?text=${encodeURIComponent(text)}`;
    const file = path.join(root, 'images', 'products', `${name}.png`);
    await download(url, file);
    console.log('created', file);
  }
  for (const [name, text, color] of banners) {
    const url = `https://placehold.co/750x320/${color}/FFFFFF/png?text=${encodeURIComponent(text)}`;
    const file = path.join(root, 'images', 'banner', `${name}.png`);
    await download(url, file);
    console.log('created', file);
  }
  const defaultImg = path.join(root, 'images', 'default-product.png');
  await download('https://placehold.co/400x400/EEEEEE/999999/png?text=暂无图片', defaultImg);
  console.log('done');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
