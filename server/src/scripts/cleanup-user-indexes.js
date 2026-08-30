/**
 * 清理 users 表上 Sequelize alter 重复创建的 openid 索引
 * 用法: node src/scripts/cleanup-user-indexes.js
 */
require('dotenv').config();
const sequelize = require('../config/database');

async function main() {
  await sequelize.authenticate();
  const [indexes] = await sequelize.query('SHOW INDEX FROM `users`');
  const openidIndexes = indexes.filter(i => i.Column_name === 'openid' && i.Key_name !== 'PRIMARY');
  console.log(`openid 相关索引 ${openidIndexes.length} 个`);

  const byName = {};
  for (const idx of openidIndexes) {
    byName[idx.Key_name] = byName[idx.Key_name] || [];
    byName[idx.Key_name].push(idx);
  }

  const names = Object.keys(byName);
  if (names.length <= 1) {
    console.log('无需清理');
    await sequelize.close();
    return;
  }

  // 保留一个 openid 唯一索引，删除其余
  const keep = names.find(n => n === 'openid') || names[0];
  for (const name of names) {
    if (name === keep) continue;
    console.log(`删除索引: ${name}`);
    await sequelize.query(`ALTER TABLE \`users\` DROP INDEX \`${name}\``);
  }

  console.log(`保留索引: ${keep}`);
  await sequelize.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
