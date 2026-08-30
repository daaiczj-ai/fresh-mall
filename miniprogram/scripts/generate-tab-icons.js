/**
 * 生成 TabBar 矢量风格图标 (81x81 PNG)
 * 运行: node scripts/generate-tab-icons.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '../images/tab');

const ICONS = {
  home: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81" fill="none">
    <path d="M40.5 15L17 36.5V64.5H32.5V47.5H48.5V64.5H64V36.5L40.5 15Z" stroke="${c}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
    <path d="M32.5 47.5H48.5V64.5" stroke="${c}" stroke-width="4" stroke-linejoin="round"/>
  </svg>`,

  category: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81" fill="none">
    <rect x="16" y="16" width="22" height="22" rx="4" stroke="${c}" stroke-width="4"/>
    <rect x="43" y="16" width="22" height="22" rx="4" stroke="${c}" stroke-width="4"/>
    <rect x="16" y="43" width="22" height="22" rx="4" stroke="${c}" stroke-width="4"/>
    <rect x="43" y="43" width="22" height="22" rx="4" stroke="${c}" stroke-width="4"/>
  </svg>`,

  cart: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81" fill="none">
    <path d="M20 20H24.5L28.5 52.5H60.5L64.5 28.5H27" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="33" cy="60.5" r="3.5" fill="${c}"/>
    <circle cx="55" cy="60.5" r="3.5" fill="${c}"/>
    <path d="M28.5 52.5H58.5C60.5 52.5 62 54 62 56V58" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  user: (c) => `<svg xmlns="http://www.w3.org/2000/svg" width="81" height="81" viewBox="0 0 81 81" fill="none">
    <circle cx="40.5" cy="28" r="11" stroke="${c}" stroke-width="4"/>
    <path d="M18 64.5C18 52.5 28 46.5 40.5 46.5C53 46.5 63 52.5 63 64.5" stroke="${c}" stroke-width="4" stroke-linecap="round"/>
  </svg>`
};

const COLOR_NORMAL = '#999999';
const COLOR_ACTIVE = '#2ECC71';

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('正在安装 sharp...');
    const { execSync } = require('child_process');
    execSync('npm install sharp --no-save', { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
    sharp = require('sharp');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [name, svgFn] of Object.entries(ICONS)) {
    const normalSvg = Buffer.from(svgFn(COLOR_NORMAL));
    const activeSvg = Buffer.from(svgFn(COLOR_ACTIVE));

    await sharp(normalSvg).resize(81, 81).png().toFile(path.join(OUT_DIR, `${name}.png`));
    await sharp(activeSvg).resize(81, 81).png().toFile(path.join(OUT_DIR, `${name}-active.png`));
    console.log('✓', name);
  }

  console.log('Tab 图标已生成:', OUT_DIR);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
