const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..', 'images', 'categories');
const px = (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&w=200&h=200&fit=crop`;

const cats = [
  ['fruit', 1132047],
  ['vegetable', 264537],
  ['meat', 618775],
  ['dairy', 416471],
  ['grain', 4110257],
  ['snack', 4198379],
  ['daily', 3738375]
];

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

(async () => {
  fs.mkdirSync(root, { recursive: true });
  for (const [name, id] of cats) {
    const buf = await download(px(id));
    fs.writeFileSync(path.join(root, `${name}.png`), buf);
    console.log('✓', name);
  }
})();
