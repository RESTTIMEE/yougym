import { dataApi } from '../../services/data';
import { userStore } from '../../store/user';

Page({
  data: {
    showLogin: false,
    privacyAgreed: false,
    greeting: '',
    totalDays: 0,
    streakDays: 0,
    avgDuration: 0,
    latestRecord: null as BodyRecord | null,
    isLoading: false,
    userAvatar: '',
    userNickname: '',
  },

  onLoad() {
    this.setData({ greeting: this.getGreeting() });
  },

  onShow() {
    const profile = userStore.state.profile;
    if (profile) {
      this.setData({
        userAvatar: profile.avatarUrl || '',
        userNickname: profile.nickname || '优健伙伴',
      });
    }
    if (userStore.state.isLogin) {
      this.setData({ showLogin: false });
      this.loadDashboard();
    } else {
      this.setData({ showLogin: true });
    }
  },

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  },

  async loadDashboard() {
    this.setData({ isLoading: true });
    try {
      const res = await dataApi.getDashboard();
      this.setData({
        totalDays: res.data.totalDays,
        streakDays: res.data.streakDays,
        avgDuration: res.data.avgDurationMinutes,
        latestRecord: res.data.latestBodyRecord,
      });
    } catch {
      // 未登录或无数据时静默处理
    } finally {
      this.setData({ isLoading: false });
    }
  },

  togglePrivacy() {
    this.setData({ privacyAgreed: !this.data.privacyAgreed });
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/mine/privacy/privacy' });
  },

  goAgreement() {
    wx.navigateTo({ url: '/pages/mine/agreement/agreement' });
  },

  async onLogin() {
    if (!this.data.privacyAgreed) {
      wx.showToast({ title: '请先阅读并同意隐私政策', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '登录中...' });
      const { code } = await wx.login();
      const { authApi } = await import('../../services/auth');
      const res = await authApi.login(code);
      this.setData({ showLogin: false, userAvatar: res.user.avatarUrl, userNickname: res.user.nickname });
      wx.hideLoading();
      this.loadDashboard();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  goToTrain() {
    wx.vibrateShort({ type: 'light' });
    wx.switchTab({ url: '/pages/train/index/index' });
  },

  goToData() {
    wx.vibrateShort({ type: 'light' });
    wx.switchTab({ url: '/pages/data/index/index' });
  },

});
