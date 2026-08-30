const { Address } = require('../models');
const { success, fail } = require('../utils/response');
const { syncUserPhone } = require('../utils/userPhone');

async function getAddresses(req, res) {
  const addresses = await Address.findAll({
    where: { user_id: req.user.id },
    order: [['is_default', 'DESC'], ['created_at', 'DESC']]
  });
  success(res, addresses);
}

async function createAddress(req, res) {
  const { name, phone, province, city, district, detail, latitude, longitude, isDefault, tag } = req.body;
  if (!name || !phone || !detail) return fail(res, '请填写完整地址信息');

  if (isDefault) {
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  }

  const address = await Address.create({
    user_id: req.user.id, name, phone, province, city, district, detail,
    latitude, longitude, is_default: isDefault || false, tag
  });
  const isFirst = (await Address.count({ where: { user_id: req.user.id } })) === 1;
  if (isDefault || isFirst) await syncUserPhone(req.user.id, phone);
  success(res, address, '地址添加成功');
}

async function updateAddress(req, res) {
  const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!address) return fail(res, '地址不存在');

  const { name, phone, province, city, district, detail, latitude, longitude, isDefault, tag } = req.body;
  if (isDefault) {
    await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  }

  await address.update({ name, phone, province, city, district, detail, latitude, longitude, is_default: isDefault, tag });
  if (isDefault) await syncUserPhone(req.user.id, phone);
  success(res, address, '地址更新成功');
}

async function deleteAddress(req, res) {
  const deleted = await Address.destroy({ where: { id: req.params.id, user_id: req.user.id } });
  if (!deleted) return fail(res, '地址不存在');
  success(res, null, '地址已删除');
}

async function setDefault(req, res) {
  await Address.update({ is_default: false }, { where: { user_id: req.user.id } });
  const address = await Address.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!address) return fail(res, '地址不存在');
  await address.update({ is_default: true });
  await syncUserPhone(req.user.id, address.phone);
  success(res, null, '已设为默认地址');
}

module.exports = { getAddresses, createAddress, updateAddress, deleteAddress, setDefault };
