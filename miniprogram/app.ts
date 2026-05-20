import { userStore } from './store/user';
import { BASE_URL } from './utils/constants';

App({
  globalData: {
    userInfo: null as WechatMiniprogram.UserInfo | null,
    token: '' as string,
    baseUrl: BASE_URL,
  },

  onLaunch() {
    userStore.init();
    console.log('优健小程序启动', userStore.state.isLogin ? '已登录' : '未登录');
  },
});
