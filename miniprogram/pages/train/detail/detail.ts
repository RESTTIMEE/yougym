import { trainingApi } from '../../../services/training';
import { userStore } from '../../../store/user';

Page({
  data: {
    plan: null as TrainingPlan | null,
    planId: 0,
    isLogin: false,
    trainingDays: [] as TrainingDay[],
    expandedDays: [] as number[],
    colorList: ['#1A56DB', '#FF6B4A', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'],
    cycleDays: 7,
  },

  onLoad(options) {
    this.setData({
      planId: Number(options.planId) || 0,
      isLogin: userStore.state.isLogin,
    });
    this.loadPlanDetail();
  },

  async loadPlanDetail() {
    try {
      wx.showLoading({ title: '加载中...' });
      const res = await trainingApi.getPlanDetail(this.data.planId);
      const trainingDays = res.data.trainingDays || [];
      this.setData({
        plan: res.data,
        trainingDays,
        cycleDays: res.data.cycleDays || 7,
        expandedDays: trainingDays.length > 0 ? [trainingDays[0].id] : [],
      });
    } catch (_) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  onToggleDay(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    const expanded = [...this.data.expandedDays];
    const idx = expanded.indexOf(id);
    if (idx >= 0) {
      expanded.splice(idx, 1);
    } else {
      expanded.push(id);
    }
    this.setData({ expandedDays: expanded });
  },

  onExerciseTap(e: WechatMiniprogram.TouchEvent) {
    const { exercise } = e.currentTarget.dataset;
    if (exercise.videoUrl) {
      wx.previewMedia({
        sources: [{ url: exercise.videoUrl, type: 'video' }],
      });
    } else if (exercise.imageUrl) {
      wx.previewImage({ urls: [exercise.imageUrl] });
    }
  },

  async startTraining() {
    wx.vibrateShort({ type: 'light' });
    if (!this.data.isLogin) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '创建训练...' });
      const today = new Date().toISOString().slice(0, 10);
      const res = await trainingApi.createUserPlan({
        planId: this.data.planId,
        startDate: today,
      });
      wx.hideLoading();
      wx.navigateTo({
        url: `/pages/train/execute/execute?planId=${this.data.planId}&userPlanId=${res.data.id}`,
      });
    } catch (_) {
      wx.hideLoading();
      wx.showToast({ title: '创建失败', icon: 'none' });
    }
  },
});
