import { post } from './api';
import { userStore } from '../store/user';
import { BASE_URL } from '../utils/constants';

export const authApi = {
  async login(code: string) {
    const res = await post<ApiResponse<{ accessToken: string; refreshToken: string; user: UserProfile }>>('/auth/login', { code });
    if (res.data?.accessToken) {
      userStore.setLogin(res.data.accessToken, res.data.refreshToken, res.data.user);
    }
    return res.data;
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await new Promise<any>((resolve, reject) => {
        wx.request({
          url: `${BASE_URL}/auth/logout`,
          method: 'POST',
          data: { refreshToken },
          header: { 'Content-Type': 'application/json', Authorization: `Bearer ${wx.getStorageSync('accessToken') || ''}` },
          success: (r) => {
            if (r.statusCode === 200) resolve(undefined);
            else reject(new Error('Logout failed'));
          },
          fail: reject,
        });
      });
    } catch { /* fire-and-forget */ }
  },

  async refresh(): Promise<string | null> {
    const refreshToken = wx.getStorageSync('refreshToken');
    if (!refreshToken) return null;
    try {
      // Use raw wx.request to avoid the 401 interceptor in api.ts (prevents infinite loop)
      const res = await new Promise<any>((resolve, reject) => {
        wx.request({
          url: `${BASE_URL}/auth/refresh`,
          method: 'POST',
          data: { refreshToken },
          header: { 'Content-Type': 'application/json' },
          success: (r) => {
            if (r.statusCode === 200) {
              const body = r.data as any;
              resolve(body.data || body);
            } else reject(new Error('Refresh failed'));
          },
          fail: reject,
        });
      });
      userStore.setLogin(res.accessToken, res.refreshToken, userStore.state.profile!);
      return res.accessToken;
    } catch {
      userStore.logout();
      return null;
    }
  },
};
