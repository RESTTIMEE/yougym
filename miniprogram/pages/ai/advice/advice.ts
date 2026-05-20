import { aiApi } from '../../../services/ai';

Page({
  data: {
    activeTab: 'training' as string,
    trainingAdvice: [] as string[],
    dietEvaluation: '',
    dietSuggestions: [] as string[],
    generatedAt: '',
    cached: false,
    streaming: false,
    streamText: '',
    streamCursor: false,
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: 'AI 建议' });
    this.loadTrainingAdvice();
  },

  async loadTrainingAdvice() {
    this.setData({ streaming: true, streamText: '', streamCursor: true, trainingAdvice: [] });
    try {
      await aiApi.streamTrainingAdvice((text: string) => {
        this.setData({ streamText: this.data.streamText + text });
      });
      this.finishStream('training');
    } catch (_) {
      if (!this.data.streamText) {
        wx.showToast({ title: '获取失败', icon: 'none' });
        this.setData({ streaming: false, streamCursor: false });
      } else {
        this.finishStream('training');
      }
    }
  },

  async loadDietAdvice() {
    this.setData({ streaming: true, streamText: '', streamCursor: true, dietEvaluation: '', dietSuggestions: [] });
    try {
      await aiApi.streamDietAdvice((text: string) => {
        this.setData({ streamText: this.data.streamText + text });
      });
      this.finishStream('diet');
    } catch (_) {
      if (!this.data.streamText) {
        wx.showToast({ title: '获取失败', icon: 'none' });
        this.setData({ streaming: false, streamCursor: false });
      } else {
        this.finishStream('diet');
      }
    }
  },

  finishStream(type: 'training' | 'diet') {
    this.setData({ streamCursor: false, generatedAt: new Date().toISOString() });
    const raw = this.data.streamText;
    if (type === 'training') {
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        this.setData({ trainingAdvice: parsed.advice || [raw], streaming: false });
      } catch {
        const lines = raw.split('\n').filter(l => l.trim());
        this.setData({ trainingAdvice: lines, streaming: false });
      }
    } else {
      try {
        const cleaned = raw.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        this.setData({
          dietEvaluation: parsed.evaluation || '',
          dietSuggestions: parsed.suggestions || [],
          streaming: false,
        });
      } catch {
        this.setData({ dietEvaluation: raw, streaming: false });
      }
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    if (tab === 'training' && this.data.trainingAdvice.length === 0 && !this.data.streaming) {
      this.loadTrainingAdvice();
    }
    if (tab === 'diet' && !this.data.dietEvaluation && !this.data.streaming) {
      this.loadDietAdvice();
    }
  },

  onRefresh() {
    if (this.data.activeTab === 'training') this.loadTrainingAdvice();
    else this.loadDietAdvice();
  },
});
