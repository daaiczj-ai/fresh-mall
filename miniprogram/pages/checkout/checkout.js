const api = require('../../services/api');

const app = getApp();



Page({

  data: {

    cartIds: [],

    deliveryType: 'delivery',

    address: null,

    store: null,

    stores: [],

    preview: null,

    loading: true,

    loadError: '',

    needAddress: false,

    deliveryTimeSlots: ['尽快送达', '10:00-12:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'],

    selectedTimeSlot: '尽快送达',

    remark: '',

    selectedCouponId: null,

    selectedCouponName: ''

  },



  onLoad(options) {

    if (!options.cartIds) {

      this.setData({ loading: false, loadError: '购物车数据异常，请返回重试' });

      return;

    }

    app.globalData.checkoutContext = app.globalData.checkoutContext || {};

    this.setData({ cartIds: options.cartIds.split(',').map(Number).filter(Boolean) });

    this.loadData();

  },



  onShow() {

    const ctx = app.globalData.checkoutContext || {};

    const couponChanged = ctx.selectedCouponId !== this.data.selectedCouponId

      || ctx.selectedCouponName !== this.data.selectedCouponName;

    if (couponChanged) {

      this.setData({

        selectedCouponId: ctx.selectedCouponId || null,

        selectedCouponName: ctx.selectedCouponName || ''

      });

    }

    if (this.data.cartIds.length && !this.data.loading && (couponChanged || this.data.preview)) {

      this.preview();

    }

  },



  async loadData() {

    this.setData({ loading: true, loadError: '' });

    try {

      await app.checkLogin();

      const [addresses, stores] = await Promise.all([api.getAddresses(), api.getStores()]);

      const address = addresses.find(a => a.is_default) || addresses[0];

      const store = stores[0];

      this.setData({ address, store, stores: stores || [] });



      if (this.data.deliveryType === 'delivery' && !address) {

        this.setData({ loading: false, needAddress: true, preview: null });

        return;

      }

      await this.preview();

      this.setData({ loading: false, needAddress: false });

    } catch (err) {

      this.setData({

        loading: false,

        loadError: err.errMsg?.includes('fail') ? '无法连接服务器，请确认后端已启动' : '加载失败，请稍后重试'

      });

    }

  },



  getPreviewParams() {

    const { cartIds, deliveryType, address, store, selectedCouponId } = this.data;

    const params = {

      cartIds,

      deliveryType,

      addressId: address?.id,

      storeId: store?.id

    };

    if (selectedCouponId) params.couponId = selectedCouponId;

    return params;

  },



  async preview() {

    const { cartIds, deliveryType, address } = this.data;

    if (!cartIds.length) return;

    if (deliveryType === 'delivery' && !address) {

      this.setData({ needAddress: true, preview: null });

      return;

    }

    try {

      const preview = await api.previewOrder(this.getPreviewParams());

      if (!app.globalData.checkoutContext) app.globalData.checkoutContext = {};

      app.globalData.checkoutContext.productAmount = parseFloat(preview.productAmount);

      app.globalData.checkoutContext.deliveryType = deliveryType;

      this.setData({ preview, needAddress: false, loadError: '' });

    } catch {

      this.setData({ preview: null });

    }

  },



  switchDelivery(e) {

    const type = e.currentTarget.dataset.type;

    if (type === this.data.deliveryType) return;

    if (type === 'pickup' && this.data.selectedCouponId) {

      const ctx = app.globalData.checkoutContext || {};

      // 配送券在自提时清除

      this.setData({ selectedCouponId: null, selectedCouponName: '' });

      ctx.selectedCouponId = null;

      ctx.selectedCouponName = '';

    }

    this.setData({

      deliveryType: type,

      needAddress: false,

      selectedTimeSlot: '尽快送达'

    });

    if (!app.globalData.checkoutContext) app.globalData.checkoutContext = {};

    app.globalData.checkoutContext.deliveryType = type;

    this.preview();

  },



  selectTimeSlot(e) {

    this.setData({ selectedTimeSlot: e.currentTarget.dataset.slot });

  },



  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },



  goCoupons() {

    if (!app.globalData.checkoutContext) app.globalData.checkoutContext = {};

    const { preview, deliveryType, selectedCouponId, selectedCouponName } = this.data;

    app.globalData.checkoutContext.productAmount = preview ? parseFloat(preview.productAmount) : 0;

    app.globalData.checkoutContext.deliveryType = deliveryType;

    app.globalData.checkoutContext.selectedCouponId = selectedCouponId;

    app.globalData.checkoutContext.selectedCouponName = selectedCouponName;

    wx.navigateTo({ url: '/pages/coupon/select' });

  },



  async submitOrder() {

    const { cartIds, deliveryType, address, store, selectedTimeSlot, remark } = this.data;

    if (deliveryType === 'delivery' && !address) {

      return wx.showToast({ title: '请先添加收货地址', icon: 'none' });

    }

    if (!cartIds.length) {

      return wx.showToast({ title: '购物车为空', icon: 'none' });

    }



    try {

      await app.checkLogin();

      const res = await api.createOrder({

        ...this.getPreviewParams(),

        deliveryTimeSlot: deliveryType === 'delivery' ? selectedTimeSlot : '',

        remark

      });



      app.globalData.cartCache = null;

      app.globalData.checkoutContext = null;

      wx.redirectTo({ url: `/pages/pay/pay?orderId=${res.orderId}` });

    } catch {

      // request.js 已提示

    }

  },



  goAddress() {

    wx.navigateTo({ url: '/pages/address/list?select=1' });

  },



  goAddAddress() {

    wx.navigateTo({ url: '/pages/address/edit' });

  }

});


