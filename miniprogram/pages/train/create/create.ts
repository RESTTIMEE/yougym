import { trainingApi } from '../../../services/training';

interface DayGroup {
  key: number;
  dayNumber: number;
  dayName: string;
  exercises: ExerciseItem[];
  expanded: boolean;
}

interface ExerciseItem {
  key: number;
  exerciseName: string;
  sets: number;
  reps: number;
  restSeconds: number;
  imageUrl: string;
  videoUrl: string;
  description: string;
  sortOrder: number;
}

let nextKey = 1;
function genKey(): number { return nextKey++; }

const COLOR_LIST = ['#1A56DB', '#FF6B4A', '#22C55E', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

Page({
  data: {
    name: '',
    description: '',
    categoryIndex: 0,
    categories: [
      { key: 'muscle_gain', label: '增肌' },
      { key: 'fat_loss', label: '减脂' },
      { key: 'posture_correction', label: '体态矫正' },
    ],
    difficulty: 1,
    durationWeeks: 4,
    cycleDays: 7,
    days: [] as DayGroup[],
    colorList: COLOR_LIST,
    saving: false,
  },

  onLoad() {
    this.initDays(7);
  },

  initDays(total: number) {
    const days: DayGroup[] = [];
    for (let i = 1; i <= total; i++) {
      days.push({
        key: genKey(),
        dayNumber: i,
        dayName: `Day ${i}`,
        exercises: [],
        expanded: i === 1, // first day expanded by default
      });
    }
    this.setData({ days });
  },

  // Basic info handlers
  onNameInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ name: e.detail.value });
  },

  onDescInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ description: e.detail.value });
  },

  onCategoryChange(e: WechatMiniprogram.PickerChangeEvent) {
    this.setData({ categoryIndex: Number(e.detail.value) });
  },

  onDifficultyChange(e: WechatMiniprogram.SliderChangeEvent) {
    this.setData({ difficulty: e.detail.value });
  },

  onDurationChange(e: WechatMiniprogram.PickerChangeEvent) {
    const durations = [2, 4, 6, 8, 12, 16];
    this.setData({ durationWeeks: durations[Number(e.detail.value)] });
  },

  onCycleChange(e: WechatMiniprogram.PickerChangeEvent) {
    const val = [3, 5, 7][Number(e.detail.value)];
    this.setData({ cycleDays: val });
    this.initDays(val);
  },

  // Day operations
  onToggleDay(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset;
    const days = this.data.days.map(d => d.key === key ? { ...d, expanded: !d.expanded } : d);
    this.setData({ days });
  },

  onDayNameInput(e: WechatMiniprogram.InputEvent) {
    const { key } = e.currentTarget.dataset;
    const days = this.data.days.map(d => d.key === key ? { ...d, dayName: e.detail.value } : d);
    this.setData({ days });
  },

  onRemoveDay(e: WechatMiniprogram.TouchEvent) {
    const { key } = e.currentTarget.dataset;
    const days = this.data.days.filter(d => d.key !== key);
    this.setData({ days });
  },

  // Exercise operations
  onAddExercise(e: WechatMiniprogram.TouchEvent) {
    wx.vibrateShort({ type: 'light' });
    const { key } = e.currentTarget.dataset;
    const days = this.data.days.map(d => {
      if (d.key !== key) return d;
      const ex: ExerciseItem = {
        key: genKey(),
        exerciseName: '',
        sets: 3,
        reps: 12,
        restSeconds: 60,
        imageUrl: '',
        videoUrl: '',
        description: '',
        sortOrder: d.exercises.length,
      };
      return { ...d, exercises: [...d.exercises, ex], expanded: true };
    });
    this.setData({ days });
  },

  onRemoveExercise(e: WechatMiniprogram.TouchEvent) {
    const { dayKey, exKey } = e.currentTarget.dataset;
    const days = this.data.days.map(d => {
      if (d.key !== dayKey) return d;
      return { ...d, exercises: d.exercises.filter(ex => ex.key !== exKey) };
    });
    this.setData({ days });
  },

  onExerciseFieldInput(e: WechatMiniprogram.InputEvent) {
    const { dayKey, exKey, field } = e.currentTarget.dataset;
    const days = this.data.days.map(d => {
      if (d.key !== dayKey) return d;
      const exercises = d.exercises.map(ex => {
        if (ex.key !== exKey) return ex;
        return { ...ex, [field]: e.detail.value };
      });
      return { ...d, exercises };
    });
    this.setData({ days });
  },

  onExerciseNumInput(e: WechatMiniprogram.InputEvent) {
    const { dayKey, exKey, field } = e.currentTarget.dataset;
    const days = this.data.days.map(d => {
      if (d.key !== dayKey) return d;
      const exercises = d.exercises.map(ex => {
        if (ex.key !== exKey) return ex;
        return { ...ex, [field]: Number(e.detail.value) || 0 };
      });
      return { ...d, exercises };
    });
    this.setData({ days });
  },

  // Submit
  async onSubmit() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入计划名称', icon: 'none' });
      return;
    }
    // Only include days that have exercises
    const trainingDays = this.data.days
      .filter(d => d.exercises.length > 0)
      .map(d => ({
        dayNumber: d.dayNumber,
        dayName: d.dayName,
        exercises: d.exercises.map((ex, i) => ({
          exerciseName: ex.exerciseName || '未命名动作',
          sets: ex.sets || 3,
          reps: ex.reps || 12,
          restSeconds: ex.restSeconds || 60,
          description: ex.description,
          imageUrl: ex.imageUrl,
          videoUrl: ex.videoUrl,
          sortOrder: i,
        })),
      }));

    if (trainingDays.length === 0) {
      wx.showToast({ title: '请至少添加一个训练日的动作', icon: 'none' });
      return;
    }

    // Check all exercises have names
    const unnamedDay = trainingDays.find(d => d.exercises.some(e => !e.exerciseName || e.exerciseName === '未命名动作'));
    if (unnamedDay) {
      wx.showToast({ title: '请为所有动作填写名称', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      wx.showLoading({ title: '创建中...' });
      await trainingApi.createPlan({
        name: this.data.name.trim(),
        description: this.data.description.trim(),
        category: this.data.categories[this.data.categoryIndex].key,
        difficulty: this.data.difficulty,
        durationWeeks: this.data.durationWeeks,
        coverImage: '',
        cycleDays: this.data.cycleDays,
        trainingDays,
      });
      wx.hideLoading();
      wx.vibrateShort({ type: 'medium' });
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (_) {
      wx.hideLoading();
      wx.showToast({ title: '创建失败，请稍后重试', icon: 'none' });
    }
    this.setData({ saving: false });
  },
});
