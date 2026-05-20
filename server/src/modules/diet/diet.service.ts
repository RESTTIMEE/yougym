import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

@Injectable()
export class DietService {
  constructor(
    private readonly achievementService: AchievementService,
    private readonly prisma: PrismaService,
  ) {}
  async searchFoods(keyword: string) {
    return this.prisma.foodDatabase.findMany({
      where: { foodName: { contains: keyword } },
      take: 20,
    });
  }

  async addRecords(userId: number, data: { mealType: string; recordDate: string; items: { foodId: number; servingAmount: number }[] }) {
    const records = await Promise.all(
      data.items.map(item =>
        this.prisma.dietRecord.create({
          data: {
            userId,
            foodId: item.foodId,
            servingAmount: item.servingAmount,
            mealType: data.mealType,
            recordDate: new Date(data.recordDate),
          },
        }),
      ),
    );
    this.achievementService.checkAndUnlock(userId, 'diet_record').catch(() => { /* 成就解锁失败不影响记录结果 */ });
    return { count: records.length, records };
  }

  async getRecords(userId: number, query: { page?: number; pageSize?: number; mealType?: string; recordDate?: string }) {
    const { page = 1, pageSize = 20, mealType, recordDate } = query;
    const where: any = { userId };
    if (mealType) where.mealType = mealType;
    if (recordDate) where.recordDate = new Date(recordDate);

    const [list, total] = await Promise.all([
      this.prisma.dietRecord.findMany({
        where,
        include: { food: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.dietRecord.count({ where }),
    ]);

    let totalCalories = 0;
    for (const record of list) {
      totalCalories += Math.round(record.food.caloriesPer100g * record.servingAmount / 100);
    }

    return { page, pageSize, total, totalCalories, list };
  }

  async getFrequentFoods(userId: number) {
    const records = await this.prisma.dietRecord.findMany({
      where: { userId },
      include: { food: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const foodCount: Record<number, { food: any; count: number }> = {};
    for (const r of records) {
      if (!foodCount[r.foodId]) {
        foodCount[r.foodId] = { food: r.food, count: 0 };
      }
      foodCount[r.foodId].count++;
    }

    return Object.values(foodCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(({ food, count }) => ({ ...food, count }));
  }

  async getPlan(userId: number) {
    const userPlan = await this.prisma.dietPlan.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    if (userPlan) return userPlan;

    const systemPlan = await this.prisma.dietPlan.findFirst({
      where: { user: { openid: 'system' } },
    });
    return systemPlan || { dailyCalories: 2000, proteinTargetG: 150, fatTargetG: 60, carbsTargetG: 220 };
  }

  async savePlan(userId: number, data: { goal: string; dailyCalories: number; proteinTargetG: number; fatTargetG: number; carbsTargetG: number; startDate: string; endDate: string }) {
    return this.prisma.dietPlan.create({
      data: {
        userId,
        goal: data.goal,
        dailyCalories: data.dailyCalories,
        proteinTargetG: data.proteinTargetG,
        fatTargetG: data.fatTargetG,
        carbsTargetG: data.carbsTargetG,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
      },
    });
  }
}
