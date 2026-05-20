/** @deprecated 进度环形图组件 — 未完成实现，暂不用于生产。保留以备后续 Canvas 2D API 重构。 */
Component({
  properties: {
    percent: { type: Number, value: 0 },  // 0-100
    size: { type: Number, value: 200 },    // rpx
    color: { type: String, value: '#1A56DB' },
  },
  data: {
    canvasId: Math.random().toString(36).substring(2, 8),
  },
  lifetimes: {
    attached() {
      this.drawRing();
    },
  },
  observers: {
    percent() {
      this.drawRing();
    },
  },
  methods: {
    /** Canvas绘制环形进度 */
    drawRing() {
      // TODO: 使用 Canvas 2D API 绘制环形图
      // const ctx = wx.createCanvasContext(this.data.canvasId, this);
      // ctx.setLineWidth(12);
      // ctx.setStrokeStyle('#E5E5EA');  // 底环
      // ctx.arc(100, 100, 80, 0, 2 * Math.PI);
      // ctx.stroke();
      // ctx.setStrokeStyle(this.properties.color);  // 进度环
      // ctx.arc(100, 100, 80, -0.5 * Math.PI, (this.properties.percent / 100) * 2 * Math.PI - 0.5 * Math.PI);
      // ctx.stroke();
      // ctx.draw();
    },
  },
});
