const { User } = require('../models');

async function syncUserPhone(userId, phone) {
  if (!phone || !/^1\d{10}$/.test(phone)) return;
  const user = await User.findByPk(userId);
  if (user && !user.phone) {
    await user.update({ phone });
  }
}

module.exports = { syncUserPhone };
