import { userApi } from '../../../services/user';
import * as echarts from 'echarts';

Page({
  data: {
    bodyRecords: [] as BodyRecord[],
    weightBmiChart: { lazyLoad: true } as any,
    bodyFatChart: { lazyLoad: true } as any,
    loading: true,
  },

  onShow() {
    this.loadBodyRecords();
  },

  async loadBodyRecords() {
    try {
      const res = await userApi.getBodyRecords({ page: 1, pageSize: 90 });
      const records = res.data.list.reverse();
      this.setData({ bodyRecords: records, loading: false });
      this.initWeightBmiChart(records);
      this.initBodyFatChart(records);
    } catch (_) { this.setData({ loading: false }); wx.showToast({ title: '加载失败', icon: 'none' }); }
  },

  initWeightBmiChart(records: BodyRecord[]) {
    const component = this.selectComponent('#weightBmiChart');
    if (!component) return;
    component.init((canvas: any, width: number, height: number, dpr: number) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      canvas.setChart(chart);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        legend: { data: ['体重(kg)', 'BMI'], bottom: 0 },
        grid: { top: 20, right: 60, bottom: 30, left: 50 },
        xAxis: { type: 'category', data: records.map(r => r.recordDate.slice(0, 10)) },
        yAxis: [
          { type: 'value', name: '体重(kg)', min: 30, max: 150 },
          { type: 'value', name: 'BMI', min: 10, max: 45 },
        ],
        series: [
          { name: '体重(kg)', type: 'line', data: records.map(r => r.weight), smooth: true, color: '#1A73E8' },
          { name: 'BMI', type: 'line', yAxisIndex: 1, data: records.map(r => r.bmi), smooth: true, color: '#FF6B6B' },
        ],
      });
      return chart;
    });
  },

  initBodyFatChart(records: BodyRecord[]) {
    const component = this.selectComponent('#bodyFatChart');
    if (!component) return;
    component.init((canvas: any, width: number, height: number, dpr: number) => {
      const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
      canvas.setChart(chart);
      const validRecords = records.filter(r => r.bodyFatPct != null);
      chart.setOption({
        tooltip: { trigger: 'axis' },
        grid: { top: 20, right: 20, bottom: 30, left: 55 },
        xAxis: { type: 'category', data: validRecords.map(r => r.recordDate.slice(0, 10)) },
        yAxis: { type: 'value', name: '体脂率(%)' },
        series: [{
          name: '体脂率', type: 'line', data: validRecords.map(r => r.bodyFatPct),
          smooth: true, color: '#34A853', areaStyle: { color: 'rgba(52,168,83,0.15)' },
        }],
      });
      return chart;
    });
  },

  goToBody() {
    wx.navigateTo({ url: '/pages/data/body/body' });
  },

  goToReport(e: WechatMiniprogram.TouchEvent) {
    const { type } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/data/report/report?type=${type}` });
  },

  goToHistory() {
    wx.navigateTo({ url: '/pages/train/history/history' });
  },
});
