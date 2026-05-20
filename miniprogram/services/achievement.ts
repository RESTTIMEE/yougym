import { get } from './api';

export const achievementApi = {
  async getList() {
    const res: any = await get('/achievement/list');
    return res.data;
  },

  async getMyAchievements() {
    const res: any = await get('/achievement/my');
    return res.data;
  },

  async getMyPoints() {
    const res: any = await get('/achievement/points');
    return res.data;
  },
};
