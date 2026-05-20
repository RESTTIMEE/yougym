import { trainingApi } from '../../../services/training';

const FEELING_EMOJI = ['', '😞', '😐', '😊', '😄', '🔥'];

interface CheckinWithLogs extends CheckinRecord {
  _expanded: boolean;
  _emoji: string;
}

interface MonthGroup {
  month: string;
  checkins: CheckinWithLogs[];
}

Page({
  data: {
    groups: [] as MonthGroup[],
    page: 1,
    pageSize: 15,
    total: 0,
    loading: false,
    noMore: false,
  },

  onShow() {
    if (this.data.groups.length === 0) {
      this.loadMore();
    }
  },

  async loadMore() {
    if (this.data.loading || this.data.noMore) return;
    this.setData({ loading: true });
    try {
      const res = await trainingApi.getCheckins({ page: this.data.page, pageSize: this.data.pageSize });
      const newList: CheckinWithLogs[] = (res.data.list || []).map((c: CheckinRecord) => ({
        ...c,
        _expanded: false,
        _emoji: FEELING_EMOJI[c.feelingRating] || '😊',
      }));
      const allCheckins = [...this.data.groups.flatMap(g => g.checkins), ...newList];
      this.setData({
        groups: this.groupByMonth(allCheckins),
        page: this.data.page + 1,
        total: res.data.total,
        noMore: this.data.page * this.data.pageSize >= res.data.total,
      });
    } catch (_) {
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
    finally { this.setData({ loading: false }); }
  },

  groupByMonth(checkins: CheckinWithLogs[]): MonthGroup[] {
    const map = new Map<string, CheckinWithLogs[]>();
    for (const c of checkins) {
      const month = c.checkinDate.slice(0, 7);
      if (!map.has(month)) map.set(month, []);
      map.get(month)!.push(c);
    }
    return Array.from(map.entries()).map(([month, items]) => ({ month, checkins: items }));
  },

  onToggleExpand(e: WechatMiniprogram.TouchEvent) {
    const { id } = e.currentTarget.dataset;
    const groups = this.data.groups.map(g => ({
      ...g,
      checkins: g.checkins.map(c => c.id === id ? { ...c, _expanded: !c._expanded } : c),
    }));
    this.setData({ groups });
  },

  onReachBottom() {
    this.loadMore();
  },
});
