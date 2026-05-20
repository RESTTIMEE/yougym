import { dietApi } from '../../services/diet';

let searchTimer = 0;

Component({
  data: {
    keyword: '',
    searching: false,
    showResults: false,
    results: [] as any[],
    selectedFood: null as any,
    amount: 100,
  },
  methods: {
    onInput(e: WechatMiniprogram.InputEvent) {
      const keyword = (e.detail as any).value || '';
      this.setData({ keyword });
      if (!keyword.trim()) {
        this.setData({ showResults: false, results: [] });
        return;
      }
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.setData({ searching: true });
        dietApi.searchFoods(keyword).then((res: any) => {
          this.setData({ results: res.data || [], showResults: true, searching: false });
        }).catch(() => { // 计算失败静默，不影响主流程
          this.setData({ searching: false });
        });
      }, 300);
    },

    onSelectFood(e: WechatMiniprogram.TouchEvent) {
      const { food } = e.currentTarget.dataset;
      this.setData({
        selectedFood: food,
        amount: 100,
        showResults: false,
        keyword: food.foodName,
      });
      this.calcCalories();
    },

    onAmountChange(e: WechatMiniprogram.InputEvent) {
      const val = Number(e.detail.value);
      if (val > 0 && val <= 5000) {
        this.setData({ amount: val });
        this.calcCalories();
      }
    },

    calcCalories() {
      const { selectedFood, amount } = this.data;
      if (!selectedFood) return;
      const factor = amount / 100;
      const calcResult = {
        total: Math.round(selectedFood.caloriesPer100g * factor),
        protein: Math.round(selectedFood.proteinG * factor * 10) / 10,
        fat: Math.round(selectedFood.fatG * factor * 10) / 10,
        carbs: Math.round(selectedFood.carbsG * factor * 10) / 10,
      };
      this.setData({ 'selectedFood.calcResult': calcResult });
    },

    onClear() {
      this.setData({
        selectedFood: null,
        keyword: '',
        showResults: false,
        results: [],
        amount: 100,
      });
    },
  },
});
