import { trainingApi } from '../../../services/training';
import { userStore } from '../../../store/user';

Page({
  data: {
    categories: [
      { key: 'muscle_gain', name: '增肌', icon: '💪', desc: '科学增重 肌肉塑形' },
      { key: 'fat_loss', name: '减脂', icon: '🔥', desc: '高效燃脂 定制方案' },
      { key: 'posture_correction', name: '体态矫正', icon: '🧘', desc: '改善体态 重塑身形' },
    ],
    hotPlans: [] as TrainingPlan[],
    activeCategory: 'muscle_gain',
    myPlans: [] as any[],
    todayTraining: null as any,
    isLogin: false,
    heatmapYear: new Date().getFullYear(),
    yearCheckins: [] as any[],
    loading: true,
  },

  onShow() {
    this.setData({ isLogin: userStore.state.isLogin });
    this.loadHotPlans();
    if (userStore.state.isLogin) {
      this.loadMyPlans();
      this.loadHeatmap();
    }
  },

  async loadHotPlans() {
    try {
      const res = await trainingApi.getPlans({ category: this.data.activeCategory, page: 1, pageSize: 3 });
      this.setData({ hotPlans: res.data.list, loading: false });
    } catch (_) { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }); }
  },

  async loadMyPlans() {
    try {
      const res = await trainingApi.getMyPlans();
      const myPlans = res.data || [];
      // Calculate today's training day
      let todayTraining: any = null;
      if (myPlans.length > 0) {
        const active = myPlans[0];
        const startDate = new Date(active.startDate);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
        const cycleDays = active.cycleDays || active.plan?.cycleDays || 7;
        const dayNumber = (daysDiff % cycleDays) + 1;
        const trainingDays = active.trainingDays || active.plan?.trainingDays || [];
        const todayDay = trainingDays.find((d: any) => d.dayNumber === dayNumber);
        todayTraining = {
          planId: active.planId,
          userPlanId: active.id,
          planName: active.planName || active.plan?.name,
          dayNumber,
          dayName: todayDay?.dayName || '自由训练',
          hasExercises: todayDay?.exercises?.length > 0 || (trainingDays.length === 0),
        };
      }
      this.setData({ myPlans, todayTraining });
    } catch (_) { wx.showToast({ title: '加载失败', icon: 'none' }); }
  },

  onCategoryTap(e: WechatMiniprogram.TouchEvent) {
    wx.vibrateShort({ type: 'light' });
    const { key } = e.currentTarget.dataset;
    this.setData({ activeCategory: key });
    wx.navigateTo({ url: `/pages/train/plan/plan?category=${key}` });
  },

  onPlanTap(e: WechatMiniprogram.TouchEvent) {
    wx.vibrateShort({ type: 'light' });
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/train/detail/detail?planId=${id}` });
  },

  onMyPlanTap(e: WechatMiniprogram.TouchEvent) {
    wx.vibrateShort({ type: 'light' });
    const { id, planid } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/train/execute/execute?planId=${planid}&userPlanId=${id}` });
  },

  async loadHeatmap() {
    try {
      const res = await trainingApi.getYearCheckins(this.data.heatmapYear);
      this.setData({ yearCheckins: res.data || [] });
    } catch (_) { wx.showToast({ title: '加载失败', icon: 'none' }); }
  },

  onHeatmapYearChange(e: any) {
    const year = e.detail.year;
    this.setData({ heatmapYear: year });
    this.loadHeatmap();
  },

  onCreatePlan() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/train/create/create' });
  },

  onTodayTap() {
    wx.vibrateShort({ type: 'light' });
    const t = this.data.todayTraining;
    if (t) {
      wx.navigateTo({ url: `/pages/train/execute/execute?planId=${t.planId}&userPlanId=${t.userPlanId}` });
    }
  },

  onGoHistory() {
    wx.vibrateShort({ type: 'light' });
    wx.navigateTo({ url: '/pages/train/history/history' });
  },
});
