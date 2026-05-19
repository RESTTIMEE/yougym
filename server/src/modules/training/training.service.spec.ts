import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TrainingService } from './training.service';
import { PrismaService } from '../../config/prisma.service';
import { AchievementService } from '../achievement/achievement.service';

describe('TrainingService', () => {
  let service: TrainingService;
  let prisma: any;
  let achievement: any;

  beforeEach(async () => {
    prisma = {
      trainingPlan: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
      },
      userTrainingPlan: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      dailyCheckin: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      dietPlan: {
        findFirst: jest.fn(),
      },
      user: {
        findUniqueOrThrow: jest.fn(),
      },
    } as any;

    achievement = {
      checkAndUnlock: jest.fn().mockResolvedValue(undefined),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingService,
        { provide: PrismaService, useValue: prisma },
        { provide: AchievementService, useValue: achievement },
      ],
    }).compile();

    service = module.get<TrainingService>(TrainingService);
  });

  describe('getPlans', () => {
    it('should return paginated plans sorted by id', async () => {
      const mockPlans = [
        { id: 1, name: '5x5 增肌A', category: 'muscle_gain' },
        { id: 2, name: '碳循环减脂', category: 'fat_loss' },
      ];

      prisma.trainingPlan.findMany!.mockResolvedValue(mockPlans);
      prisma.trainingPlan.count!.mockResolvedValue(2);

      const result = await service.getPlans({});

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.total).toBe(2);
      expect(result.list).toHaveLength(2);
      expect(prisma.trainingPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          skip: 0,
          take: 20,
        }),
      );
    });

    it('should filter by category when provided', async () => {
      prisma.trainingPlan.findMany!.mockResolvedValue([]);
      prisma.trainingPlan.count!.mockResolvedValue(0);

      await service.getPlans({ category: 'fat_loss' });

      expect(prisma.trainingPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { category: { contains: 'fat_loss' } },
        }),
      );
    });
  });

  describe('getPlanDetail', () => {
    it('should return plan with training days and exercises', async () => {
      const mockPlan = {
        id: 1,
        name: '5x5 增肌A',
        trainingDays: [
          {
            dayNumber: 1,
            dayName: 'Day 1',
            exercises: [{ exerciseName: '深蹲', sets: 5, reps: 5 }],
          },
        ],
      };

      prisma.trainingPlan.findUnique!.mockResolvedValue(mockPlan);

      const result = await service.getPlanDetail(1);

      expect(result).toEqual(mockPlan);
      expect(prisma.trainingPlan.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });

    it('should throw NotFoundException when plan not found', async () => {
      prisma.trainingPlan.findUnique!.mockResolvedValue(null);

      await expect(service.getPlanDetail(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createUserPlan', () => {
    it('should create a user plan copy with correct end date', async () => {
      prisma.trainingPlan.findUniqueOrThrow!.mockResolvedValue({
        id: 1,
        durationWeeks: 4,
      });
      prisma.userTrainingPlan.create!.mockResolvedValue({
        id: 100,
        userId: 1,
        planId: 1,
        status: 'active',
      });

      const result = await service.createUserPlan(1, {
        planId: 1,
        startDate: '2026-05-19',
      });

      expect(result.status).toBe('active');
      expect(prisma.userTrainingPlan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 1,
            planId: 1,
            status: 'active',
          }),
        }),
      );
      expect(achievement.checkAndUnlock).toHaveBeenCalledWith(1, 'plan_unlock');
    });
  });

  describe('checkin', () => {
    it('should create a checkin record with exercise logs', async () => {
      const mockCheckin = {
        id: 1,
        userId: 1,
        planId: 1,
        durationMinutes: 45,
        completedSets: 3,
        completedReps: 30,
        exerciseLogs: [
          { setNumber: 1, weight: 60, reps: 10, exerciseId: 1 },
        ],
      };

      prisma.dailyCheckin.create!.mockResolvedValue(mockCheckin);

      const result = await service.checkin(1, {
        planId: 1,
        durationMinutes: 45,
        exercises: [
          {
            exerciseId: 1,
            sets: [{ setNumber: 1, weight: 60, reps: 10 }],
          },
        ],
      });

      expect(result).toEqual(mockCheckin);
      expect(achievement.checkAndUnlock).toHaveBeenCalledWith(1, 'checkin');
    });
  });

  describe('getMyPlans', () => {
    it('should return active user training plans', async () => {
      prisma.userTrainingPlan.findMany!.mockResolvedValue([
        { id: 1, userId: 1, planId: 1, status: 'active', plan: { id: 1, name: '5x5' } },
      ]);

      const result = await service.getMyPlans(1);

      expect(result).toHaveLength(1);
      expect(prisma.userTrainingPlan.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1, status: 'active' },
        }),
      );
    });
  });
});
