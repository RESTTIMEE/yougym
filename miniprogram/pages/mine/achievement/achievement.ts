import { achievementApi } from '../../../services/achievement';

Page({
  data: {
    points: 0,
    displayPoints: 0,
    achievements: [] as any[],
    loading: true,
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [achievements] = await Promise.all([
        achievementApi.getMyAchievements(),
      ]);
      this.setData({ achievements });
    } catch (_) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    try {
      const { points } = await achievementApi.getMyPoints();
      this.setData({ points });
      this.animatePoints(0, points);
    } catch (_) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    this.setData({ loading: false });
  },

  animatePoints(from: number, to: number) {
    const duration = 800;
    const startTime = Date.now();
    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.setData({ displayPoints: Math.round(from + (to - from) * eased) });
      if (progress < 1) {
        setTimeout(step, 16);
      } else {
        this.setData({ displayPoints: to });
      }
    };
    step();
  },
});
