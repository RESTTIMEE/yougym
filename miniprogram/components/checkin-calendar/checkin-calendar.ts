Component({
  properties: {
    checkins: { type: Array, value: [] as Array<{ date: string; durationMinutes: number }> },
    year: { type: Number, value: new Date().getFullYear() },
  },

  data: {
    weeks: [] as Array<Array<{ date: string; durationMinutes: number; level: number }>>,
    monthLabels: [] as Array<{ month: number; col: number }>,
    showTooltip: false,
    tooltipDate: '',
    tooltipMinutes: 0,
    tooltipX: 0,
    tooltipY: 0,
  },

  observers: {
    'checkins, year'(checkins: Array<{ date: string; durationMinutes: number }>, year: number) {
      this.buildGrid(checkins || [], year);
    },
  },

  lifetimes: {
    attached() {
      this.buildGrid(this.properties.checkins || [], this.properties.year);
    },
  },

  methods: {
    buildGrid(checkins: Array<{ date: string; durationMinutes: number }>, year: number) {
      const map = new Map<string, number>();
      for (const c of checkins) {
        map.set(c.date, c.durationMinutes || 0);
      }

      const weeks: Array<Array<{ date: string; durationMinutes: number; level: number }>> = [];
      const monthLabels: Array<{ month: number; col: number }> = [];

      // Start from Jan 1 of the year
      const start = new Date(year, 0, 1);
      // Go back to Monday of that week
      const dayOfWeek = start.getDay() || 7;
      const cursor = new Date(start);
      cursor.setDate(cursor.getDate() - (dayOfWeek - 1));

      const end = new Date(year, 11, 31);
      let week: Array<{ date: string; durationMinutes: number; level: number }> = [];
      let colIndex = 0;
      let lastMonth = -1;

      while (cursor <= end || week.length > 0) {
        if (week.length === 7) {
          weeks.push(week);
          week = [];
          colIndex++;
          continue;
        }

        const dateStr = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        const mins = map.get(dateStr) || 0;
        let level = 0;
        if (mins > 0 && mins <= 15) level = 1;
        else if (mins > 15 && mins <= 45) level = 2;
        else if (mins > 45) level = 3;

        const month = cursor.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ month, col: colIndex });
          lastMonth = month;
        }

        week.push({ date: dateStr, durationMinutes: mins, level });
        cursor.setDate(cursor.getDate() + 1);
      }

      // Pad last week
      if (week.length > 0 && week.length < 7) {
        while (week.length < 7) {
          week.push({ date: '', durationMinutes: 0, level: -1 });
        }
        weeks.push(week);
      }

      this.setData({ weeks, monthLabels });
    },

    onPrevYear() {
      this.triggerEvent('yearchange', { year: this.data.year - 1 });
    },

    onNextYear() {
      this.triggerEvent('yearchange', { year: this.data.year + 1 });
    },

    onCellTap(e: any) {
      const { date, durationminutes } = e.currentTarget.dataset;
      if (!date) return;
      this.setData({
        showTooltip: true,
        tooltipDate: date,
        tooltipMinutes: durationminutes || 0,
      });
      this.triggerEvent('celltap', { date, durationMinutes: durationminutes || 0 });
      setTimeout(() => this.setData({ showTooltip: false }), 2000);
    },
  },
});
