/** 称重商品：500g = 1斤 */
const JIN_GRAMS = 500;

function getWeightUnitPrice(product) {
  const price = parseFloat(product.price);
  if (price > 0) return price;
  return parseFloat(product.price_per_unit) || 0;
}

function getUnitPrice(product, sku) {
  if (!product) return 0;
  if (sku) return parseFloat(sku.price) || 0;
  if (product.product_type === 'weight') return getWeightUnitPrice(product);
  return parseFloat(product.price) || 0;
}

function calcItemAmount(product, sku, quantity = 1, weight) {
  const unitPrice = getUnitPrice(product, sku);
  if (product.product_type === 'weight') {
    const w = parseFloat(weight) || parseFloat(product.min_weight) || JIN_GRAMS;
    return unitPrice * w / JIN_GRAMS;
  }
  return unitPrice * (quantity || 1);
}

function normalizeWeightProduct(data) {
  if (data.product_type !== 'weight') return data;
  const unitPrice = parseFloat(data.price) || parseFloat(data.price_per_unit) || 0;
  return {
    ...data,
    price: unitPrice,
    price_per_unit: unitPrice,
    min_weight: data.min_weight || 250,
    weight_step: data.weight_step || 50,
    unit: data.unit || '斤'
  };
}

module.exports = { JIN_GRAMS, getWeightUnitPrice, getUnitPrice, calcItemAmount, normalizeWeightProduct };
