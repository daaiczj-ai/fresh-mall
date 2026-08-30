const api = require('../../services/api');
const { resolveImage, DEFAULT_IMAGE } = require('../../utils/image');

function mapProducts(list = []) {
  return list.map(item => ({ ...item, cover: resolveImage(item.cover) }));
}

const categoryIcons = {
  1: 'fruit',
  2: 'vegetable',
  3: 'meat',
  4: 'dairy',
  5: 'grain',
  6: 'snack',
  7: 'daily'
};

function mapCategories(list = []) {
  return list.map(item => ({
    ...item,
    iconUrl: resolveImage(`/images/categories/${categoryIcons[item.id] || 'fruit'}.png`)
  }));
}

Page({
  data: {
    banners: [],
    categories: [],
    hotProducts: [],
    newProducts: [],
    recommendProducts: [],
    defaultImage: DEFAULT_IMAGE
  },
  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    const [banners, categories, hotProducts, newProducts, recommendProducts] = await Promise.all([
      api.getBanners(),
      api.getCategories(),
      api.getProducts({ isHot: '1', pageSize: 6 }),
      api.getProducts({ isNew: '1', pageSize: 6 }),
      api.getProducts({ isRecommend: '1', pageSize: 6 })
    ]);

    getApp().globalData.categoriesCache = categories;

    this.setData({
      banners: banners.map(item => ({ ...item, image: resolveImage(item.image) })),
      categories: mapCategories(categories.slice(0, 8)),
      hotProducts: mapProducts(hotProducts.list),
      newProducts: mapProducts(newProducts.list),
      recommendProducts: mapProducts(recommendProducts.list)
    });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search' });
  },

  goCategory(e) {
    const id = e.currentTarget.dataset.id;
    wx.switchTab({ url: '/pages/category/category' });
    getApp().globalData.categoryId = id;
  },

  goProduct(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/product/detail?id=${id}` });
  },

  onBannerTap(e) {
    const { linkType, linkValue } = e.currentTarget.dataset;
    if (linkType === 'product') wx.navigateTo({ url: `/pages/product/detail?id=${linkValue}` });
    else if (linkType === 'category') {
      getApp().globalData.categoryId = linkValue;
      wx.switchTab({ url: '/pages/category/category' });
    }
  },

  onImageError(e) {
    const { imgType, index } = e.currentTarget.dataset;
    const keyMap = {
      banner: 'banners',
      hot: 'hotProducts',
      new: 'newProducts',
      recommend: 'recommendProducts'
    };
    const listKey = keyMap[imgType];
    if (!listKey) return;
    const field = imgType === 'banner' ? 'image' : 'cover';
    this.setData({ [`${listKey}[${index}].${field}`]: DEFAULT_IMAGE });
  }
});
