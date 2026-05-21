import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

@Injectable()
export class AchievementService {
  constructor(private readonly prisma: PrismaService) {}

  async getList() {
    return this.prisma.achievement.findMany();
  }

  async getMyAchievements(userId: number) {
    const achievements = await this.prisma.achievement.findMany();
    const unlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u.unlockedAt]));

    return achievements.map(a => ({
      ...a,
      unlockedAt: unlockedMap.get(a.id) || null,
      unlocked: unlockedMap.has(a.id),
    }));
  }

  async getMyPoints(userId: number) {
    const result = await this.prisma.userPoint.aggregate({
      _sum: { points: true },
      where: { userId },
    });
    return { points: result._sum.points || 0 };
  }

  async checkAndUnlock(userId: number, event: string) {
    const eventConditions: Record<string, string[]> = {
      checkin: ['first_checkin', 'total_checkins', 'streak_days', 'total_duration'],
      plan_unlock: ['plans_unlocked'],
      body_record: ['body_records'],
      diet_record: ['first_diet', 'diet_records'],
      ai_advice: ['first_ai_advice'],
      posture: ['first_posture'],
    };

    const conditionTypes = eventConditions[event];
    if (!conditionTypes) return;

    const allAchievements = await this.prisma.achievement.findMany({
      where: { conditionType: { in: conditionTypes } },
    });

    const alreadyUnlocked = await this.prisma.userAchievement.findMany({
      where: { userId },
    });
    const unlockedIds = new Set(alreadyUnlocked.map(u => u.achievementId));

    for (const ach of allAchievements) {
      if (unlockedIds.has(ach.id)) continue;

      const current = await this.getCurrentValue(userId, ach.conditionType);
      if (current >= ach.conditionValue) {
        try {
          await this.prisma.userAchievement.create({
            data: { userId, achievementId: ach.id },
          });
          await this.prisma.userPoint.create({
            data: {
              userId,
              points: ach.conditionValue * 10,
              reason: `解锁成就: ${ach.name}`,
            },
          });
        } catch {
          // 重复忽略
        }
      }
    }
  }

  private async getCurrentValue(userId: number, conditionType: string): Promise<number> {
    switch (conditionType) {
      case 'first_checkin':
      case 'total_checkins': {
        const count = await this.prisma.dailyCheckin.count({ where: { userId } });
        return count;
      }
      case 'streak_days': {
        const checkins = await this.prisma.dailyCheckin.findMany({
          where: { userId },
          orderBy: { checkinDate: 'desc' },
          select: { checkinDate: true },
          distinct: ['checkinDate'],
        });
        if (checkins.length === 0) return 0;
        let streak = 1;
        let max = 1;
        for (let i = 1; i < checkins.length; i++) {
          const prev = new Date(checkins[i - 1].checkinDate);
          const curr = new Date(checkins[i].checkinDate);
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
          if (diff === 1) {
            streak++;
            max = Math.max(max, streak);
          } else {
            streak = 1;
          }
        }
        return max;
      }
      case 'total_duration': {
        const result = await this.prisma.dailyCheckin.aggregate({
          _sum: { durationMinutes: true },
          where: { userId },
        });
        return result._sum.durationMinutes || 0;
      }
      case 'plans_unlocked': {
        return this.prisma.userTrainingPlan.count({ where: { userId } });
      }
      case 'body_records': {
        return this.prisma.bodyRecord.count({ where: { userId } });
      }
      case 'first_diet':
      case 'diet_records': {
        return this.prisma.dietRecord.count({ where: { userId } });
      }
      case 'first_ai_advice': {
        const count = await this.prisma.userPoint.count({
          where: { userId, reason: { contains: '解锁' } },
        });
        return count > 0 ? 1 : 0;
      }
      case 'first_posture': {
        const count = await this.prisma.postureAssessment.count({ where: { userId } });
        return count;
      }
      default:
        return 0;
    }
  }
}
