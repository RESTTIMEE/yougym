import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class TrainingService {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly prisma: PrismaService,
  ) {}
  async getPlans(query: { category?: string; difficulty?: number; page?: number; pageSize?: number }) {
    const { category, difficulty, page = 1, pageSize = 20 } = query;
    const where: any = {};
    if (category) {
      where.category = { contains: category };
    }
    if (difficulty !== undefined) {
      where.difficulty = difficulty;
    }
    const [list, total] = await Promise.all([
      this.prisma.trainingPlan.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          trainingDays: {
            orderBy: { dayNumber: 'asc' },
            include: { exercises: { orderBy: { sortOrder: 'asc' } } },
          },
        },
        orderBy: { id: 'asc' },
      }),
      this.prisma.trainingPlan.count({ where }),
    ]);

    const result: any = { page, pageSize, total, list };

    // 减脂分类额外返回饮食计划推荐
    if (category === 'fat_loss') {
      const dietPlan = await this.prisma.dietPlan.findFirst({
        where: { user: { openid: 'system' }, goal: 'fat_loss' },
      });
      if (dietPlan) {
        result.dietRecommendation = {
          name: '碳循环减脂法',
          description: '通过高低碳水日交替，提高代谢灵活性，加速脂肪燃烧',
          dailyCalories: dietPlan.dailyCalories,
          proteinG: dietPlan.proteinTargetG,
          fatG: dietPlan.fatTargetG,
          carbsG: dietPlan.carbsTargetG,
        };
      }
    }

    return result;
  }

  async getPlanDetail(planId: number) {
    const plan = await this.prisma.trainingPlan.findUnique({
      where: { id: planId },
      include: {
        trainingDays: {
          orderBy: { dayNumber: 'asc' },
          include: { exercises: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    if (!plan) throw new NotFoundException('计划不存在');
    return plan;
  }

  async createPlan(userId: number, data: { name: string; description?: string; category: string; difficulty: number; durationWeeks: number; coverImage?: string; cycleDays: number; trainingDays: any[] }) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const plan = await this.prisma.trainingPlan.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        difficulty: data.difficulty,
        durationWeeks: data.durationWeeks,
        coverImage: data.coverImage || '',
        cycleDays: data.cycleDays,
        creator: user.nickname || '用户',
        trainingDays: {
          create: data.trainingDays.map((day) => ({
            dayNumber: day.dayNumber,
            dayName: day.dayName || `Day ${day.dayNumber}`,
            exercises: {
              create: day.exercises.map((e: any, i: number) => ({
                exerciseName: e.exerciseName,
                sets: e.sets,
                reps: e.reps,
                restSeconds: e.restSeconds || 60,
                imageUrl: e.imageUrl || '',
                videoUrl: e.videoUrl || '',
                description: e.description || '',
                sortOrder: e.sortOrder ?? i,
              })),
            },
          })),
        },
      },
      include: {
        trainingDays: {
          orderBy: { dayNumber: 'asc' },
          include: { exercises: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });
    return plan;
  }

  async createUserPlan(userId: number, data: { planId: number; startDate: string; endDate?: string; goalDescription?: string }) {
    const plan = await this.prisma.trainingPlan.findUniqueOrThrow({ where: { id: data.planId } });
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : (() => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + plan.durationWeeks * 7);
      return d;
    })();

    const userPlan = await this.prisma.userTrainingPlan.create({
      data: {
        userId,
        planId: data.planId,
        startDate,
        endDate,
        goalDescription: data.goalDescription,
        status: 'active',
      },
    });
    this.achievementService.checkAndUnlock(userId, 'plan_unlock').catch(() => { /* 成就解锁失败不影响打卡结果 */ });
    return userPlan;
  }

  async getMyPlans(userId: number) {
    return this.prisma.userTrainingPlan.findMany({
      where: { userId, status: 'active' },
      include: {
        plan: {
          include: {
            trainingDays: {
              orderBy: { dayNumber: 'asc' },
              include: { exercises: { orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkin(
    userId: number,
    data: {
      planId: number;
      trainingDayId?: number;
      durationMinutes: number;
      feelingRating?: number;
      notes?: string;
      exercises?: { exerciseId: number; sets: { setNumber: number; weight?: number; reps: number }[] }[];
    },
  ) {
    let totalSets = 0;
    let totalReps = 0;

    if (data.exercises?.length) {
      for (const ex of data.exercises) {
        for (const s of ex.sets) {
          totalSets++;
          totalReps += s.reps;
        }
      }
    }

    const record = await this.prisma.dailyCheckin.create({
      data: {
        userId,
        planId: data.planId,
        trainingDayId: data.trainingDayId,
        durationMinutes: data.durationMinutes,
        feelingRating: data.feelingRating ?? 3,
        notes: data.notes,
        completedSets: totalSets,
        completedReps: totalReps,
        checkinDate: new Date(),
        exerciseLogs: data.exercises?.length
          ? {
              create: data.exercises.flatMap((ex) =>
                ex.sets.map((s) => ({
                  exerciseId: ex.exerciseId,
                  setNumber: s.setNumber,
                  weight: s.weight,
                  reps: s.reps,
                  completed: true,
                })),
              ),
            }
          : undefined,
      },
      include: { exerciseLogs: true },
    });

    this.achievementService.checkAndUnlock(userId, 'checkin').catch(() => { /* 成就解锁失败不影响打卡结果 */ });
    return record;
  }

  async getCheckins(userId: number, page = 1, pageSize = 20) {
    const [list, total] = await Promise.all([
      this.prisma.dailyCheckin.findMany({
        where: { userId },
        orderBy: { checkinDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { exerciseLogs: { orderBy: { setNumber: 'asc' } } },
      }),
      this.prisma.dailyCheckin.count({ where: { userId } }),
    ]);

    // Resolve plan names + exercise names for checkins
    const planIds = [...new Set(list.map(c => c.planId).filter(Boolean))] as number[];
    const plans = planIds.length
      ? await this.prisma.trainingPlan.findMany({
          where: { id: { in: planIds } },
          select: { id: true, name: true, trainingDays: { select: { id: true, dayName: true, exercises: { select: { id: true, exerciseName: true } } } } },
        })
      : [];
    const planMap = new Map(plans.map(p => [p.id, p.name]));
    const dayNameMap = new Map<number, string>();
    const exNameMap = new Map<number, string>();
    for (const p of plans) {
      for (const day of p.trainingDays) {
        dayNameMap.set(day.id, day.dayName);
        for (const ex of day.exercises) exNameMap.set(ex.id, ex.exerciseName);
      }
    }

    const enriched = list.map(c => ({
      ...c,
      planName: c.planId ? planMap.get(c.planId) || null : null,
      trainingDayName: c.trainingDayId ? dayNameMap.get(c.trainingDayId) || null : null,
      exerciseLogs: c.exerciseLogs.map(log => ({
        ...log,
        exerciseName: exNameMap.get(log.exerciseId) || null,
      })),
    }));

    return { page, pageSize, total, list: enriched };
  }

  async getYearCheckins(userId: number, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year + 1, 0, 1);
    const records = await this.prisma.dailyCheckin.findMany({
      where: { userId, checkinDate: { gte: startDate, lt: endDate } },
      select: { checkinDate: true, durationMinutes: true, feelingRating: true },
      orderBy: { checkinDate: 'asc' },
    });
    return records.map(r => ({
      date: r.checkinDate.toISOString().slice(0, 10),
      durationMinutes: r.durationMinutes,
      feelingRating: r.feelingRating,
    }));
  }

  async getCycleReport(userId: number, userPlanId: number) {
    const userPlan = await this.prisma.userTrainingPlan.findFirst({
      where: { id: userPlanId, userId },
      include: { plan: true },
    });
    if (!userPlan) throw new NotFoundException('训练计划不存在');

    const cycleDays = userPlan.plan.cycleDays;
    const since = new Date();
    since.setDate(since.getDate() - cycleDays);

    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId, planId: userPlan.planId, checkinDate: { gte: since } },
    });

    const totalDays = checkins.length;
    const totalDuration = checkins.reduce((s, c) => s + c.durationMinutes, 0);
    const avgFeeling = totalDays > 0
      ? Math.round((checkins.reduce((s, c) => s + c.feelingRating, 0) / totalDays) * 10) / 10
      : 0;

    return {
      planName: userPlan.plan.name,
      cycleDays,
      totalDays,
      totalDurationMinutes: totalDuration,
      avgFeelingRating: avgFeeling,
      checkins,
    };
  }
}
