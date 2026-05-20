/** 数据与报告 API */

import { get, post } from './api';

export const dataApi = {
  /** 获取首页数据看板摘要 */
  getDashboard(): Promise<ApiResponse<{
    totalDays: number;
    streakDays: number;
    avgDurationMinutes: number;
    latestBodyRecord: BodyRecord | null;
  }>> {
    return get('/user/dashboard');
  },

  /** 获取身体数据记录（图表用） */
  getBodyRecords(params: PageParams): Promise<ApiResponse<PaginatedData<BodyRecord>>> {
    return get('/user/body-records', params);
  },

  /** 月度身材报告 */
  postMonthlyReport(data: {
    startWeight: number; endWeight: number;
    startChest?: number; endChest?: number;
    startWaist?: number; endWaist?: number;
    startHip?: number; endHip?: number;
  }): Promise<ApiResponse<any>> {
    return post('/user/monthly-report', data);
  },
};
