import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class UserService {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly prisma: PrismaService,
  ) {}
  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('用户不存在');
    return user;
  }

  async updateProfile(userId: number, data: any) {
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  async addBodyRecord(userId: number, data: any) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const bmi = this.calcBMI(data.weight, user.height ?? undefined);
    const record = await this.prisma.bodyRecord.create({
      data: {
        userId,
        weight: data.weight,
        bodyFatPct: data.bodyFatPct,
        muscleMassKg: data.muscleMassKg,
        flexibilityScore: data.flexibilityScore,
        chest: data.chest,
        waist: data.waist,
        hip: data.hip,
        bmi,
        recordDate: new Date(data.recordDate),
      },
    });
    this.achievementService.checkAndUnlock(userId, 'body_record').catch(() => { /* 成就解锁失败不影响主流程 */ });
    return record;
  }

  async getBodyRecords(userId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.bodyRecord.findMany({
        where: { userId },
        orderBy: { recordDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bodyRecord.count({ where: { userId } }),
    ]);
    return { page, pageSize, total, list };
  }

  async getDashboard(userId: number) {
    const [allCheckins, latestRecord] = await Promise.all([
      this.prisma.dailyCheckin.findMany({
        where: { userId },
        select: { checkinDate: true, durationMinutes: true },
        orderBy: { checkinDate: 'desc' },
        take: 365,
      }),
      this.prisma.bodyRecord.findFirst({
        where: { userId },
        orderBy: { recordDate: 'desc' },
      }),
    ]);

    const totalDays = allCheckins.filter(c => c.durationMinutes > 0).length;
    const streak = this.calcStreak(allCheckins.map(c => c.checkinDate));
    const avgDuration = allCheckins.length > 0
      ? Math.round(allCheckins.reduce((s, c) => s + c.durationMinutes, 0) / allCheckins.length)
      : 0;

    return { totalDays, streakDays: streak, avgDurationMinutes: avgDuration, latestBodyRecord: latestRecord };
  }

  async getMonthlyReport(userId: number, data: {
    startWeight: number; endWeight: number;
    startChest?: number; endChest?: number;
    startWaist?: number; endWaist?: number;
    startHip?: number; endHip?: number;
  }) {
    const weightDiff = Math.round((data.endWeight - data.startWeight) * 10) / 10;
    const changes: any = { weight: weightDiff };

    if (data.startChest !== undefined && data.endChest !== undefined)
      changes.chest = Math.round((data.endChest - data.startChest) * 10) / 10;
    if (data.startWaist !== undefined && data.endWaist !== undefined)
      changes.waist = Math.round((data.endWaist - data.startWaist) * 10) / 10;
    if (data.startHip !== undefined && data.endHip !== undefined)
      changes.hip = Math.round((data.endHip - data.startHip) * 10) / 10;

    let feedback: string;
    if (weightDiff < -1) {
      feedback = '减脂趋势明显，体脂率可能下降，继续保持！';
    } else if (weightDiff > 0.5) {
      feedback = '体重上升，若肌肉量同步增长则增肌效果良好，关注体脂率变化。';
    } else {
      feedback = '体重稳定，当前训练方案有助于维持体型，可适当增加训练强度。';
    }

    return { start: data.startWeight, end: data.endWeight, changes, feedback };
  }

  private calcBMI(weight: number, height?: number) {
    if (!height) return null;
    const h = height / 100;
    return Math.round((weight / (h * h)) * 10) / 10;
  }

  private calcStreak(dates: Date[]): number {
    if (dates.length === 0) return 0;
    const set = new Set(dates.map(d => d.toISOString().slice(0, 10)));
    let streak = 0;
    const today = new Date();
    while (set.has(today.toISOString().slice(0, 10))) {
      streak++;
      today.setDate(today.getDate() - 1);
    }
    return streak;
  }
}
