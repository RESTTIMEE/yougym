import { userApi } from '../../../services/user';
import { isValidWeight } from '../../../utils/validator';

interface BodyErrors {
  weight?: string;
  bodyFatPct?: string;
  muscleMassKg?: string;
  flexibilityScore?: string;
  chest?: string;
  waist?: string;
  hip?: string;
}

function validateNumber(val: string, min: number, max: number): string | null {
  if (!val) return null;
  const n = Number(val);
  if (isNaN(n)) return '请输入有效数字';
  if (n < min) return `不能低于${min}`;
  if (n > max) return `不能超过${max}`;
  return null;
}

Page({
  data: {
    weight: '',
    bodyFatPct: '',
    muscleMassKg: '',
    flexibilityScore: '',
    chest: '',
    waist: '',
    hip: '',
    date: '',
    errors: {} as BodyErrors,
  },

  onLoad() {
    const now = new Date();
    this.setData({
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    });
  },

  onDateChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ date: e.detail.value });
  },

  onFieldInput(e: WechatMiniprogram.InputEvent) {
    const { field } = e.currentTarget.dataset;
    const errors = { ...this.data.errors, [field]: '' };
    this.setData({ [field]: e.detail.value, errors });
  },

  validate(): boolean {
    const errors: BodyErrors = {};
    const w = Number(this.data.weight);
    if (!isValidWeight(w)) {
      errors.weight = '请输入有效体重 (20-300kg)';
    }

    const checks: [string, number, number][] = [
      ['bodyFatPct', 1, 50],
      ['muscleMassKg', 1, 150],
      ['flexibilityScore', 1, 10],
      ['chest', 50, 200],
      ['waist', 50, 200],
      ['hip', 50, 200],
    ];
    for (const [field, min, max] of checks) {
      const msg = validateNumber(this.data[field], min, max);
      if (msg) errors[field] = msg;
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  async onSubmit() {
    if (!this.validate()) {
      wx.vibrateShort({ type: 'medium' });
      return;
    }
    try {
      wx.showLoading({ title: '保存中...' });
      await userApi.addBodyRecord({
        weight: Number(this.data.weight),
        bodyFatPct: this.data.bodyFatPct ? Number(this.data.bodyFatPct) : undefined,
        chest: this.data.chest ? Number(this.data.chest) : undefined,
        waist: this.data.waist ? Number(this.data.waist) : undefined,
        hip: this.data.hip ? Number(this.data.hip) : undefined,
        muscleMassKg: this.data.muscleMassKg ? Number(this.data.muscleMassKg) : undefined,
        flexibilityScore: this.data.flexibilityScore ? Number(this.data.flexibilityScore) : undefined,
        recordDate: this.data.date,
      });
      wx.hideLoading();
      wx.showToast({ title: '记录成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '记录失败', icon: 'none' });
    }
  },
});
