/** 训练相关 API */

import { get, post } from './api';

export const trainingApi = {
  /** 获取训练计划列表 */
  getPlans(params: { category?: string; difficulty?: number } & PageParams): Promise<ApiResponse<PaginatedData<TrainingPlan>>> {
    return get('/training/plans', params);
  },

  /** 获取计划详情（含动作列表） */
  getPlanDetail(planId: number): Promise<ApiResponse<TrainingPlan>> {
    return get(`/training/plans/${planId}`);
  },

  /** 创建自定义训练计划 */
  createPlan(data: {
    name: string; description?: string; category: string; difficulty: number;
    durationWeeks: number; coverImage?: string; cycleDays: number;
    trainingDays: {
      dayNumber: number; dayName?: string;
      exercises: { exerciseName: string; sets: number; reps: number; restSeconds: number; description?: string; imageUrl?: string; videoUrl?: string; sortOrder: number }[];
    }[];
  }): Promise<ApiResponse<TrainingPlan>> {
    return post('/training/plans', data);
  },

  /** 创建用户训练计划 */
  createUserPlan(data: { planId: number; startDate: string; endDate?: string; goalDescription?: string }): Promise<ApiResponse<any>> {
    return post('/training/user-plan', data);
  },

  /** 获取我的训练计划 */
  getMyPlans(): Promise<ApiResponse<UserTrainingPlan[]>> {
    return get('/training/my-plans');
  },

  /** 训练打卡 */
  checkin(data: {
    planId: number;
    trainingDayId?: number;
    durationMinutes: number;
    feelingRating?: number;
    notes?: string;
    exercises?: { exerciseId: number; sets: { setNumber: number; weight?: number; reps: number }[] }[];
  }): Promise<ApiResponse<CheckinRecord>> {
    return post('/training/checkin', data);
  },

  /** 获取打卡记录 */
  getCheckins(params: PageParams & { startDate?: string; endDate?: string }): Promise<ApiResponse<PaginatedData<CheckinRecord>>> {
    return get('/training/checkins', params);
  },

  /** 获取周期训练报告 */
  getCycleReport(userPlanId: number): Promise<ApiResponse<any>> {
    return get('/training/report/cycle', { userPlanId });
  },

  /** 获取年度打卡热力图数据 */
  getYearCheckins(year: number): Promise<ApiResponse<Array<{ date: string; durationMinutes: number; feelingRating: number }>>> {
    return get('/training/checkins', { year });
  },
};
