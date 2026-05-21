/** 格式化工具函数 */

/** 格式化日期 YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 格式化时长（分钟 → XhYm） */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m}m` : `${m}m`;
}

/** 格式化千卡热量 */
export function formatCalories(kcal: number): string {
  return `${Math.round(kcal)} kcal`;
}
