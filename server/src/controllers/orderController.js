const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  Order, OrderItem, Cart, Product, ProductSku, Address, Store,
  UserCoupon, Coupon, User, PointsLog, MemberLevel
} = require('../models');
const { success, fail, paginate, generateOrderNo, generatePickupCode } = require('../utils/response');
const { getUnitPrice, calcItemAmount } = require('../utils/productPrice');
const config = require('../config');

async function preview(req, res) {
  const { cartIds, deliveryType, addressId, storeId, couponId, pointsUsed = 0 } = req.body;

  const items = await getOrderItems(req.user.id, cartIds);
  if (!items.length) return fail(res, '请选择商品');

  const productAmount = calcProductAmount(items);
  let deliveryFee = 0;

  if (deliveryType === 'delivery') {
    const address = await Address.findOne({ where: { id: addressId, user_id: req.user.id } });
    if (!address) return fail(res, '请选择收货地址');
    const store = await Store.findByPk(storeId || 1);
    deliveryFee = productAmount >= parseFloat(store.free_delivery_amount) ? 0 : parseFloat(store.delivery_fee);
  }

  let couponAmount = 0;
  if (couponId) {
    couponAmount = await calcCouponDiscount(req.user.id, couponId, productAmount, deliveryType);
  }

  const pointsAmount = Math.min(pointsUsed / 100, productAmount * 0.1);
  const payAmount = Math.max(0, productAmount + deliveryFee - couponAmount - pointsAmount);

  const enrichedItems = items.map(item => {
    const json = item.toJSON();
    return {
      ...json,
      subtotal: calcItemAmount(json.product, json.sku, json.quantity, json.weight).toFixed(2)
    };
  });

  success(res, {
    items: enrichedItems,
    productAmount: productAmount.toFixed(2),
    deliveryFee: deliveryFee.toFixed(2),
    couponAmount: couponAmount.toFixed(2),
    pointsAmount: pointsAmount.toFixed(2),
    payAmount: payAmount.toFixed(2),
    pointsEarned: Math.floor(payAmount)
  });
}

async function create(req, res) {
  const {
    cartIds, deliveryType, addressId, storeId, pickupTime,
    deliveryTimeSlot, couponId, pointsUsed = 0, remark
  } = req.body;

  const t = await sequelize.transaction();
  try {
    const items = await getOrderItems(req.user.id, cartIds);
    if (!items.length) { await t.rollback(); return fail(res, '请选择商品'); }

    for (const item of items) {
      const stock = item.sku ? item.sku.stock : item.product.stock;
      const need = item.product.product_type === 'weight' ? 1 : item.quantity;
      if (stock < need) { await t.rollback(); return fail(res, `${item.product.name} 库存不足`); }
    }

    const productAmount = calcProductAmount(items);
    let deliveryFee = 0;
    let addressSnapshot = null;
    let pickupStoreId = null;
    let pickupCode = null;

    if (deliveryType === 'delivery') {
      const address = await Address.findOne({ where: { id: addressId, user_id: req.user.id } });
      if (!address) { await t.rollback(); return fail(res, '请选择收货地址'); }
      addressSnapshot = address.toJSON();
      const store = await Store.findByPk(storeId || 1);
      deliveryFee = productAmount >= parseFloat(store.free_delivery_amount) ? 0 : parseFloat(store.delivery_fee);
    } else {
      pickupStoreId = storeId;
      pickupCode = generatePickupCode();
    }

    let couponAmount = 0;
    if (couponId) {
      couponAmount = await calcCouponDiscount(req.user.id, couponId, productAmount, deliveryType);
    }

    const pointsAmount = Math.min(pointsUsed / 100, productAmount * 0.1);
    const payAmount = Math.max(0, productAmount + deliveryFee - couponAmount - pointsAmount);

    const order = await Order.create({
      order_no: generateOrderNo(),
      user_id: req.user.id,
      store_id: storeId || 1,
      delivery_type: deliveryType,
      status: 'pending_payment',
      total_amount: productAmount + deliveryFee,
      product_amount: productAmount,
      delivery_fee: deliveryFee,
      discount_amount: couponAmount + pointsAmount,
      coupon_amount: couponAmount,
      points_amount: pointsAmount,
      pay_amount: payAmount,
      coupon_id: couponId || null,
      points_used: pointsUsed,
      points_earned: Math.floor(payAmount),
      address_snapshot: addressSnapshot,
      pickup_store_id: pickupStoreId,
      pickup_code: pickupCode,
      pickup_time: pickupTime ? new Date(pickupTime) : null,
      delivery_time_slot: deliveryTimeSlot,
      remark
    }, { transaction: t });

    for (const item of items) {
      const json = item.toJSON();
      const unitPrice = getUnitPrice(json.product, json.sku);
      const subtotal = calcItemAmount(json.product, json.sku, json.quantity, json.weight);

      await OrderItem.create({
        order_id: order.id,
        product_id: json.product.id,
        sku_id: json.sku?.id,
        product_name: json.product.name,
        product_image: json.sku?.image || json.product.cover,
        sku_name: json.sku?.sku_name,
        price: unitPrice,
        quantity: json.quantity,
        weight: json.weight,
        unit: json.product.unit,
        subtotal: subtotal.toFixed(2)
      }, { transaction: t });

      if (json.sku) {
        await ProductSku.decrement('stock', { by: json.quantity, where: { id: json.sku.id }, transaction: t });
      } else {
        await Product.decrement('stock', { by: json.product.product_type === 'weight' ? 1 : json.quantity, where: { id: json.product.id }, transaction: t });
      }
    }

    if (couponId) {
      await UserCoupon.update({ status: 'used', order_id: order.id, used_time: new Date() }, { where: { id: couponId, user_id: req.user.id }, transaction: t });
    }

    if (pointsUsed > 0) {
      await User.decrement('points', { by: pointsUsed, where: { id: req.user.id }, transaction: t });
      await PointsLog.create({ user_id: req.user.id, points: -pointsUsed, type: 'spend', source: 'order', order_id: order.id, remark: '订单抵扣' }, { transaction: t });
    }

    await Cart.destroy({ where: { id: cartIds, user_id: req.user.id }, transaction: t });
    await t.commit();

    success(res, { orderId: order.id, orderNo: order.order_no, payAmount: order.pay_amount }, '订单创建成功');
  } catch (err) {
    await t.rollback();
    fail(res, err.message);
  }
}

async function getOrders(req, res) {
  const { status, page = 1, pageSize = 10 } = req.query;
  const where = { user_id: req.user.id };

  const statusGroups = {
    processing: ['paid', 'preparing'],
    receiving: ['delivering', 'ready_pickup']
  };
  if (status) {
    where.status = statusGroups[status]
      ? { [Op.in]: statusGroups[status] }
      : status;
  }

  const result = await Order.findAndCountAll({
    where,
    include: [
      { model: OrderItem, as: 'items' },
      { model: Store, as: 'pickupStore', attributes: ['id', 'name', 'address'] }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });

  const rows = result.rows.map(o => {
    const json = o.toJSON();
    json.items = json.items || [];
    return json;
  });
  paginate(res, { rows, count: result.count }, page, pageSize);
}

async function getOrderDetail(req, res) {
  const order = await Order.findOne({
    where: { id: req.params.id, user_id: req.user.id },
    include: [
      { model: OrderItem, as: 'items' },
      { model: Store, as: 'pickupStore' }
    ]
  });
  if (!order) return fail(res, '订单不存在', 404, 404);
  const json = order.toJSON();
  json.items = json.items || [];
  success(res, json);
}

async function cancelOrder(req, res) {
  const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!order) return fail(res, '订单不存在');
  if (!['pending_payment', 'paid', 'preparing'].includes(order.status)) return fail(res, '当前状态不可取消');

  const t = await sequelize.transaction();
  try {
    await order.update({ status: 'cancelled', cancel_reason: req.body.reason || '用户取消', cancel_time: new Date() }, { transaction: t });

    const items = await OrderItem.findAll({ where: { order_id: order.id } });
    for (const item of items) {
      if (item.sku_id) {
        await ProductSku.increment('stock', { by: item.quantity, where: { id: item.sku_id }, transaction: t });
      } else {
        await Product.increment('stock', { by: item.quantity, where: { id: item.product_id }, transaction: t });
      }
    }

    if (order.coupon_id) {
      await UserCoupon.update({ status: 'unused', order_id: null, used_time: null }, { where: { id: order.coupon_id }, transaction: t });
    }
    if (order.points_used > 0) {
      await User.increment('points', { by: order.points_used, where: { id: req.user.id }, transaction: t });
    }

    await t.commit();
    success(res, null, '订单已取消');
  } catch (err) {
    await t.rollback();
    fail(res, err.message);
  }
}

async function confirmReceive(req, res) {
  const order = await Order.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!order) return fail(res, '订单不存在');
  if (!['delivering', 'ready_pickup'].includes(order.status)) return fail(res, '当前状态不可确认收货');

  await order.update({ status: 'completed', complete_time: new Date() });
  if (order.points_earned > 0) {
    await User.increment('points', { by: order.points_earned, where: { id: req.user.id } });
    await PointsLog.create({ user_id: req.user.id, points: order.points_earned, type: 'earn', source: 'order', order_id: order.id, remark: '购物获得积分' });
  }
  await User.increment('total_spent', { by: order.pay_amount, where: { id: req.user.id } });
  success(res, null, '已确认收货');
}

async function getOrderItems(userId, cartIds) {
  return Cart.findAll({
    where: { id: cartIds, user_id: userId, selected: true },
    include: [
      { model: Product, as: 'product' },
      { model: ProductSku, as: 'sku' }
    ]
  });
}

function calcProductAmount(items) {
  return items.reduce((sum, item) => {
    const json = item.toJSON ? item.toJSON() : item;
    return sum + calcItemAmount(json.product, json.sku, json.quantity, json.weight);
  }, 0);
}

async function calcCouponDiscount(userId, couponUserId, productAmount, deliveryType) {
  const userCoupon = await UserCoupon.findOne({
    where: { id: couponUserId, user_id: userId, status: 'unused' },
    include: [{ model: Coupon, as: 'coupon' }]
  });
  if (!userCoupon || !userCoupon.coupon) return 0;
  if (userCoupon.expire_time && new Date(userCoupon.expire_time) < new Date()) return 0;

  const coupon = userCoupon.coupon;
  if (coupon.min_amount && productAmount < parseFloat(coupon.min_amount)) return 0;
  if (coupon.type === 'delivery' && deliveryType !== 'delivery') return 0;

  switch (coupon.type) {
    case 'full_reduce':
    case 'new_user':
    case 'product':
      return parseFloat(coupon.value);
    case 'discount': {
      let discount = productAmount * (1 - parseFloat(coupon.value));
      if (coupon.max_discount) discount = Math.min(discount, parseFloat(coupon.max_discount));
      return discount;
    }
    case 'delivery':
      return parseFloat(coupon.value);
    default:
      return 0;
  }
}

module.exports = { preview, create, getOrders, getOrderDetail, cancelOrder, confirmReceive };
