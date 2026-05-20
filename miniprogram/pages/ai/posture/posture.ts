import { aiApi } from '../../../services/ai';

Page({
  data: {
    imagePath: '',
    description: '',
    result: null as any,
    loading: false,
  },

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ['camera', 'album'],
      success: (res: any) => {
        this.setData({ imagePath: res.tempFilePaths[0], result: null });
      },
    });
  },

  onDescInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ description: (e.detail as any).value });
  },

  async onSubmit() {
    if (!this.data.imagePath) {
      wx.showToast({ title: '请先拍照', icon: 'none' });
      return;
    }
    this.setData({ loading: true });
    try {
      const data = await aiApi.assessPosture(this.data.imagePath, this.data.description);
      this.setData({ result: data, loading: false });
    } catch (_) {
      wx.showToast({ title: '分析失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },
});
