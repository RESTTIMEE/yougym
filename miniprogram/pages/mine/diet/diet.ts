import { dietApi } from '../../../services/diet';

const MEAL_ORDER: Record<string, number> = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
const MEAL_LABELS: Record<string, string> = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' };

Page({
  data: {
    recordDate: '',
    mealType: 'breakfast',
    mealTypes: [
      { value: 'breakfast', label: '早餐' },
      { value: 'lunch', label: '午餐' },
      { value: 'dinner', label: '晚餐' },
      { value: 'snack', label: '加餐' },
    ],
    keyword: '',
    searchResults: [] as any[],
    currentItems: [] as any[],
    dailyRecords: [] as any[],
    frequentFoods: [] as any[],
    totalCalories: 0,
    targetCalories: 2000,
    macroTotals: { protein: 0, fat: 0, carbs: 0 },
    macroTargets: { protein: 150, fat: 60, carbs: 220 },
    groupedRecords: [] as { mealType: string; label: string; items: any[]; subCalories: number }[],
  },

  _searchTimer: 0,

  onLoad() {
    const now = new Date();
    this.setData({
      recordDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    });
    this.loadPlan();
  },

  onShow() {
    this.loadDailyRecords();
    this.loadFrequentFoods();
  },

  async loadFrequentFoods() {
    try {
      const res: any = await dietApi.getFrequentFoods();
      this.setData({ frequentFoods: res.data || [] });
    } catch (_) { /* 使用默认值回退 */ }
  },

  onQuickAdd(e: WechatMiniprogram.TouchEvent) {
    const food = e.currentTarget.dataset.food;
    wx.showModal({
      title: food.foodName,
      editable: true,
      placeholderText: '份量(克)',
      success: (res: any) => {
        if (res.confirm && res.content) {
          const grams = Number(res.content);
          if (!grams || grams <= 0) return;
          const calories = Math.round(food.caloriesPer100g * grams / 100);
          this.setData({
            currentItems: [...this.data.currentItems, { ...food, servingAmount: grams, calories }],
          });
        }
      },
    });
  },

  async loadPlan() {
    try {
      const res = await dietApi.getPlan();
      if (res.data?.dailyCalories) {
        this.setData({
          targetCalories: res.data.dailyCalories,
          macroTargets: {
            protein: res.data.proteinTargetG || 150,
            fat: res.data.fatTargetG || 60,
            carbs: res.data.carbsTargetG || 220,
          },
        });
      }
    } catch (_) { /* 使用默认值回退 */ }
  },

  onSearch(e: WechatMiniprogram.InputEvent) {
    const keyword = (e.detail as any).value || '';
    this.setData({ keyword });
    if (!keyword.trim()) {
      this.setData({ searchResults: [] });
      return;
    }
    if (this._searchTimer) clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => {
      dietApi.searchFoods(keyword).then((res: any) => {
        this.setData({ searchResults: res.data || [] });
      }).catch(() => { /* 成就解锁失败不应阻塞主流程 */ });
    }, 300);
  },

  onSelectFood(e: WechatMiniprogram.TouchEvent) {
    const food = e.currentTarget.dataset.food;
    wx.showModal({
      title: food.foodName,
      editable: true,
      placeholderText: '份量(克)',
      success: (res: any) => {
        if (res.confirm && res.content) {
          const grams = Number(res.content);
          if (!grams || grams <= 0) return;
          const calories = Math.round(food.caloriesPer100g * grams / 100);
          this.setData({
            currentItems: [...this.data.currentItems, { ...food, servingAmount: grams, calories }],
            searchResults: [],
            keyword: '',
          });
        }
      },
    });
  },

  onRemoveItem(e: WechatMiniprogram.TouchEvent) {
    const { index } = e.currentTarget.dataset;
    const items = [...this.data.currentItems];
    items.splice(index, 1);
    this.setData({ currentItems: items });
  },

  async onSubmitRecords() {
    if (this.data.currentItems.length === 0) {
      wx.showToast({ title: '请先添加食物', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '保存中...' });
      await dietApi.addRecords({
        mealType: this.data.mealType,
        recordDate: this.data.recordDate,
        items: this.data.currentItems.map(item => ({
          foodId: item.id,
          servingAmount: item.servingAmount,
        })),
      });
      wx.hideLoading();
      wx.showToast({ title: '记录成功', icon: 'success' });
      this.setData({ currentItems: [] });
      this.loadDailyRecords();
    } catch (_) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  async loadDailyRecords() {
    try {
      const res: any = await dietApi.getRecords({ page: 1, pageSize: 50, recordDate: this.data.recordDate });
      const records = res.data?.list || [];
      this.setData({
        dailyRecords: records,
        totalCalories: res.data?.totalCalories || 0,
        macroTotals: this.calcMacroTotals(records),
        groupedRecords: this.groupByMeal(records),
      });
    } catch (_) { /* 使用默认值回退 */ }
  },

  calcMacroTotals(records: any[]) {
    let protein = 0, fat = 0, carbs = 0;
    for (const r of records) {
      const ratio = r.servingAmount / 100;
      protein += Math.round((r.food.proteinG || 0) * ratio);
      fat += Math.round((r.food.fatG || 0) * ratio);
      carbs += Math.round((r.food.carbsG || 0) * ratio);
    }
    return { protein, fat, carbs };
  },

  groupByMeal(records: any[]) {
    const groups: Record<string, any[]> = {};
    for (const r of records) {
      const mt = r.mealType || 'snack';
      if (!groups[mt]) groups[mt] = [];
      groups[mt].push(r);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => (MEAL_ORDER[a] ?? 9) - (MEAL_ORDER[b] ?? 9))
      .map(([mealType, items]) => {
        let subCalories = 0;
        for (const item of items) {
          subCalories += Math.round(item.food.caloriesPer100g * item.servingAmount / 100);
        }
        return { mealType, label: MEAL_LABELS[mealType] || mealType, items, subCalories };
      });
  },

  onDateChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ recordDate: e.detail.value });
    this.loadDailyRecords();
  },

  onMealTap(e: WechatMiniprogram.TouchEvent) {
    this.setData({ mealType: e.currentTarget.dataset.value });
  },
});
