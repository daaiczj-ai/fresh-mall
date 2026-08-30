const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  Admin, Product, Category, ProductSku, Order, OrderItem, User,
  Store, Coupon, UserCoupon, Banner, Seckill, FlashSale, Review,
  AfterSale, MemberLevel, Address, PointsLog
} = require('../models');
const { success, fail, paginate, generateToken } = require('../utils/response');
const { syncUserPhone } = require('../utils/userPhone');
const { normalizeWeightProduct } = require('../utils/productPrice');

function normalizeProductData(data) {
  const result = normalizeWeightProduct(data);
  if (!Array.isArray(result.images)) result.images = [];
  result.images = result.images.filter(Boolean);
  if (!result.cover && result.images.length) result.cover = result.images[0];
  return result;
}
const dayjs = require('dayjs');

async function login(req, res) {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ where: { username } });
  if (!admin || admin.status !== 1) return fail(res, '账号不存在或已禁用');
  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return fail(res, '密码错误');

  await admin.update({ last_login: new Date() });
  const token = generateToken({ id: admin.id, type: 'admin' });
  success(res, { token, admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role } });
}

// 数据统计
async function getDashboard(req, res) {
  const today = dayjs().startOf('day').toDate();
  const todayOrders = await Order.count({ where: { created_at: { [Op.gte]: today }, status: { [Op.notIn]: ['cancelled', 'pending_payment'] } } });
  const todayRevenue = await Order.sum('pay_amount', { where: { created_at: { [Op.gte]: today }, status: { [Op.notIn]: ['cancelled', 'pending_payment', 'refunded'] } } }) || 0;
  const totalUsers = await User.count();
  const pendingOrders = await Order.count({ where: { status: { [Op.in]: ['paid', 'preparing'] } } });
  const lowStockProducts = await Product.count({ where: { stock: { [Op.lte]: 10 }, status: 1 } });

  const hotProducts = await OrderItem.findAll({
    attributes: ['product_id', 'product_name', [sequelize.fn('SUM', sequelize.col('quantity')), 'totalSold']],
    group: ['product_id', 'product_name'],
    order: [[sequelize.literal('totalSold'), 'DESC']],
    limit: 10,
    raw: true
  });

  const recent7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day');
    const start = date.startOf('day').toDate();
    const end = date.endOf('day').toDate();
    const count = await Order.count({ where: { created_at: { [Op.between]: [start, end] }, status: { [Op.notIn]: ['cancelled', 'pending_payment'] } } });
    const revenue = await Order.sum('pay_amount', { where: { created_at: { [Op.between]: [start, end] }, status: { [Op.notIn]: ['cancelled', 'pending_payment', 'refunded'] } } }) || 0;
    recent7Days.push({ date: date.format('MM-DD'), orders: count, revenue: parseFloat(revenue).toFixed(2) });
  }

  success(res, { todayOrders, todayRevenue: parseFloat(todayRevenue).toFixed(2), totalUsers, pendingOrders, lowStockProducts, hotProducts, recent7Days });
}

// 商品管理
async function adminGetProducts(req, res) {
  const { keyword, categoryId, status, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (keyword) where.name = { [Op.like]: `%${keyword}%` };
  if (categoryId) where.category_id = categoryId;
  if (status !== undefined) where.status = status;

  const result = await Product.findAndCountAll({
    where,
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }, { model: ProductSku, as: 'skus' }],
    order: [['sort', 'ASC'], ['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

async function adminCreateProduct(req, res) {
  const { skus, ...productData } = req.body;
  const data = normalizeProductData(productData);
  const product = await Product.create(data);
  if (skus?.length) {
    await ProductSku.bulkCreate(skus.map(s => ({ ...s, product_id: product.id })));
  }
  success(res, product, '商品创建成功');
}

async function adminUpdateProduct(req, res) {
  const product = await Product.findByPk(req.params.id);
  if (!product) return fail(res, '商品不存在');
  const { skus, ...productData } = req.body;
  const data = normalizeProductData({ ...product.toJSON(), ...productData });
  await product.update(data);
  if (skus) {
    await ProductSku.destroy({ where: { product_id: product.id } });
    await ProductSku.bulkCreate(skus.map(s => ({ ...s, product_id: product.id })));
  }
  success(res, product, '商品更新成功');
}

async function adminDeleteProduct(req, res) {
  await Product.update({ status: 0 }, { where: { id: req.params.id } });
  success(res, null, '商品已下架');
}

// 分类管理
async function adminGetCategories(req, res) {
  const categories = await Category.findAll({ order: [['sort', 'ASC']] });
  success(res, categories);
}

async function adminSaveCategory(req, res) {
  const { id, ...data } = req.body;
  if (id) {
    const cat = await Category.findByPk(id);
    await cat.update(data);
    success(res, cat, '分类更新成功');
  } else {
    const cat = await Category.create(data);
    success(res, cat, '分类创建成功');
  }
}

// 订单管理
async function findOrderIdsByKeyword(kw) {
  const ids = new Set();

  const itemRows = await OrderItem.findAll({
    attributes: ['order_id'],
    where: {
      [Op.or]: [
        { product_name: { [Op.like]: `%${kw}%` } },
        { sku_name: { [Op.like]: `%${kw}%` } }
      ]
    },
    group: ['order_id'],
    raw: true
  });
  itemRows.forEach(r => ids.add(r.order_id));

  const userConditions = [
    { nickname: { [Op.like]: `%${kw}%` } },
    { phone: { [Op.like]: `%${kw}%` } }
  ];
  if (/^\d+$/.test(kw)) userConditions.push({ id: parseInt(kw, 10) });

  const [addressRows, users] = await Promise.all([
    Address.findAll({
      attributes: ['user_id'],
      where: {
        [Op.or]: [
          { phone: { [Op.like]: `%${kw}%` } },
          { name: { [Op.like]: `%${kw}%` } },
          { detail: { [Op.like]: `%${kw}%` } }
        ]
      },
      group: ['user_id'],
      raw: true
    }),
    User.findAll({ attributes: ['id'], where: { [Op.or]: userConditions }, raw: true })
  ]);

  const userIds = new Set([
    ...addressRows.map(r => r.user_id),
    ...users.map(u => u.id)
  ]);

  if (userIds.size) {
    const orderRows = await Order.findAll({
      attributes: ['id'],
      where: { user_id: { [Op.in]: [...userIds] } },
      raw: true
    });
    orderRows.forEach(o => ids.add(o.id));
  }

  return ids;
}

function orderSnapshotLike(field, kw) {
  // Sequelize 会把 $.xxx 转义成 $$.xxx，导致 MySQL JSON 路径无效，故用 literal
  return sequelize.where(
    sequelize.literal(`JSON_UNQUOTE(JSON_EXTRACT(\`Order\`.\`address_snapshot\`, '$.${field}'))`),
    { [Op.like]: `%${kw}%` }
  );
}

function buildOrderSearchConditions(kw) {
  const conditions = [
    { order_no: { [Op.like]: `%${kw}%` } },
    { pickup_code: { [Op.like]: `%${kw}%` } },
    { transaction_id: { [Op.like]: `%${kw}%` } },
    { remark: { [Op.like]: `%${kw}%` } },
    orderSnapshotLike('phone', kw),
    orderSnapshotLike('name', kw),
    orderSnapshotLike('detail', kw)
  ];
  if (/^\d+$/.test(kw)) conditions.push({ id: parseInt(kw, 10) });
  return conditions;
}

function enrichOrderRow(order, keyword = '') {
  const json = order.toJSON();
  const snap = json.address_snapshot || {};
  json.display_phone = snap.phone || json.user?.phone || '';
  json.display_contact = snap.name || json.user?.nickname || '';
  json.phone_from_snapshot = !!(snap.phone && snap.phone !== json.user?.phone);

  const kw = keyword.trim();
  if (kw) {
    const lower = kw.toLowerCase();
    const matchedItem = json.items?.find(i =>
      i.product_name?.toLowerCase().includes(lower) || i.sku_name?.toLowerCase().includes(lower)
    );
    if (matchedItem) {
      json.match_tip = `商品：${matchedItem.product_name}${matchedItem.sku_name ? `（${matchedItem.sku_name}）` : ''}`;
    } else if (snap.phone?.includes(kw)) {
      json.match_tip = `收货手机：${snap.phone}`;
    } else if (snap.name?.includes(kw)) {
      json.match_tip = `收货人：${snap.name}`;
    } else if (json.pickup_code?.includes(kw)) {
      json.match_tip = `取货码：${json.pickup_code}`;
    } else if (json.order_no?.includes(kw)) {
      json.match_tip = `订单号：${json.order_no}`;
    }
  }
  return json;
}

async function adminGetOrders(req, res) {
  const { status, keyword, page = 1, pageSize = 20 } = req.query;
  const kw = keyword?.trim();
  let where = {};
  if (status) where.status = status;

  if (kw) {
    const conditions = buildOrderSearchConditions(kw);
    const extraIds = await findOrderIdsByKeyword(kw);
    if (extraIds.size) conditions.push({ id: { [Op.in]: [...extraIds] } });
    const searchWhere = { [Op.or]: conditions };
    where = status ? { [Op.and]: [{ status }, searchWhere] } : searchWhere;
  }

  const result = await Order.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'nickname', 'phone'] },
      { model: OrderItem, as: 'items', attributes: ['id', 'product_name', 'sku_name', 'quantity', 'weight'] }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize),
    distinct: true
  });

  const list = result.rows.map(o => enrichOrderRow(o, kw || ''));
  success(res, {
    list,
    total: result.count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(result.count / parseInt(pageSize))
  });
}

async function adminGetOrderDetail(req, res) {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: User, as: 'user', attributes: ['id', 'nickname', 'phone', 'avatar', 'openid', 'points', 'member_level'] },
      { model: OrderItem, as: 'items' },
      { model: Store, as: 'pickupStore' }
    ]
  });
  if (!order) return fail(res, '订单不存在', 404, 404);
  success(res, order);
}

async function adminUpdateOrderStatus(req, res) {
  const order = await Order.findByPk(req.params.id);
  if (!order) return fail(res, '订单不存在');
  const { status } = req.body;

  const allowed = getAdminNextStatuses(order);
  if (!allowed.includes(status)) {
    return fail(res, '当前状态不允许此操作');
  }

  const updates = { status };
  if (status === 'delivering') updates.delivery_time = new Date();
  if (status === 'completed') updates.complete_time = new Date();
  if (status === 'cancelled') updates.cancel_time = new Date();

  await order.update(updates);
  success(res, order, '状态更新成功');
}

function getAdminNextStatuses(order) {
  const s = order.status;
  const isPickup = order.delivery_type === 'pickup';
  if (s === 'paid') return ['preparing', 'cancelled'];
  if (s === 'preparing') return isPickup ? ['ready_pickup', 'cancelled'] : ['delivering', 'cancelled'];
  if (s === 'delivering' || s === 'ready_pickup') return ['completed'];
  return [];
}

// 用户管理
async function enrichUserPhone(user, keyword = '') {
  const json = user.toJSON();
  const addresses = await Address.findAll({
    where: { user_id: json.id },
    order: [['is_default', 'DESC'], ['created_at', 'DESC']],
    attributes: ['id', 'name', 'phone', 'is_default', 'detail']
  });

  const addressPhones = [...new Set(addresses.map(a => a.phone).filter(Boolean))];
  json.address_phones = addressPhones;

  if (json.phone) {
    json.display_phone = json.phone;
  } else if (addresses.length) {
    const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
    if (defaultAddr?.phone) {
      await syncUserPhone(json.id, defaultAddr.phone);
      json.phone = defaultAddr.phone;
      json.display_phone = defaultAddr.phone;
      json.phone_from_address = true;
    }
  }

  const kw = keyword.trim();
  if (kw) {
    const matchedAddr = addresses.find(a =>
      a.phone?.includes(kw) || a.name?.includes(kw) || a.detail?.includes(kw)
    );
    if (matchedAddr?.phone) {
      json.display_phone = matchedAddr.phone;
      json.phone_from_address = json.phone !== matchedAddr.phone;
      json.matched_address_name = matchedAddr.name;
    }
  }

  if (!json.display_phone) {
    json.display_phone = json.phone || addressPhones[0] || null;
  }

  return json;
}

function buildUserSearchWhere(keyword) {
  const kw = keyword?.trim();
  if (!kw) return null;

  const conditions = [
    { nickname: { [Op.like]: `%${kw}%` } },
    { phone: { [Op.like]: `%${kw}%` } },
    { openid: { [Op.like]: `%${kw}%` } }
  ];

  if (/^\d+$/.test(kw)) {
    conditions.push({ id: parseInt(kw, 10) });
  }

  return { kw, conditions };
}

async function adminGetUsers(req, res) {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  const pageNum = parseInt(page);
  const size = parseInt(pageSize);
  const search = buildUserSearchWhere(keyword);

  let where = {};
  if (search) {
    const addressRows = await Address.findAll({
      attributes: ['user_id'],
      where: {
        [Op.or]: [
          { phone: { [Op.like]: `%${search.kw}%` } },
          { name: { [Op.like]: `%${search.kw}%` } },
          { detail: { [Op.like]: `%${search.kw}%` } }
        ]
      },
      group: ['user_id'],
      raw: true
    });
    const userIdsFromAddress = addressRows.map(r => r.user_id);
    if (userIdsFromAddress.length) {
      search.conditions.push({ id: { [Op.in]: userIdsFromAddress } });
    }
    where = { [Op.or]: search.conditions };
  }

  const result = await User.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit: size,
    offset: (pageNum - 1) * size
  });

  const list = await Promise.all(result.rows.map(u => enrichUserPhone(u, search?.kw || '')));

  success(res, {
    list,
    total: result.count,
    page: pageNum,
    pageSize: size,
    totalPages: Math.ceil(result.count / size)
  });
}

async function adminGetUserDetail(req, res) {
  const userRecord = await User.findByPk(req.params.id);
  if (!userRecord) return fail(res, '用户不存在', 404, 404);
  const user = await enrichUserPhone(userRecord);

  const [addresses, recentOrders, orderCount, paidOrderCount, pointsLogs, memberLevel] = await Promise.all([
    Address.findAll({ where: { user_id: user.id }, order: [['is_default', 'DESC'], ['created_at', 'DESC']] }),
    Order.findAll({
      where: { user_id: user.id },
      attributes: ['id', 'order_no', 'status', 'pay_amount', 'delivery_type', 'created_at'],
      order: [['created_at', 'DESC']],
      limit: 10
    }),
    Order.count({ where: { user_id: user.id } }),
    Order.count({ where: { user_id: user.id, status: { [Op.notIn]: ['cancelled', 'pending_payment', 'refunded'] } } }),
    PointsLog.findAll({ where: { user_id: user.id }, order: [['created_at', 'DESC']], limit: 15 }),
    MemberLevel.findOne({ where: { level: user.member_level } })
  ]);

  success(res, {
    user,
    addresses,
    recentOrders,
    stats: { orderCount, paidOrderCount },
    pointsLogs,
    memberLevel
  });
}

async function adminUpdateUserStatus(req, res) {
  const user = await User.findByPk(req.params.id);
  if (!user) return fail(res, '用户不存在');
  const { status } = req.body;
  if (![0, 1].includes(status)) return fail(res, '状态参数错误');
  await user.update({ status });
  success(res, user, status === 1 ? '已启用' : '已禁用');
}

// 优惠券管理
async function adminGetCoupons(req, res) {
  const coupons = await Coupon.findAll({ order: [['created_at', 'DESC']] });
  success(res, coupons);
}

async function adminSaveCoupon(req, res) {
  const { id, ...data } = req.body;
  if (id) {
    const coupon = await Coupon.findByPk(id);
    await coupon.update(data);
    success(res, coupon);
  } else {
    const coupon = await Coupon.create(data);
    success(res, coupon);
  }
}

// 门店管理
async function adminGetStores(req, res) {
  const stores = await Store.findAll({ order: [['sort', 'ASC']] });
  success(res, stores);
}

async function adminSaveStore(req, res) {
  const { id, ...data } = req.body;
  if (id) {
    const store = await Store.findByPk(id);
    await store.update(data);
    success(res, store);
  } else {
    const store = await Store.create(data);
    success(res, store);
  }
}

// 轮播图
async function adminGetBanners(req, res) {
  const banners = await Banner.findAll({ order: [['sort', 'ASC']] });
  success(res, banners);
}

async function adminSaveBanner(req, res) {
  const { id, ...data } = req.body;
  if (id) {
    const banner = await Banner.findByPk(id);
    await banner.update(data);
    success(res, banner);
  } else {
    const banner = await Banner.create(data);
    success(res, banner);
  }
}

// 售后
async function adminGetAfterSales(req, res) {
  const { status, page = 1, pageSize = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  const result = await AfterSale.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'nickname', 'phone', 'avatar']
      },
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_no', 'pay_amount', 'status', 'delivery_type', 'created_at', 'address_snapshot'],
        include: [
          {
            model: OrderItem,
            as: 'items',
            attributes: ['id', 'product_name', 'sku_name', 'quantity', 'weight', 'product_image', 'price']
          }
        ]
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

async function adminHandleAfterSale(req, res) {
  const afterSale = await AfterSale.findByPk(req.params.id);
  if (!afterSale) return fail(res, '售后单不存在');
  const { status, adminRemark } = req.body;
  await afterSale.update({ status, admin_remark: adminRemark, handle_time: new Date() });

  if (status === 'approved') {
    const order = await Order.findByPk(afterSale.order_id);
    if (order) await order.update({ status: 'refunded', refund_amount: afterSale.refund_amount, refund_time: new Date() });
  }
  success(res, afterSale, '处理成功');
}

async function adminDeleteBanner(req, res) {
  await Banner.destroy({ where: { id: req.params.id } });
  success(res, null, '已删除');
}

// 首页运营
async function adminGetHome(req, res) {
  const [hot, newProducts, recommend] = await Promise.all([
    Product.findAll({
      where: { is_hot: true, status: 1 },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['sort', 'ASC'], ['id', 'ASC']]
    }),
    Product.findAll({
      where: { is_new: true, status: 1 },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['sort', 'ASC'], ['id', 'ASC']]
    }),
    Product.findAll({
      where: { is_recommend: true, status: 1 },
      include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      order: [['sort', 'ASC'], ['id', 'ASC']]
    })
  ]);
  success(res, { hot, new: newProducts, recommend });
}

async function adminUpdateHomeSection(req, res) {
  const { section, productIds } = req.body;
  const fieldMap = { hot: 'is_hot', new: 'is_new', recommend: 'is_recommend' };
  const field = fieldMap[section];
  if (!field || !Array.isArray(productIds)) return fail(res, '参数错误');

  await Product.update({ [field]: false }, { where: { [field]: true } });
  for (let i = 0; i < productIds.length; i++) {
    await Product.update({ [field]: true, sort: i + 1 }, { where: { id: productIds[i] } });
  }
  success(res, null, '保存成功');
}

async function adminSearchProducts(req, res) {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  const where = { status: 1 };
  if (keyword) where.name = { [Op.like]: `%${keyword}%` };

  const result = await Product.findAndCountAll({
    where,
    attributes: ['id', 'name', 'cover', 'price', 'unit', 'is_hot', 'is_new', 'is_recommend', 'status'],
    order: [['id', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

// 评价管理
async function adminGetReviews(req, res) {
  const result = await Review.findAndCountAll({
    include: [
      { association: 'user', attributes: ['nickname'] },
      { association: 'product', attributes: ['name'] }
    ],
    order: [['created_at', 'DESC']],
    limit: 20
  });
  success(res, { list: result.rows, total: result.count });
}

async function adminReplyReview(req, res) {
  const review = await Review.findByPk(req.params.id);
  if (!review) return fail(res, '评价不存在');
  await review.update({ reply: req.body.reply, reply_time: new Date() });
  success(res, review, '回复成功');
}

module.exports = {
  login, getDashboard,
  adminGetProducts, adminCreateProduct, adminUpdateProduct, adminDeleteProduct,
  adminGetCategories, adminSaveCategory,
  adminGetOrders, adminGetOrderDetail, adminUpdateOrderStatus,
  adminGetUsers, adminGetUserDetail, adminUpdateUserStatus, adminGetCoupons, adminSaveCoupon,
  adminGetStores, adminSaveStore,
  adminGetBanners, adminSaveBanner, adminDeleteBanner,
  adminGetHome, adminUpdateHomeSection, adminSearchProducts,
  adminGetAfterSales, adminHandleAfterSale,
  adminGetReviews, adminReplyReview
};
