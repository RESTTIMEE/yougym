import { userApi } from '../../../services/user';
import { userStore } from '../../../store/user';

interface ProfileErrors {
  height?: string;
  weight?: string;
}

Page({
  data: {
    profile: {} as Partial<UserProfile>,
    genders: ['未知', '男', '女'],
    genderIndex: 0,
    goals: [
      { value: 'muscle_gain', label: '增肌' },
      { value: 'fat_loss', label: '减脂' },
      { value: 'posture_correction', label: '体态矫正' },
    ],
    goalIndex: 0,
    restOptions: [30, 60, 90, 120],
    restIndex: 1,
    errors: {} as ProfileErrors,
  },

  onShow() {
    const p = userStore.state.profile;
    if (p) {
      const restIdx = this.data.restOptions.indexOf(p.restSeconds || 60);
      this.setData({
        profile: p,
        genderIndex: p.gender || 0,
        goalIndex: this.data.goals.findIndex(g => g.value === p.fitnessGoal) || 0,
        restIndex: restIdx >= 0 ? restIdx : 1,
        errors: {},
      });
    }
  },

  onHeightInput(e: WechatMiniprogram.Input) {
    const val = Number(e.detail.value);
    const errors = { ...this.data.errors };
    if (val && (val < 50 || val > 250)) {
      errors.height = '身高范围 50-250cm';
    } else {
      errors.height = '';
    }
    this.setData({ 'profile.height': val, errors });
  },

  onWeightInput(e: WechatMiniprogram.Input) {
    const val = Number(e.detail.value);
    const errors = { ...this.data.errors };
    if (val && (val < 20 || val > 500)) {
      errors.weight = '体重范围 20-500kg';
    } else {
      errors.weight = '';
    }
    this.setData({ 'profile.weight': val, errors });
  },

  onGenderChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value);
    this.setData({ genderIndex: idx, 'profile.gender': idx });
  },

  onGoalChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value);
    this.setData({ goalIndex: idx, 'profile.fitnessGoal': this.data.goals[idx].value });
  },

  onRestChange(e: WechatMiniprogram.PickerChange) {
    const idx = Number(e.detail.value);
    this.setData({ restIndex: idx, 'profile.restSeconds': this.data.restOptions[idx] });
  },

  validate(): boolean {
    const errors: ProfileErrors = {};
    const h = this.data.profile.height;
    const w = this.data.profile.weight;
    if (h && (h < 50 || h > 250)) errors.height = '身高范围 50-250cm';
    if (w && (w < 20 || w > 500)) errors.weight = '体重范围 20-500kg';
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
      const res = await userApi.updateProfile(this.data.profile);
      userStore.state.profile = res.data;
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },
});
