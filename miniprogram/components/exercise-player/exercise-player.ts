/** 训练动作播放器组件（视频/图片轮播） */
Component({
  properties: {
    videoUrl: { type: String, value: '' },
    imageUrl: { type: String, value: '' },
    autoPlay: { type: Boolean, value: false },
  },
  data: {
    isVideo: false,
  },
  lifetimes: {
    attached() {
      this.setData({ isVideo: !!this.properties.videoUrl });
    },
  },
  methods: {
    onImageError() {
      // 图片加载失败时隐藏
    },
  },
});
