import { userApi } from '../../../services/user';

Page({
  data: {
    bodyRecords: [] as BodyRecord[],
    loading: true,
  },

  onShow() {
    this.loadBodyRecords();
  },

  async loadBodyRecords() {
    try {
      const res = await userApi.getBodyRecords({ page: 1, pageSize: 90 });
      const records = res.data.list.reverse();
      this.setData({ bodyRecords: records, loading: false });
    } catch (_) { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }); }
  },

  goToBody() {
    wx.navigateTo({ url: '/pages/data/body/body' });
  },

  goToReport(e: WechatMiniprogram.TouchEvent) {
    const { type } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/data/report/report?type=${type}` });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/train/history/history' });
  },
});
