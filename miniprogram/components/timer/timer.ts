/** 训练计时器组件（倒计时/正计时） */
Component({
  properties: {
    mode: { type: String, value: 'countdown' },  // countdown | countup
    duration: { type: Number, value: 60 },       // 秒, countdown模式初始值
    isRunning: { type: Boolean, value: false },
  },
  data: {
    currentTime: 0,
    timer: null as any,
  },
  lifetimes: {
    attached() {
      this.setData({ currentTime: this.properties.duration });
    },
    detached() {
      this.stop();
    },
  },
  observers: {
    isRunning(val: boolean) {
      if (val) this.start();
      else this.stop();
    },
  },
  methods: {
    start() {
      this.stop();
      this.data.timer = setInterval(() => {
        if (this.properties.mode === 'countdown') {
          const t = this.data.currentTime - 1;
          if (t <= 0) {
            this.stop();
            this.triggerEvent('complete');
          }
          this.setData({ currentTime: Math.max(0, t) });
        } else {
          this.setData({ currentTime: this.data.currentTime + 1 });
        }
      }, 1000);
    },

    stop() {
      if (this.data.timer) {
        clearInterval(this.data.timer);
        this.data.timer = null;
      }
    },

    reset() {
      this.setData({ currentTime: this.properties.duration });
    },
  },
});
