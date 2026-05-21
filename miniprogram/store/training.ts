/** 训练状态管理 */

interface TrainingState {
  currentPlan: TrainingPlan | null;
  checkinHistory: CheckinRecord[];
}

export const trainingStore = {
  state: {
    currentPlan: null,
    checkinHistory: [],
  } as TrainingState,

  /** 设置当前训练计划 */
  setCurrentPlan(plan: TrainingPlan) {
    this.state.currentPlan = plan;
  },

  /** 添加打卡记录 */
  addCheckin(record: CheckinRecord) {
    this.state.checkinHistory.unshift(record);
  },

  /** 计算连续打卡天数 */
  getStreak(): number {
    const records = this.state.checkinHistory;
    if (records.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      if (records.some(r => r.checkinDate === dateStr)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  },
};
