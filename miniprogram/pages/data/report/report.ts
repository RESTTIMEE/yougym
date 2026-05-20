import { trainingApi } from '../../../services/training';
import { dataApi } from '../../../services/data';

Page({
  data: {
    activeTab: 'cycle' as string,
    cycleReport: null as any,
    shareImagePath: '',
    startWeight: '', endWeight: '',
    startChest: '', endChest: '',
    startWaist: '', endWaist: '',
    startHip: '', endHip: '',
    monthlyResult: null as any,
  },

  onLoad(options) {
    const type = options.type || 'cycle';
    this.setData({ activeTab: type === 'monthly' ? 'monthly' : 'cycle' });
    if (this.data.activeTab === 'cycle') {
      this.loadCycleReport();
    }
  },

  async loadCycleReport() {
    try {
      const plansRes = await trainingApi.getMyPlans();
      if (plansRes.data.length > 0) {
        const report = await trainingApi.getCycleReport(plansRes.data[0].id);
        this.setData({ cycleReport: report.data });
      }
    } catch (_) { wx.showToast({ title: '加载失败', icon: 'none' }); }
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
    if (tab === 'cycle') this.loadCycleReport();
  },

  onFieldInput(e: WechatMiniprogram.InputEvent) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [field]: e.detail.value });
  },

  async calcMonthly() {
    const sw = Number(this.data.startWeight);
    const ew = Number(this.data.endWeight);
    if (!sw || !ew) {
      wx.showToast({ title: '请输入月初月末体重', icon: 'none' });
      return;
    }
    try {
      const res = await dataApi.postMonthlyReport({
        startWeight: sw, endWeight: ew,
        startChest: this.data.startChest ? Number(this.data.startChest) : undefined,
        endChest: this.data.endChest ? Number(this.data.endChest) : undefined,
        startWaist: this.data.startWaist ? Number(this.data.startWaist) : undefined,
        endWaist: this.data.endWaist ? Number(this.data.endWaist) : undefined,
        startHip: this.data.startHip ? Number(this.data.startHip) : undefined,
        endHip: this.data.endHip ? Number(this.data.endHip) : undefined,
      });
      this.setData({ monthlyResult: res.data });
    } catch (_) {
      wx.showToast({ title: '计算失败', icon: 'none' });
    }
  },

  async generateShareCard() {
    if (!this.data.cycleReport) return;
    wx.showLoading({ title: '生成中...' });

    try {
      const r = this.data.cycleReport;
      const query = wx.createSelectorQuery();
      query.select('#shareCanvas')
        .fields({ node: true, size: true })
        .exec((res: any) => {
          if (!res || !res[0]) {
            wx.hideLoading();
            return;
          }
          const canvas = res[0].node;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;
          const w = 300;
          const h = 400;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.scale(dpr, dpr);

          // 背景渐变
          const gradient = ctx.createLinearGradient(0, 0, 0, h);
          gradient.addColorStop(0, '#1A56DB');
          gradient.addColorStop(1, '#4F7DE0');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);

          // 白色卡片
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.roundRect(16, 16, w - 32, h - 32, 12);
          ctx.fill();

          // 标题
          ctx.fillStyle = '#1A56DB';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('优健训练报告', w / 2, 60);

          // 分隔线
          ctx.strokeStyle = '#E5E5EA';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(32, 80);
          ctx.lineTo(w - 32, 80);
          ctx.stroke();

          // 统计数据
          const stats = [
            { label: '计划名称', value: r.planName },
            { label: '周期天数', value: `${r.cycleDays}天` },
            { label: '打卡天数', value: `${r.totalDays}天` },
            { label: '训练总时长', value: `${r.totalDurationMinutes}分钟` },
            { label: '平均感受', value: `${r.avgFeelingRating}/5` },
          ];
          stats.forEach((s, i) => {
            const y = 105 + i * 36;
            ctx.fillStyle = '#999999';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(s.label, 40, y);
            ctx.fillStyle = '#333333';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(s.value, w - 40, y);
          });

          // 底部
          ctx.fillStyle = '#999999';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('扫码加入优健，开启科学健身之旅', w / 2, h - 50);
          ctx.fillText(`生成时间: ${new Date().toLocaleDateString('zh-CN')}`, w / 2, h - 32);

          // 导出
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas,
              success: (result: any) => {
                wx.hideLoading();
                this.setData({ shareImagePath: result.tempFilePath });
              },
              fail: () => {
                wx.hideLoading();
                wx.showToast({ title: '生成失败', icon: 'none' });
              },
            });
          }, 300);
        });
    } catch (_) {
      wx.hideLoading();
      wx.showToast({ title: '生成失败', icon: 'none' });
    }
  },

  async saveToAlbum() {
    if (!this.data.shareImagePath) return;
    try {
      await wx.saveImageToPhotosAlbum({ filePath: this.data.shareImagePath });
      wx.showToast({ title: '已保存到相册', icon: 'success' });
    } catch (_) {
      wx.showToast({ title: '保存失败，请授权相册权限', icon: 'none' });
    }
  },
});
