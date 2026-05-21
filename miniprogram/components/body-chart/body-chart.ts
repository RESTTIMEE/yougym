import * as echarts from 'echarts';

const METRIC_CONFIG: Record<string, { name: string; color: string; yMin?: number; yMax?: number; unit: string }> = {
  weight: { name: '体重', color: '#1A56DB', unit: 'kg' },
  bodyFatPct: { name: '体脂率', color: '#34A853', yMin: 0, yMax: 50, unit: '%' },
  muscleMassKg: { name: '肌肉量', color: '#FF6B4A', unit: 'kg' },
  chest: { name: '胸围', color: '#7C3AED', unit: 'cm' },
  waist: { name: '腰围', color: '#F59E0B', unit: 'cm' },
  hip: { name: '臀围', color: '#EC4899', unit: 'cm' },
};

Component({
  properties: {
    records: { type: Array, value: [] },
    metric: { type: String, value: 'weight' },
    title: { type: String, value: '' },
  },
  data: {
    ec: { lazyLoad: true } as any,
    ecReady: false,
  },
  observers: {
    'records, metric'(records: any[], metric: string) {
      if (records && records.length > 0) {
        this.initChart(records, metric);
      }
    },
  },
  methods: {
    initChart(records: any[], metric: string) {
      const component = this.selectComponent('#bodyEcCanvas');
      if (!component) {
        return;
      }

      const config = METRIC_CONFIG[metric] || METRIC_CONFIG.weight;
      const validRecords = records.filter(r => r[metric] != null);
      if (validRecords.length === 0) return;

      component.init((canvas: any, width: number, height: number, dpr: number) => {
        const chart = echarts.init(canvas, null, { width, height, devicePixelRatio: dpr });
        canvas.setChart(chart);

        chart.setOption({
          tooltip: {
            trigger: 'axis',
            formatter: (params: any) => {
              const p = params[0];
              return `${p.axisValue}\n${config.name}: ${p.value}${config.unit}`;
            },
          },
          grid: { top: 30, right: 20, bottom: 25, left: 55 },
          xAxis: {
            type: 'category',
            data: validRecords.map((r: any) => r.recordDate.slice(0, 10)),
            axisLabel: { fontSize: 10, rotate: 30 },
          },
          yAxis: {
            type: 'value',
            name: `${config.name}(${config.unit})`,
            min: config.yMin,
            max: config.yMax,
            nameTextStyle: { fontSize: 10 },
          },
          series: [{
            name: config.name,
            type: 'line',
            data: validRecords.map((r: any) => r[metric]),
            smooth: true,
            color: config.color,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: config.color + '40' },
                { offset: 1, color: config.color + '05' },
              ]),
            },
            lineStyle: { width: 2 },
            symbol: 'circle',
            symbolSize: 4,
          }],
        });

        this.setData({ ecReady: true });
        return chart;
      }, echarts);
    },
  },
});
