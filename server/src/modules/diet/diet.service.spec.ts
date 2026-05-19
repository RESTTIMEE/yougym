import { Test, TestingModule } from '@nestjs/testing';
import { DietService } from './diet.service';
import { PrismaService } from '../../config/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

describe('DietService', () => {
  let service: DietService;
  let prisma: any;
  let achievement: any;

  beforeEach(async () => {
    prisma = {
      foodDatabase: {
        findMany: jest.fn(),
      },
      dietRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      dietPlan: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    } as any;

    achievement = {
      checkAndUnlock: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DietService,
        { provide: PrismaService, useValue: prisma },
        { provide: AchievementService, useValue: achievement },
      ],
    }).compile();

    service = module.get<DietService>(DietService);
  });

  describe('searchFoods', () => {
    it('should search foods by keyword with max 20 results', async () => {
      const mockFoods = [
        { id: 1, foodName: '鸡胸肉', caloriesPer100g: 133 },
        { id: 2, foodName: '鸡腿肉', caloriesPer100g: 181 },
      ];

      prisma.foodDatabase.findMany!.mockResolvedValue(mockFoods);

      const result = await service.searchFoods('鸡');

      expect(result).toEqual(mockFoods);
      expect(result).toHaveLength(2);
      expect(prisma.foodDatabase.findMany).toHaveBeenCalledWith({
        where: { foodName: { contains: '鸡' } },
        take: 20,
      });
    });
  });

  describe('addRecords', () => {
    it('should add diet records and trigger achievement', async () => {
      const mockRecords = [
        { id: 1, userId: 1, foodId: 5, servingAmount: 150, mealType: 'lunch' },
        { id: 2, userId: 1, foodId: 8, servingAmount: 100, mealType: 'lunch' },
      ];

      prisma.dietRecord.create!.mockResolvedValueOnce(mockRecords[0]);
      prisma.dietRecord.create!.mockResolvedValueOnce(mockRecords[1]);

      const result = await service.addRecords(1, {
        mealType: 'lunch',
        recordDate: '2026-05-19',
        items: [
          { foodId: 5, servingAmount: 150 },
          { foodId: 8, servingAmount: 100 },
        ],
      });

      expect(result.count).toBe(2);
      expect(result.records).toHaveLength(2);
      expect(achievement.checkAndUnlock).toHaveBeenCalledWith(1, 'diet_record');
    });
  });

  describe('getRecords', () => {
    it('should return paginated records with total calories', async () => {
      prisma.dietRecord.findMany!.mockResolvedValue([
        {
          foodId: 1,
          servingAmount: 200,
          food: { caloriesPer100g: 133, foodName: '鸡胸肉' },
        },
        {
          foodId: 2,
          servingAmount: 100,
          food: { caloriesPer100g: 50, foodName: '西兰花' },
        },
      ]);
      prisma.dietRecord.count!.mockResolvedValue(2);

      const result = await service.getRecords(1, {});

      expect(result.page).toBe(1);
      expect(result.total).toBe(2);
      expect(result.totalCalories).toBe(316); // 133*200/100 + 50*100/100
    });

    it('should filter by mealType when provided', async () => {
      prisma.dietRecord.findMany!.mockResolvedValue([]);
      prisma.dietRecord.count!.mockResolvedValue(0);

      await service.getRecords(1, { mealType: 'breakfast' });

      expect(prisma.dietRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, mealType: 'breakfast' },
        }),
      );
    });
  });

  describe('getFrequentFoods', () => {
    it('should return top frequent foods sorted by count', async () => {
      prisma.dietRecord.findMany!.mockResolvedValue([
        { foodId: 1, food: { id: 1, foodName: '鸡胸肉', caloriesPer100g: 133 } },
        { foodId: 1, food: { id: 1, foodName: '鸡胸肉', caloriesPer100g: 133 } },
        { foodId: 2, food: { id: 2, foodName: '米饭', caloriesPer100g: 116 } },
      ]);

      const result = await service.getFrequentFoods(1);

      expect(result).toHaveLength(2);
      expect(result[0].foodName).toBe('鸡胸肉');
      expect(result[0].count).toBe(2);
      expect(result[1].foodName).toBe('米饭');
      expect(result[1].count).toBe(1);
    });
  });

  describe('getPlan', () => {
    it('should return user plan when exists', async () => {
      const mockPlan = { id: 1, userId: 1, dailyCalories: 2500, goal: 'muscle_gain' };
      prisma.dietPlan.findFirst!.mockResolvedValue(mockPlan);

      const result = await service.getPlan(1);

      expect(result).toEqual(mockPlan);
    });

    it('should return system default when no user plan exists', async () => {
      prisma.dietPlan.findFirst!
        .mockResolvedValueOnce(null) // user plan not found
        .mockResolvedValueOnce(null); // system plan not found

      const result = await service.getPlan(1);

      expect(result).toEqual({
        dailyCalories: 2000,
        proteinTargetG: 150,
        fatTargetG: 60,
        carbsTargetG: 220,
      });
    });
  });

  describe('savePlan', () => {
    it('should create a new diet plan', async () => {
      const mockPlan = { id: 1, userId: 1, goal: 'fat_loss', dailyCalories: 1800 };
      prisma.dietPlan.create!.mockResolvedValue(mockPlan);

      const result = await service.savePlan(1, {
        goal: 'fat_loss',
        dailyCalories: 1800,
        proteinTargetG: 140,
        fatTargetG: 50,
        carbsTargetG: 180,
        startDate: '2026-05-19',
        endDate: '2026-06-19',
      });

      expect(result).toEqual(mockPlan);
      expect(prisma.dietPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            goal: 'fat_loss',
          }),
        }),
      );
    });
  });
});
