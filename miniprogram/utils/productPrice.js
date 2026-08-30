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

function formatPrice(price) {
  return parseFloat(price || 0).toFixed(2);
}

function parseGrams(value, fallback = 500) {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

module.exports = { JIN_GRAMS, getWeightUnitPrice, getUnitPrice, calcItemAmount, formatPrice, parseGrams };
