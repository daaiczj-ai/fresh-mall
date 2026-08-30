const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 用户
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  openid: { type: DataTypes.STRING(64), unique: true, allowNull: false },
  unionid: { type: DataTypes.STRING(64) },
  nickname: { type: DataTypes.STRING(64), defaultValue: '微信用户' },
  avatar: { type: DataTypes.STRING(512) },
  phone: { type: DataTypes.STRING(20) },
  gender: { type: DataTypes.TINYINT, defaultValue: 0 },
  member_level: { type: DataTypes.INTEGER, defaultValue: 0 },
  points: { type: DataTypes.INTEGER, defaultValue: 0 },
  total_spent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'users' });

// 收货地址
const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(32), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  province: { type: DataTypes.STRING(32) },
  city: { type: DataTypes.STRING(32) },
  district: { type: DataTypes.STRING(32) },
  detail: { type: DataTypes.STRING(256), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 7) },
  longitude: { type: DataTypes.DECIMAL(10, 7) },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
  tag: { type: DataTypes.STRING(16) }
}, { tableName: 'addresses' });

// 门店
const Store = sequelize.define('Store', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  address: { type: DataTypes.STRING(256), allowNull: false },
  phone: { type: DataTypes.STRING(20) },
  latitude: { type: DataTypes.DECIMAL(10, 7) },
  longitude: { type: DataTypes.DECIMAL(10, 7) },
  business_hours: { type: DataTypes.STRING(64), defaultValue: '08:00-21:00' },
  delivery_radius: { type: DataTypes.DECIMAL(5, 2), defaultValue: 5 },
  delivery_fee: { type: DataTypes.DECIMAL(6, 2), defaultValue: 5 },
  free_delivery_amount: { type: DataTypes.DECIMAL(8, 2), defaultValue: 39 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: 'stores' });

// 商品分类
const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parent_id: { type: DataTypes.INTEGER, defaultValue: 0 },
  name: { type: DataTypes.STRING(32), allowNull: false },
  icon: { type: DataTypes.STRING(512) },
  image: { type: DataTypes.STRING(512) },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'categories' });

// 商品
const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(128), allowNull: false },
  subtitle: { type: DataTypes.STRING(256) },
  cover: { type: DataTypes.STRING(512) },
  images: { type: DataTypes.JSON },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  original_price: { type: DataTypes.DECIMAL(10, 2) },
  member_price: { type: DataTypes.DECIMAL(10, 2) },
  cost_price: { type: DataTypes.DECIMAL(10, 2) },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  sales: { type: DataTypes.INTEGER, defaultValue: 0 },
  unit: { type: DataTypes.STRING(16), defaultValue: '份' },
  weight: { type: DataTypes.DECIMAL(8, 2) },
  product_type: { type: DataTypes.ENUM('normal', 'sku', 'weight'), defaultValue: 'normal' },
  weight_unit: { type: DataTypes.STRING(8), defaultValue: 'g' },
  min_weight: { type: DataTypes.DECIMAL(8, 2) },
  weight_step: { type: DataTypes.DECIMAL(8, 2) },
  price_per_unit: { type: DataTypes.DECIMAL(10, 2) },
  is_hot: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_new: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_recommend: { type: DataTypes.BOOLEAN, defaultValue: false },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 },
  store_id: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { tableName: 'products' });

// SKU
const ProductSku = sequelize.define('ProductSku', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  sku_name: { type: DataTypes.STRING(64), allowNull: false },
  sku_attrs: { type: DataTypes.JSON },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  original_price: { type: DataTypes.DECIMAL(10, 2) },
  member_price: { type: DataTypes.DECIMAL(10, 2) },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  image: { type: DataTypes.STRING(512) },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'product_skus' });

// 购物车
const Cart = sequelize.define('Cart', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  sku_id: { type: DataTypes.INTEGER },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  weight: { type: DataTypes.DECIMAL(8, 2) },
  selected: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'carts' });

// 订单
const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_no: { type: DataTypes.STRING(32), unique: true, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  store_id: { type: DataTypes.INTEGER },
  delivery_type: { type: DataTypes.ENUM('delivery', 'pickup'), defaultValue: 'delivery' },
  status: {
    type: DataTypes.ENUM(
      'pending_payment', 'paid', 'preparing', 'delivering',
      'ready_pickup', 'completed', 'cancelled', 'refunding', 'refunded'
    ),
    defaultValue: 'pending_payment'
  },
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  product_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  delivery_fee: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
  discount_amount: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  coupon_amount: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  points_amount: { type: DataTypes.DECIMAL(8, 2), defaultValue: 0 },
  pay_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  coupon_id: { type: DataTypes.INTEGER },
  points_used: { type: DataTypes.INTEGER, defaultValue: 0 },
  points_earned: { type: DataTypes.INTEGER, defaultValue: 0 },
  address_snapshot: { type: DataTypes.JSON },
  pickup_store_id: { type: DataTypes.INTEGER },
  pickup_code: { type: DataTypes.STRING(8) },
  pickup_time: { type: DataTypes.DATE },
  delivery_time: { type: DataTypes.DATE },
  delivery_time_slot: { type: DataTypes.STRING(32) },
  remark: { type: DataTypes.STRING(256) },
  pay_time: { type: DataTypes.DATE },
  pay_type: { type: DataTypes.STRING(16) },
  transaction_id: { type: DataTypes.STRING(64) },
  cancel_reason: { type: DataTypes.STRING(256) },
  cancel_time: { type: DataTypes.DATE },
  complete_time: { type: DataTypes.DATE },
  refund_amount: { type: DataTypes.DECIMAL(10, 2) },
  refund_reason: { type: DataTypes.STRING(256) },
  refund_time: { type: DataTypes.DATE }
}, { tableName: 'orders' });

// 订单商品
const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  sku_id: { type: DataTypes.INTEGER },
  product_name: { type: DataTypes.STRING(128), allowNull: false },
  product_image: { type: DataTypes.STRING(512) },
  sku_name: { type: DataTypes.STRING(64) },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  weight: { type: DataTypes.DECIMAL(8, 2) },
  unit: { type: DataTypes.STRING(16) },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'order_items' });

// 优惠券模板
const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(64), allowNull: false },
  type: {
    type: DataTypes.ENUM('new_user', 'full_reduce', 'discount', 'product', 'delivery'),
    allowNull: false
  },
  value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  min_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  max_discount: { type: DataTypes.DECIMAL(10, 2) },
  product_ids: { type: DataTypes.JSON },
  category_ids: { type: DataTypes.JSON },
  total_count: { type: DataTypes.INTEGER, defaultValue: -1 },
  received_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  per_limit: { type: DataTypes.INTEGER, defaultValue: 1 },
  start_time: { type: DataTypes.DATE },
  end_time: { type: DataTypes.DATE },
  valid_days: { type: DataTypes.INTEGER },
  description: { type: DataTypes.STRING(256) },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'coupons' });

// 用户优惠券
const UserCoupon = sequelize.define('UserCoupon', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  coupon_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('unused', 'used', 'expired'), defaultValue: 'unused' },
  order_id: { type: DataTypes.INTEGER },
  used_time: { type: DataTypes.DATE },
  expire_time: { type: DataTypes.DATE }
}, { tableName: 'user_coupons' });

// 会员等级
const MemberLevel = sequelize.define('MemberLevel', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(32), allowNull: false },
  level: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  min_spent: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discount: { type: DataTypes.DECIMAL(3, 2), defaultValue: 1 },
  points_rate: { type: DataTypes.DECIMAL(3, 2), defaultValue: 1 },
  icon: { type: DataTypes.STRING(512) },
  benefits: { type: DataTypes.JSON }
}, { tableName: 'member_levels' });

// 积分记录
const PointsLog = sequelize.define('PointsLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  points: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('earn', 'spend', 'expire', 'admin'), allowNull: false },
  source: { type: DataTypes.STRING(32) },
  order_id: { type: DataTypes.INTEGER },
  remark: { type: DataTypes.STRING(128) }
}, { tableName: 'points_logs' });

// 收藏
const Favorite = sequelize.define('Favorite', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'favorites', indexes: [{ unique: true, fields: ['user_id', 'product_id'] }] });

// 评价
const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.TINYINT, allowNull: false },
  content: { type: DataTypes.STRING(512) },
  images: { type: DataTypes.JSON },
  is_anonymous: { type: DataTypes.BOOLEAN, defaultValue: false },
  reply: { type: DataTypes.STRING(256) },
  reply_time: { type: DataTypes.DATE },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'reviews' });

// 售后
const AfterSale = sequelize.define('AfterSale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('refund', 'return', 'exchange'), allowNull: false },
  reason: { type: DataTypes.STRING(256), allowNull: false },
  description: { type: DataTypes.TEXT },
  images: { type: DataTypes.JSON },
  refund_amount: { type: DataTypes.DECIMAL(10, 2) },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed'),
    defaultValue: 'pending'
  },
  admin_remark: { type: DataTypes.STRING(256) },
  handle_time: { type: DataTypes.DATE }
}, { tableName: 'after_sales' });

// 秒杀活动
const Seckill = sequelize.define('Seckill', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  sku_id: { type: DataTypes.INTEGER },
  seckill_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false },
  sold: { type: DataTypes.INTEGER, defaultValue: 0 },
  limit_per_user: { type: DataTypes.INTEGER, defaultValue: 1 },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'seckills' });

// 限时特价
const FlashSale = sequelize.define('FlashSale', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  sale_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'flash_sales' });

// 轮播图
const Banner = sequelize.define('Banner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(64) },
  image: { type: DataTypes.STRING(512), allowNull: false },
  link_type: { type: DataTypes.ENUM('product', 'category', 'url', 'none'), defaultValue: 'none' },
  link_value: { type: DataTypes.STRING(256) },
  sort: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.TINYINT, defaultValue: 1 }
}, { tableName: 'banners' });

// 管理员
const Admin = sequelize.define('Admin', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(32), unique: true, allowNull: false },
  password: { type: DataTypes.STRING(128), allowNull: false },
  name: { type: DataTypes.STRING(32) },
  phone: { type: DataTypes.STRING(20) },
  role: { type: DataTypes.ENUM('super', 'admin', 'operator'), defaultValue: 'operator' },
  permissions: { type: DataTypes.JSON },
  store_id: { type: DataTypes.INTEGER },
  status: { type: DataTypes.TINYINT, defaultValue: 1 },
  last_login: { type: DataTypes.DATE }
}, { tableName: 'admins' });

// 关联关系
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Cart, { foreignKey: 'user_id', as: 'carts' });
Cart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Cart.belongsTo(ProductSku, { foreignKey: 'sku_id', as: 'sku' });

Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.hasMany(ProductSku, { foreignKey: 'product_id', as: 'skus' });
ProductSku.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Order.belongsTo(Store, { foreignKey: 'pickup_store_id', as: 'pickupStore' });

User.hasMany(UserCoupon, { foreignKey: 'user_id', as: 'coupons' });
UserCoupon.belongsTo(Coupon, { foreignKey: 'coupon_id', as: 'coupon' });

User.hasMany(Favorite, { foreignKey: 'user_id', as: 'favorites' });
Favorite.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

AfterSale.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
AfterSale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Order.hasMany(AfterSale, { foreignKey: 'order_id', as: 'afterSales' });

Seckill.belongsTo(Product, { foreignKey: 'product_id' });

module.exports = {
  sequelize,
  User, Address, Store, Category, Product, ProductSku,
  Cart, Order, OrderItem, Coupon, UserCoupon,
  MemberLevel, PointsLog, Favorite, Review, AfterSale,
  Seckill, FlashSale, Banner, Admin
};
