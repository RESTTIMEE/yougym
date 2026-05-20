import { trainingApi } from '../../../services/training';
import { userStore } from '../../../store/user';

interface SetLog {
  exerciseId: number;
  setNumber: number;
  weight?: number;
  reps: number;
}

function generateBeep(frequency: number, duration: number, sampleRate = 8000): string {
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const sample = Math.floor(128 + 100 * Math.sin(2 * Math.PI * frequency * t));
    view.setUint8(headerSize + i, Math.max(0, Math.min(255, sample)));
  }

  const base64 = wx.arrayBufferToBase64(buffer);
  return `data:audio/wav;base64,${base64}`;
}

Page({
  data: {
    planId: 0,
    userPlanId: 0,
    exercises: [] as Exercise[],
    currentIndex: 0,
    currentExercise: null as Exercise | null,
    currentSet: 1,
    setWeight: '',
    setReps: '',
    setLogs: [] as SetLog[],
    timerSeconds: 0,
    timerMinutes: 0,
    isResting: false,
    restRemaining: 0,
    restTotal: 60,
    isRunning: false,
    completedList: [] as number[],
    completed: false,
    feelingRating: 3,
    notes: '',
    userPlan: null as any,
    trainingDays: [] as TrainingDay[],
    currentDay: null as TrainingDay | null,
    currentDayNumber: 0,
    showDayPanel: false,
  },
  _timer: null as any,
  _audioCtx: null as any,

  onLoad(options) {
    const planId = Number(options.planId) || 0;
    const profile = userStore.state.profile;
    this.setData({
      planId,
      userPlanId: Number(options.userPlanId) || 0,
      restTotal: profile?.restSeconds || 60,
    });
    this.loadTrainingDays();
  },

  async loadTrainingDays() {
    try {
      // Try to get user's active plan with trainingDays
      const res = await trainingApi.getMyPlans();
      const plans = res.data || [];
      const userPlan = plans.find((p: any) => p.planId === this.data.planId);

      if (!userPlan) {
        // Fallback: load plan detail directly (no user plan)
        const detail = await trainingApi.getPlanDetail(this.data.planId);
        const trainingDays = detail.data.trainingDays || [];
        const firstDay = trainingDays[0] || null;
        this.setData({
          trainingDays,
          currentDay: firstDay,
          exercises: firstDay?.exercises || [],
          currentExercise: firstDay?.exercises?.[0] || null,
        });
        this._resetSetForExercise();
        return;
      }

      const startDate = new Date(userPlan.startDate);
      const today = new Date();
      const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / 86400000);
      const cycleDays = userPlan.cycleDays || userPlan.plan?.cycleDays || 7;
      const todayDayNumber = (daysDiff % cycleDays) + 1;
      const trainingDays = userPlan.trainingDays || userPlan.plan?.trainingDays || [];

      // Auto-locate today's training day
      const todayDay = trainingDays.find((d: TrainingDay) => d.dayNumber === todayDayNumber);
      const defaultDay = todayDay || trainingDays[0] || null;

      this.setData({
        userPlan,
        trainingDays,
        currentDayNumber: todayDayNumber,
        currentDay: defaultDay,
        exercises: defaultDay?.exercises || [],
        currentExercise: defaultDay?.exercises?.[0] || null,
      });
      this._resetSetForExercise();
    } catch (_) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },

  onToggleDayPanel() {
    this.setData({ showDayPanel: !this.data.showDayPanel });
  },

  onSelectDay(e: WechatMiniprogram.TouchEvent) {
    const { dayNumber } = e.currentTarget.dataset;
    const day = this.data.trainingDays.find((d: TrainingDay) => d.dayNumber === dayNumber);
    if (!day || day.dayNumber === this.data.currentDay?.dayNumber) {
      this.setData({ showDayPanel: false });
      return;
    }
    this.pauseTimer();
    this.setData({
      currentDay: day,
      currentDayNumber: day.dayNumber,
      exercises: day.exercises || [],
      currentIndex: 0,
      currentExercise: day.exercises?.[0] || null,
      showDayPanel: false,
      setLogs: [],
      completedList: [],
    });
    this._resetSetForExercise();
  },

  _resetSetForExercise() {
    const ex = this.data.currentExercise;
    this.setData({
      currentSet: 1,
      setWeight: '',
      setReps: ex ? String(ex.reps) : '',
    });
  },

  startTimer() {
    wx.vibrateShort({ type: 'light' });
    this.playBeep(440, 0.2);
    this.setData({ isRunning: true, isResting: false });
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const seconds = this.data.timerSeconds + 1;
      this.setData({
        timerSeconds: seconds,
        timerMinutes: Math.round(seconds / 60),
      });
    }, 1000);
  },

  pauseTimer() {
    this.setData({ isRunning: false });
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  // Per-set weight/reps handlers
  onWeightInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ setWeight: e.detail.value });
  },

  onRepsInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ setReps: e.detail.value });
  },

  adjustWeight(e: WechatMiniprogram.TouchEvent) {
    const delta = Number(e.currentTarget.dataset.delta);
    const current = parseFloat(this.data.setWeight) || 0;
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    this.setData({ setWeight: String(next) });
  },

  adjustReps(e: WechatMiniprogram.TouchEvent) {
    const delta = Number(e.currentTarget.dataset.delta);
    const current = parseInt(this.data.setReps) || 0;
    const next = Math.max(0, current + delta);
    this.setData({ setReps: String(next) });
  },

  completeSet() {
    wx.vibrateShort({ type: 'medium' });
    const ex = this.data.currentExercise!;
    const weight = parseFloat(this.data.setWeight) || undefined;
    const reps = parseInt(this.data.setReps) || ex.reps;

    // Record this set
    const setLog: SetLog = {
      exerciseId: ex.id,
      setNumber: this.data.currentSet,
      weight: weight || undefined,
      reps,
    };
    const setLogs = [...this.data.setLogs, setLog];

    if (this.data.currentSet < ex.sets) {
      // More sets in this exercise
      this.setData({
        currentSet: this.data.currentSet + 1,
        setWeight: '',
        setReps: String(ex.reps),
        setLogs,
      });
      this.playBeep(550, 0.1);
    } else {
      // All sets done for this exercise → move to next or complete
      const completedList = [...this.data.completedList, this.data.currentIndex];
      const nextIndex = this.data.currentIndex + 1;

      if (nextIndex >= this.data.exercises.length) {
        // All exercises done
        this.pauseTimer();
        this.playBeep(880, 0.15);
        setTimeout(() => this.playBeep(880, 0.15), 200);
        setTimeout(() => this.playBeep(880, 0.15), 400);
        this.setData({ completed: true, completedList, setLogs });
      } else {
        // Move to next exercise after rest
        const nextExercise = this.data.exercises[nextIndex];
        this.setData({
          currentIndex: nextIndex,
          currentExercise: nextExercise,
          isResting: true,
          restRemaining: this.data.restTotal,
          completedList,
          setLogs,
          currentSet: 1,
        });
        this.pauseTimer();
        this._startRestCountdown();
      }
    }
  },

  _startRestCountdown() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      const remaining = this.data.restRemaining - 1;
      if (remaining <= 0) {
        clearInterval(this._timer);
        this._timer = null;
        this.setData({ isResting: false, restRemaining: 0, setWeight: '', setReps: this.data.currentExercise ? String(this.data.currentExercise.reps) : '' });
        this.playBeep(660, 0.15);
        setTimeout(() => this.playBeep(880, 0.2), 200);
      } else {
        this.setData({ restRemaining: remaining });
      }
    }, 1000);
  },

  skipRest() {
    wx.vibrateShort({ type: 'light' });
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
    this._resetSetForExercise();
    this.setData({ isResting: false, restRemaining: 0, timerSeconds: 0 });
  },

  adjustRest(e: WechatMiniprogram.TouchEvent) {
    const delta = Number(e.currentTarget.dataset.delta);
    const newRemaining = Math.max(5, this.data.restRemaining + delta);
    this.setData({ restRemaining: newRemaining });
  },

  playBeep(frequency: number, duration: number) {
    try {
      const src = generateBeep(frequency, duration);
      const ctx = wx.createInnerAudioContext();
      ctx.src = src;
      ctx.play();
      ctx.onEnded(() => ctx.destroy());
      ctx.onError(() => ctx.destroy());
    } catch (_) { /* audio not critical */ }
  },

  onFeelingTap(e: WechatMiniprogram.TouchEvent) {
    wx.vibrateShort({ type: 'light' });
    this.setData({ feelingRating: Number(e.currentTarget.dataset.rating) });
  },

  async finishTraining() {
    try {
      wx.showLoading({ title: '打卡中...' });

      // Build exercises array for checkin
      const exerciseMap = new Map<number, SetLog[]>();
      for (const log of this.data.setLogs) {
        if (!exerciseMap.has(log.exerciseId)) {
          exerciseMap.set(log.exerciseId, []);
        }
        exerciseMap.get(log.exerciseId)!.push({
          exerciseId: log.exerciseId,
          setNumber: log.setNumber,
          weight: log.weight,
          reps: log.reps,
        });
      }
      const exercises = Array.from(exerciseMap.entries()).map(([exerciseId, sets]) => ({
        exerciseId,
        sets: sets.map(s => ({ setNumber: s.setNumber, weight: s.weight, reps: s.reps })),
      }));

      await trainingApi.checkin({
        planId: this.data.planId,
        trainingDayId: this.data.currentDay?.id,
        durationMinutes: Math.max(1, Math.round(this.data.timerSeconds / 60)),
        feelingRating: this.data.feelingRating,
        notes: this.data.notes,
        exercises: exercises.length > 0 ? exercises : undefined,
      });

      wx.hideLoading();
      wx.showToast({ title: '打卡成功！', icon: 'success' });
      this.checkCycleComplete();
      setTimeout(() => { wx.navigateBack(); }, 1500);
    } catch (_) {
      wx.hideLoading();
      wx.showToast({ title: '打卡失败', icon: 'none' });
    }
  },

  async checkCycleComplete() {
    try {
      const plansRes = await trainingApi.getMyPlans();
      if (plansRes.data.length === 0) return;
      const userPlan = plansRes.data[0];
      const report = await trainingApi.getCycleReport(userPlan.id);
      if (report.data.totalDays >= report.data.cycleDays) {
        wx.showModal({
          title: '周期训练完成',
          content: `已完成${report.data.cycleDays}天训练周期！查看训练报告？`,
          confirmText: '查看',
          success: (res: any) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/data/report/report?type=cycle' });
            }
          },
        });
      }
    } catch (_) { /* 静默 */ }
  },

  onNotesInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ notes: e.detail.value });
  },

  onUnload() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },
});
