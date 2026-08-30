const { Op } = require('sequelize');
const {
  Product, Category, ProductSku, Banner, Seckill, FlashSale,
  Favorite, Review, Store
} = require('../models');
const { success, fail, paginate } = require('../utils/response');

async function getBanners(req, res) {
  const banners = await Banner.findAll({
    where: { status: 1 },
    order: [['sort', 'ASC']],
    attributes: ['id', 'title', 'image', 'link_type', 'link_value']
  });
  success(res, banners);
}

async function getCategories(req, res) {
  const categories = await Category.findAll({
    where: { status: 1 },
    order: [['sort', 'ASC']],
    attributes: ['id', 'parent_id', 'name', 'icon', 'image']
  });
  const tree = buildTree(categories);
  success(res, tree);
}

function buildTree(items, parentId = 0) {
  return items
    .filter(item => item.parent_id === parentId)
    .map(item => ({
      ...item.toJSON(),
      children: buildTree(items, item.id)
    }));
}

async function getProducts(req, res) {
  const { categoryId, keyword, isHot, isNew, isRecommend, page = 1, pageSize = 20 } = req.query;
  const where = { status: 1 };
  if (categoryId) where.category_id = categoryId;
  if (isHot === '1') where.is_hot = true;
  if (isNew === '1') where.is_new = true;
  if (isRecommend === '1') where.is_recommend = true;
  if (keyword) where.name = { [Op.like]: `%${keyword}%` };

  const result = await Product.findAndCountAll({
    where,
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    order: [['sort', 'ASC'], ['sales', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

async function getProductDetail(req, res) {
  const product = await Product.findOne({
    where: { id: req.params.id, status: 1 },
    include: [
      { model: Category, as: 'category', attributes: ['id', 'name'] },
      { model: ProductSku, as: 'skus', where: { status: 1 }, required: false },
      { model: Review, as: 'reviews', limit: 5, order: [['created_at', 'DESC']], include: [{ association: 'user', attributes: ['nickname', 'avatar'] }] }
    ]
  });
  if (!product) return fail(res, '商品不存在', 404, 404);

  const flashSale = await FlashSale.findOne({
    where: { product_id: product.id, status: 1, start_time: { [Op.lte]: new Date() }, end_time: { [Op.gte]: new Date() } }
  });

  let isFavorite = false;
  if (req.user) {
    const fav = await Favorite.findOne({ where: { user_id: req.user.id, product_id: product.id } });
    isFavorite = !!fav;
  }

  success(res, { ...product.toJSON(), flashSale, isFavorite });
}

async function searchProducts(req, res) {
  const { keyword, page = 1, pageSize = 20 } = req.query;
  if (!keyword) return fail(res, '请输入搜索关键词');

  const result = await Product.findAndCountAll({
    where: { status: 1, name: { [Op.like]: `%${keyword}%` } },
    order: [['sales', 'DESC']],
    limit: parseInt(pageSize),
    offset: (parseInt(page) - 1) * parseInt(pageSize)
  });
  paginate(res, result, page, pageSize);
}

async function getSeckills(req, res) {
  const now = new Date();
  const seckills = await Seckill.findAll({
    where: { status: 1, end_time: { [Op.gte]: now } },
    include: [{ model: Product, attributes: ['id', 'name', 'cover', 'price'] }],
    order: [['start_time', 'ASC']]
  });
  success(res, seckills);
}

async function getFrequentlyBought(req, res) {
  const { OrderItem, Order: OrderModel } = require('../models');
  const items = await OrderItem.findAll({
    attributes: ['product_id', [require('sequelize').fn('COUNT', require('sequelize').col('product_id')), 'count']],
    include: [{ model: OrderModel, where: { user_id: req.user.id, status: 'completed' }, attributes: [] }],
    group: ['product_id'],
    order: [[require('sequelize').literal('count'), 'DESC']],
    limit: 10
  });

  const productIds = items.map(i => i.product_id);
  const products = await Product.findAll({
    where: { id: productIds, status: 1 },
    attributes: ['id', 'name', 'cover', 'price', 'unit']
  });
  success(res, products);
}

module.exports = {
  getBanners, getCategories, getProducts, getProductDetail,
  searchProducts, getSeckills, getFrequentlyBought
};
