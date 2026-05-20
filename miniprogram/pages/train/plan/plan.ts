import { trainingApi } from '../../../services/training';

Page({
  data: {
    category: '' as string,
    plans: [] as TrainingPlan[],
    page: 1,
    total: 0,
    isLoading: false,
    hasMore: true,
  },

  onLoad(options) {
    const category = options.category || 'muscle_gain';
    const categoryMap: Record<string, string> = {
      muscle_gain: '增肌',
      fat_loss: '减脂',
      posture_correction: '体态矫正',
    };
    wx.setNavigationBarTitle({ title: categoryMap[category] + '训练计划' });
    this.setData({ category });
    this.loadPlans();
  },

  async loadPlans() {
    if (this.data.isLoading || (!this.data.hasMore && this.data.page > 1)) return;
    this.setData({ isLoading: true });
    try {
      const res = await trainingApi.getPlans({
        category: this.data.category,
        page: this.data.page,
        pageSize: 10,
      });
      this.setData({
        plans: this.data.page === 1 ? res.data.list : [...this.data.plans, ...res.data.list],
        total: res.data.total,
        hasMore: this.data.plans.length + res.data.list.length < res.data.total,
        isLoading: false,
      });
    } catch (_) {
      this.setData({ isLoading: false });
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.setData({ page: this.data.page + 1 });
      this.loadPlans();
    }
  },

  onPlanTap(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/train/detail/detail?planId=${id}` });
  },
});
