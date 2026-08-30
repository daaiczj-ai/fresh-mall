const { Op } = require('sequelize');
const dayjs = require('dayjs');
const { Coupon, UserCoupon, MemberLevel, PointsLog, Favorite, Review, AfterSale, Store, Order } = require('../models');
const { success, fail, paginate } = require('../utils/response');

async function getAvailableCoupons(req, res) {
  const now = new Date();
  const coupons = await Coupon.findAll({
    where: { status: 1, start_time: { [Op.lte]: now }, end_time: { [Op.gte]: now } }
  });

  const received = await UserCoupon.findAll({
    where: { user_id: req.user.id },
    attributes: ['coupon_id']
  });
  const receivedIds = received.map(r => r.coupon_id);

  const available = coupons.filter(c => {
    if (c.total_count !== -1 && c.received_count >= c.total_count) return false;
    const count = received.filter(r => r.coupon_id === c.id).length;
    return count < c.per_limit;
  }).map(c => ({ ...c.toJSON(), received: receivedIds.includes(c.id) }));

  success(res, available);
}

async function receiveCoupon(req, res) {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon || coupon.status !== 1) return fail(res, '优惠券不存在');

  const count = await UserCoupon.count({ where: { user_id: req.user.id, coupon_id: coupon.id } });
  if (count >= coupon.per_limit) return fail(res, '已达领取上限');

  const expireTime = coupon.valid_days
    ? dayjs().add(coupon.valid_days, 'day').toDate()
    : coupon.end_time;

  const userCoupon = await UserCoupon.create({
    user_id: req.user.id,
    coupon_id: coupon.id,
    expire_time: expireTime
  });
  await coupon.increment('received_count');
  success(res, userCoupon, '领取成功');
}

async function getMyCoupons(req, res) {
  const { status } = req.query;
  const where = { user_id: req.user.id };
  if (status) where.status = status;

  const coupons = await UserCoupon.findAll({
    where,
    include: [{ model: Coupon, as: 'coupon' }],
    order: [['created_at', 'DESC']]
  });
  success(res, coupons);
}

async function getMemberInfo(req, res) {
  const levels = await MemberLevel.findAll({ order: [['level', 'ASC']] });
  const currentLevel = levels.filter(l => l.level <= req.user.member_level).pop();
  const nextLevel = levels.find(l => l.level > req.user.member_level);

  success(res, {
    points: req.user.points,
    memberLevel: req.user.member_level,
    totalSpent: parseFloat(req.user.total_spent),
    currentLevel,
    nextLevel,
    levels
  });
}

async function getPointsLog(req, res) {
  const { page = 1, pageSize = 20 } = req.query;
  const result = await PointsLog.findAndCountAll({
    where: { user_id: req.user.id },
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

async function getFavorites(req, res) {
  const favorites = await Favorite.findAll({
    where: { user_id: req.user.id },
    include: [{ association: 'product', attributes: ['id', 'name', 'cover', 'price', 'unit', 'status'] }],
    order: [['created_at', 'DESC']]
  });
  success(res, favorites);
}

async function toggleFavorite(req, res) {
  const { productId } = req.body;
  const existing = await Favorite.findOne({ where: { user_id: req.user.id, product_id: productId } });
  if (existing) {
    await existing.destroy();
    success(res, { favorited: false }, '已取消收藏');
  } else {
    await Favorite.create({ user_id: req.user.id, product_id: productId });
    success(res, { favorited: true }, '已收藏');
  }
}

async function createReview(req, res) {
  const { orderId, productId, rating, content, images, isAnonymous } = req.body;
  const review = await Review.create({
    user_id: req.user.id, order_id: orderId, product_id: productId,
    rating, content, images, is_anonymous: isAnonymous
  });
  success(res, review, '评价成功');
}

async function getProductReviews(req, res) {
  const { productId, page = 1, pageSize = 10 } = req.query;
  const result = await Review.findAndCountAll({
    where: { product_id: productId, status: 1 },
    include: [{ association: 'user', attributes: ['nickname', 'avatar'] }],
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

async function createAfterSale(req, res) {
  const { orderId, type, reason, description, images, refundAmount } = req.body;
  const { Order, AfterSale } = require('../models');

  const order = await Order.findOne({ where: { id: orderId, user_id: req.user.id } });
  if (!order) return fail(res, '订单不存在');
  if (['pending_payment', 'cancelled', 'refunding', 'refunded'].includes(order.status)) {
    return fail(res, '当前订单不可申请售后');
  }

  const pending = await AfterSale.findOne({ where: { order_id: orderId, status: 'pending' } });
  if (pending) return fail(res, '该订单已有待处理的售后申请');

  const amount = refundAmount !== undefined && refundAmount !== ''
    ? parseFloat(refundAmount)
    : parseFloat(order.pay_amount);
  if (Number.isNaN(amount) || amount <= 0) return fail(res, '退款金额无效');
  if (amount > parseFloat(order.pay_amount)) return fail(res, '退款金额不能超过实付金额');

  const afterSale = await AfterSale.create({
    order_id: orderId,
    user_id: req.user.id,
    type,
    reason,
    description,
    images,
    refund_amount: amount.toFixed(2)
  });
  success(res, afterSale, '售后申请已提交');
}

async function getAfterSales(req, res) {
  const list = await AfterSale.findAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_no', 'pay_amount', 'status']
      }
    ],
    order: [['created_at', 'DESC']]
  });
  success(res, list);
}

async function getStores(req, res) {
  const stores = await Store.findAll({
    where: { status: 1 },
    order: [['sort', 'ASC']]
  });
  success(res, stores);
}

module.exports = {
  getAvailableCoupons, receiveCoupon, getMyCoupons,
  getMemberInfo, getPointsLog, getFavorites, toggleFavorite,
  createReview, getProductReviews, createAfterSale, getAfterSales, getStores
};
