const { Cart, Product, ProductSku } = require('../models');
const { success, fail } = require('../utils/response');
const { getUnitPrice, calcItemAmount } = require('../utils/productPrice');

async function getCart(req, res) {
  const items = await Cart.findAll({
    where: { user_id: req.user.id },
    include: [
      { model: Product, as: 'product', attributes: ['id', 'name', 'cover', 'price', 'stock', 'status', 'product_type', 'unit', 'price_per_unit', 'min_weight', 'weight_step'] },
      { model: ProductSku, as: 'sku', attributes: ['id', 'sku_name', 'price', 'stock', 'image', 'status'] }
    ],
    order: [['created_at', 'DESC']]
  });

  const validItems = items.filter(item => item.product && item.product.status === 1);
  const enrichedItems = validItems.map(item => {
    const json = item.toJSON();
    const unitPrice = getUnitPrice(json.product, json.sku);
    const subtotal = calcItemAmount(json.product, json.sku, json.quantity, json.weight);
    return { ...json, unit_price: unitPrice, subtotal: subtotal.toFixed(2) };
  });
  const total = enrichedItems
    .filter(item => item.selected)
    .reduce((sum, item) => sum + parseFloat(item.subtotal), 0);

  success(res, { items: enrichedItems, total: total.toFixed(2), count: enrichedItems.length });
}

async function addToCart(req, res) {
  const { productId, skuId, quantity = 1, weight } = req.body;
  const product = await Product.findByPk(productId);
  if (!product || product.status !== 1) return fail(res, '商品不存在或已下架');

  if (product.product_type === 'sku' && !skuId) return fail(res, '请选择规格');
  if (product.product_type === 'weight' && !weight) return fail(res, '请选择重量');

  const where = { user_id: req.user.id, product_id: productId };
  if (skuId) where.sku_id = skuId;

  let cartItem = await Cart.findOne({ where });
  if (cartItem) {
    if (product.product_type === 'weight') {
      await cartItem.update({ weight, selected: true });
    } else {
      await cartItem.update({ quantity: cartItem.quantity + quantity, selected: true });
    }
  } else {
    cartItem = await Cart.create({
      user_id: req.user.id,
      product_id: productId,
      sku_id: skuId || null,
      quantity: product.product_type === 'weight' ? 1 : quantity,
      weight: weight || null
    });
  }
  success(res, cartItem, '已加入购物车');
}

async function updateCart(req, res) {
  const { quantity, weight, selected } = req.body;
  const cartItem = await Cart.findOne({ where: { id: req.params.id, user_id: req.user.id } });
  if (!cartItem) return fail(res, '购物车项不存在');

  const updates = {};
  if (quantity !== undefined) updates.quantity = quantity;
  if (weight !== undefined) updates.weight = weight;
  if (selected !== undefined) updates.selected = selected;
  await cartItem.update(updates);
  success(res, cartItem);
}

async function removeFromCart(req, res) {
  await Cart.destroy({ where: { id: req.params.id, user_id: req.user.id } });
  success(res, null, '已删除');
}

async function clearCart(req, res) {
  await Cart.destroy({ where: { user_id: req.user.id } });
  success(res, null, '购物车已清空');
}

async function selectAll(req, res) {
  const { selected } = req.body;
  await Cart.update({ selected }, { where: { user_id: req.user.id } });
  success(res, null);
}

module.exports = { getCart, addToCart, updateCart, removeFromCart, clearCart, selectAll };
