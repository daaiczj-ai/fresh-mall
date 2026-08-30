const api = require('../../services/api');
const { resolveImage } = require('../../utils/image');
const { getWeightUnitPrice, calcItemAmount, formatPrice, parseGrams } = require('../../utils/productPrice');
const app = getApp();

Page({
  data: {
    product: null,
    selectedSku: null,
    quantity: 1,
    weight: 500,
    showSku: false,
    panelMode: 'cart',
    isFavorite: false,
    displayPrice: '0.00',
    panelPrice: '0.00'
  },

  onLoad(options) {
    this.productId = options.id;
    this.loadProduct();
  },

  async loadProduct() {
    const product = await api.getProductDetail(this.productId);
    const weight = parseGrams(product.min_weight, 500);
    const selectedSku = product.skus?.length ? product.skus[0] : null;
    const isWeight = product.product_type === 'weight';
    const cover = resolveImage(product.cover);
    const extraImages = (product.images || []).map(img => resolveImage(img));
    const galleryImages = [cover, ...extraImages.filter(url => url && url !== cover)];
    this.setData({
      product: {
        ...product,
        cover,
        galleryImages: galleryImages.length ? galleryImages : [cover]
      },
      weight,
      isFavorite: product.isFavorite,
      selectedSku,
      displayPrice: isWeight ? formatPrice(getWeightUnitPrice(product)) : this.calcSkuPrice(product, selectedSku),
      panelPrice: isWeight ? formatPrice(calcItemAmount(product, null, 1, weight)) : this.calcSkuPrice(product, selectedSku)
    });
  },

  calcSkuPrice(product, selectedSku) {
    if (!product) return '0.00';
    const price = selectedSku ? selectedSku.price : product.price;
    return formatPrice(price);
  },

  updatePanelPrice() {
    const { product, selectedSku, weight } = this.data;
    if (product.product_type === 'weight') {
      this.setData({ panelPrice: formatPrice(calcItemAmount(product, null, 1, weight)) });
    } else {
      this.setData({ displayPrice: this.calcSkuPrice(product, selectedSku), panelPrice: this.calcSkuPrice(product, selectedSku) });
    }
  },

  selectSku(e) {
    const sku = e.currentTarget.dataset.sku;
    this.setData({ selectedSku: sku });
    this.updatePanelPrice();
  },

  changeQuantity(e) {
    const type = e.currentTarget.dataset.type;
    let qty = this.data.quantity;
    if (type === 'minus' && qty > 1) qty--;
    if (type === 'plus') qty++;
    this.setData({ quantity: qty });
  },

  changeWeight(e) {
    const type = e.currentTarget.dataset.type;
    const product = this.data.product;
    const step = parseGrams(product.weight_step, 50);
    const minWeight = parseGrams(product.min_weight, 250);
    let weight = parseGrams(this.data.weight, minWeight);

    if (type === 'minus' && weight > minWeight) weight -= step;
    if (type === 'plus') weight += step;

    this.setData({ weight });
    this.updatePanelPrice();
  },

  async confirmPanel() {
    await app.checkLogin();
    const { product, selectedSku, quantity, weight, panelMode } = this.data;
    await api.addToCart({
      productId: product.id,
      skuId: selectedSku?.id,
      quantity,
      weight: product.product_type === 'weight' ? parseGrams(weight) : undefined
    });
    app.globalData.cartCache = null;
    wx.showToast({ title: '已加入购物车', icon: 'success' });
    this.setData({ showSku: false });
    if (panelMode === 'buy') {
      wx.switchTab({ url: '/pages/cart/cart' });
    }
  },

  buyNow() {
    this.setData({ showSku: true, panelMode: 'buy' });
  },

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  preventBubble() {},

  async toggleFavorite() {
    await app.checkLogin();
    const res = await api.toggleFavorite(this.productId);
    this.setData({ isFavorite: res.favorited });
  },

  showSkuPanel(e) {
    const mode = e?.currentTarget?.dataset?.mode || 'cart';
    this.setData({ showSku: true, panelMode: mode });
  },
  hideSkuPanel() { this.setData({ showSku: false }); }
});
