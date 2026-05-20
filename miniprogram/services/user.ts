/** 用户相关 API */

import { get, post, put } from './api';

export const userApi = {
  /** 微信登录 */
  login(code: string): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return post('/auth/login', { code });
  },

  /** 获取用户资料 */
  getProfile(): Promise<ApiResponse<UserProfile>> {
    return get('/user/profile');
  },

  /** 更新用户资料 */
  updateProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
    return put('/user/profile', data);
  },

  /** 录入身体指标 */
  addBodyRecord(data: Omit<BodyRecord, 'id' | 'userId'>): Promise<ApiResponse<BodyRecord>> {
    return post('/user/body-record', data);
  },

  /** 获取身体指标历史 */
  getBodyRecords(params: PageParams): Promise<ApiResponse<PaginatedData<BodyRecord>>> {
    return get('/user/body-records', params);
  },
};
