import { userStore } from './store/user';
import { BASE_URL } from './utils/constants';
import * as echarts from 'echarts';

// ec-canvas 组件无法通过 WXML 数据绑定接收 echarts（函数序列化丢失），挂全局避开
(globalThis as any).echarts = echarts;

App({
  globalData: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    token: '' as string,
    baseUrl: BASE_URL,
  },

  onLaunch() {
    userStore.init();
    console.log('优健小程序启动', userStore.state.isLogin ? '已登录' : '未登录');
    console.log('[YouGym] BASE_URL:', BASE_URL);

    try {
      const envVersion = wx.getAccountInfoSync().miniProgram.envVersion;
      const platform = wx.getSystemInfoSync().platform;
      console.log('[YouGym] env:', envVersion, 'platform:', platform);
    } catch {}
  },
});
