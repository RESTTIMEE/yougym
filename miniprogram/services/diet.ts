/** 饮食管理 API */

import { get, post } from './api';

export const dietApi = {
  /** 搜索食物 */
  searchFoods(keyword: string): Promise<ApiResponse<any[]>> {
    return get('/diet/foods', { keyword });
  },

  /** 批量添加饮食记录 */
  addRecords(data: { mealType: string; recordDate: string; items: { foodId: number; servingAmount: number }[] }): Promise<ApiResponse<any>> {
    return post('/diet/records', data);
  },

  /** 获取饮食记录列表 */
  getRecords(params: PageParams & { mealType?: string; recordDate?: string }): Promise<ApiResponse<PaginatedData<any>>> {
    return get('/diet/records', params);
  },

  /** 获取常用食物（快速录入） */
  getFrequentFoods(): Promise<ApiResponse<any[]>> {
    return get('/diet/frequent-foods');
  },

  /** 获取推荐饮食计划 */
  getPlan(): Promise<ApiResponse<any>> {
    return get('/diet/plan');
  },

  /** 保存饮食计划 */
  savePlan(data: any): Promise<ApiResponse<any>> {
    return post('/diet/plan', data);
  },
};
