/** 全局常量定义 */

const API_URLS: Record<string, string> = {
  develop: 'http://localhost:3000/api/v1',
  trial: 'https://dev-api.yougym.com/api/v1',
  release: 'https://api.yougym.com/api/v1',
};

let env = 'develop';
try {
  env = wx.getAccountInfoSync().miniProgram.envVersion;
} catch {
  // Fall back to develop if API unavailable (e.g. unit test environment)
}

export const BASE_URL = API_URLS[env] || API_URLS.develop;

/** 健身目标枚举 */
export const FITNESS_GOAL_MAP = {
  muscle_gain: '增肌',
  fat_loss: '减脂',
  posture_correction: '体态矫正',
} as const;

/** 训练难度 */
export const DIFFICULTY_MAP = {
  1: '初级',
  2: '中级',
  3: '高级',
} as const;

/** 减脂方法 */
export const FAT_LOSS_METHODS = [
  { value: 'carb_cycle', label: '碳循环减脂法' },
  { value: 'carb_taper', label: '碳水渐降减脂法' },
  { value: 'intermittent_fasting', label: '间歇性断食法' },
  { value: 'keto', label: '生酮饮食法' },
] as const;

/** 训练计划周期选项 */
export const PLAN_DURATIONS = [4, 8, 12] as const;

/** 餐食类型 */
export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export const MEAL_TYPE_LABELS = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' } as const;
