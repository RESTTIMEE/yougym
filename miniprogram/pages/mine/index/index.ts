import { authApi } from '../../../services/auth';
import { userStore } from '../../../store/user';

Page({
  data: {
    user: null as UserProfile | null,
    isLogin: false,
    privacyAgreed: false,
    menuItems: [
      { key: 'profile',    icon: '👤', label: '个人资料', url: '/pages/mine/profile/profile' },
      { key: 'achievement', icon: '🏅', label: '我的成就', url: '/pages/mine/achievement/achievement' },
      { key: 'diet',       icon: '🍎', label: '饮食记录', url: '/pages/mine/diet/diet' },
      { key: 'privacy',    icon: '🔒', label: '隐私政策', url: '/pages/mine/privacy/privacy' },
      { key: 'agreement',  icon: '📋', label: '用户协议', url: '/pages/mine/agreement/agreement' },
      { key: 'about',      icon: 'ℹ️', label: '关于优健', url: '' },
    ],
  },

  onShow() {
    this.setData({
      user: userStore.state.profile,
      isLogin: userStore.state.isLogin,
    });
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
      const res = await authApi.login(code);
      // authApi.login internally calls userStore.setLogin with dual tokens
      this.setData({ isLogin: true, user: res.user });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  onMenuItemTap(e: WechatMiniprogram.TouchEvent) {
    wx.vibrateShort({ type: 'light' });
    const { url } = e.currentTarget.dataset;
    if (url) wx.navigateTo({ url });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出当前账号？',
      success: (res) => {
        if (res.confirm) {
          userStore.logout();
          this.setData({ isLogin: false, user: null });
        }
      },
    });
  },
});
