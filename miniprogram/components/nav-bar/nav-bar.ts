/** 自定义导航栏组件 */
Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    backgroundColor: { type: String, value: '#1A56DB' },
  },
  methods: {
    onBack() {
      wx.navigateBack();
    },
  },
});
