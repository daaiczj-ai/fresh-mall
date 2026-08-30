Component({
  properties: {
    title: { type: String, value: '' },
    showSearch: { type: Boolean, value: false }
  },

  data: {
    statusBarHeight: 44,
    navHeight: 88
  },

  lifetimes: {
    attached() {
      const win = wx.getWindowInfo();
      const statusBarHeight = win.statusBarHeight || 44;
      const searchHeight = this.properties.showSearch
        ? Math.round(88 * win.windowWidth / 750)
        : 0;
      const navHeight = statusBarHeight + 44 + searchHeight;
      this.setData({ statusBarHeight, navHeight });
      this.triggerEvent('ready', { navHeight });
    }
  },

  methods: {
    onSearchTap() {
      this.triggerEvent('search');
    }
  }
});
