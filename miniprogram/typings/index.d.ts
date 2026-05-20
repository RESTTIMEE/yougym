/// <reference types="miniprogram-api-typings" />

declare namespace WechatMiniprogram {
  // 扩展全局类型
}

/** 统一接口返回格式 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

/** 分页参数 */
interface PageParams {
  page: number;
  pageSize: number;
}

/** 分页返回 */
interface PaginatedData<T> {
  page: number;
  pageSize: number;
  total: number;
  list: T[];
}

/** 登录返回 */
interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

/** 用户资料 */
interface UserProfile {
  id: number;
  nickname: string;
  avatarUrl: string | null;
  gender: number;        // 0未知 1男 2女
  birthday: string;      // YYYY-MM-DD
  height: number;        // cm
  weight: number;        // kg
  fitnessGoal: 'muscle_gain' | 'fat_loss' | 'posture_correction';
  restSeconds: number;
}

/** 身体指标记录 */
interface BodyRecord {
  id: number;
  userId: number;
  weight: number;
  bodyFatPct?: number;
  muscleMassKg?: number;
  flexibilityScore?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  bmi?: number;
  recordDate: string;    // YYYY-MM-DD
}

/** 训练日 */
interface TrainingDay {
  id: number;
  planId: number;
  dayNumber: number;
  dayName: string;
  exercises: Exercise[];
}

/** 训练动作 */
interface Exercise {
  id: number;
  trainingDayId: number;
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds: number;
  videoUrl: string;
  imageUrl: string;
  description: string;
  sortOrder: number;
}

/** 用户训练计划 */
interface UserTrainingPlan {
  id: number;
  userId: number;
  planId: number;
  startDate: string;
  endDate: string;
  status: string;
  goalDescription?: string;
  targetWeight?: number;
  plan: TrainingPlan;
}

/** 训练计划 */
interface TrainingPlan {
  id: number;
  name: string;
  category: 'muscle_gain' | 'fat_loss' | 'posture_correction';
  creator: string;
  durationWeeks: number;
  difficulty: 1 | 2 | 3;
  description: string;
  coverImage: string;
  cycleDays: number;
  trainingDays: TrainingDay[];
  exercises?: Exercise[];  // backward compat
}

/** 打卡记录 */
interface CheckinRecord {
  id: number;
  planId: number;
  planName?: string;
  trainingDayId?: number;
  trainingDayName?: string;
  exerciseId: number | null;  // legacy, nullable — use exerciseLogs[] for per-set data
  checkinDate: string;
  completedSets: number;
  completedReps: number;
  durationMinutes: number;
  feelingRating: 1 | 2 | 3 | 4 | 5;
  notes: string;
  exerciseLogs?: ExerciseLog[];
}

/** 单组训练记录 */
interface ExerciseLog {
  id: number;
  checkinId: number;
  exerciseId: number;
  exerciseName?: string;
  setNumber: number;
  weight?: number;
  reps: number;
  completed: boolean;
}
