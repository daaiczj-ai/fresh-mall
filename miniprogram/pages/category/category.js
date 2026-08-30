const api = require('../../services/api');
const { resolveImage } = require('../../utils/image');

Page({
  data: {
    categories: [],
    activeCategory: 0,
    products: [],
    page: 1,
    hasMore: true,
    loading: false
  },

  onLoad() {
    const app = getApp();
    const cached = app.globalData.categoriesCache;
    if (cached && cached.length) {
      this.applyCategories(cached);
    }
  },

  onShow() {
    const app = getApp();
    const jumpId = app.globalData.categoryId;
    if (jumpId) {
      app.globalData.categoryId = null;
      this.setData({ activeCategory: jumpId });
      this.loadProducts(jumpId, true);
      return;
    }
    if (this.data.categories.length) return;

    const cached = app.globalData.categoriesCache;
    if (cached && cached.length) {
      this.applyCategories(cached);
      return;
    }
    this.loadCategories();
  },

  applyCategories(categories) {
    this.setData({ categories });
    const catId = this.data.activeCategory || categories[0]?.id;
    if (catId && !this.data.products.length) {
      this.loadProducts(catId, true);
    }
  },

  async loadCategories() {
    const categories = await api.getCategories();
    getApp().globalData.categoriesCache = categories;
    this.applyCategories(categories);
  },

  switchCategory(e) {
    const id = e.currentTarget.dataset.id;
    if (id === this.data.activeCategory) return;
    this.setData({ activeCategory: id, page: 1, hasMore: true });
    this.loadProducts(id, true);
  },

  async loadProducts(categoryId, reset = false) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    const page = reset ? 1 : this.data.page;
    const res = await api.getProducts({ categoryId, page, pageSize: 20 });
    const list = reset ? res.list : [...this.data.products, ...res.list];
    this.setData({
      products: list.map(item => ({ ...item, cover: resolveImage(item.cover) })),
      page: page + 1,
      hasMore: list.length < res.total,
      loading: false
    });
  },

  onReachBottom() {
    if (this.data.hasMore) this.loadProducts(this.data.activeCategory);
  },

  goProduct(e) {
    wx.navigateTo({ url: `/pages/product/detail?id=${e.currentTarget.dataset.id}` });
  }
});
