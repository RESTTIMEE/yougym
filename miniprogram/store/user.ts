/** 用户状态管理（支持双令牌：accessToken + refreshToken） */

interface UserState {
  accessToken: string;
  refreshToken: string;
  profile: UserProfile | null;
  isLogin: boolean;
}

/**
 * 用户 Store —— 后续可替换为 @westore 或 MobX
 */
export const userStore = {
  state: {
    accessToken: '',
    refreshToken: '',
    profile: null,
    isLogin: false,
  } as UserState,

  /** 初始化：从本地缓存恢复 */
  init() {
    this.state.accessToken = wx.getStorageSync('accessToken') || '';
    this.state.refreshToken = wx.getStorageSync('refreshToken') || '';
    this.state.isLogin = !!this.state.accessToken;
  },

  /** 设置登录态 */
  setLogin(accessToken: string, refreshToken: string, profile: UserProfile) {
    this.state.accessToken = accessToken;
    this.state.refreshToken = refreshToken;
    this.state.profile = profile;
    this.state.isLogin = true;
    wx.setStorageSync('accessToken', accessToken);
    wx.setStorageSync('refreshToken', refreshToken);
  },

  /** 退出登录 */
  logout() {
    this.state.accessToken = '';
    this.state.refreshToken = '';
    this.state.profile = null;
    this.state.isLogin = false;
    wx.removeStorageSync('accessToken');
    wx.removeStorageSync('refreshToken');
  },

  /** 获取 access token */
  getToken(): string {
    return this.state.accessToken;
  },
};
