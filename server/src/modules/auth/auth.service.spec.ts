import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../config/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((fn: any) => fn(prisma)),
    } as any;

    jwt = {
      sign: jest.fn().mockReturnValue('mock-access-token'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('wxLogin', () => {
    it('should return accessToken, refreshToken, and user on first login', async () => {
      const mockUser = {
        id: 1,
        nickname: 'TestUser',
        avatarUrl: null,
        gender: 0,
        height: null,
        weight: null,
        fitnessGoal: 'muscle_gain',
      };

      prisma.user.findUnique!.mockResolvedValue(null);
      prisma.user.create!.mockResolvedValue({
        id: 1,
        openid: 'dev_openid_test12',
        nickname: 'TestUser',
        avatarUrl: null,
        gender: 0,
        height: null,
        weight: null,
        fitnessGoal: 'muscle_gain',
      } as any);
      prisma.refreshToken.create!.mockResolvedValue({
        id: 1,
        userId: 1,
        token: 'mock-refresh-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        expiresAt: new Date(),
        revoked: false,
        createdAt: new Date(),
      });

      const result = await service.wxLogin('test123');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(result.refreshToken).toHaveLength(48);
      expect(result.user).toEqual(mockUser);
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 1, jti: expect.any(String) }),
      );
      expect(prisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 1 }),
        }),
      );
    });

    it('should return existing user without creating new one', async () => {
      const existingUser = {
        id: 2,
        nickname: 'Returning',
        avatarUrl: null,
        gender: 0,
        height: null,
        weight: null,
        fitnessGoal: 'fat_loss',
      };

      prisma.user.findUnique!.mockResolvedValue({
        id: 2,
        openid: 'dev_openid_abc123',
        nickname: 'Returning',
        avatarUrl: null,
        gender: 0,
        height: null,
        weight: null,
        fitnessGoal: 'fat_loss',
      } as any);
      prisma.refreshToken.create!.mockResolvedValue({} as any);

      const result = await service.wxLogin('abc123');

      expect(result.user).toEqual(existingUser);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and return new access token', async () => {
      prisma.refreshToken.findUnique!.mockResolvedValue({
        id: 1,
        userId: 1,
        token: 'old-refresh',
        expiresAt: new Date(Date.now() + 86400000),
        revoked: false,
        createdAt: new Date(),
      });
      prisma.refreshToken.updateMany!.mockResolvedValue({ count: 1 });
      prisma.refreshToken.create!.mockResolvedValue({
        id: 2,
        userId: 1,
        token: 'new-refresh-token-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        expiresAt: new Date(),
        revoked: false,
        createdAt: new Date(),
      });

      const result = await service.refresh('old-refresh');

      expect(result.accessToken).toBe('mock-access-token');
      expect(result.refreshToken).toBeDefined();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, revoked: false },
          data: { revoked: true },
        }),
      );
    });

    it('should throw UnauthorizedException for revoked token', async () => {
      prisma.refreshToken.findUnique!.mockResolvedValue({
        id: 1,
        userId: 1,
        token: 'revoked-token',
        expiresAt: new Date(Date.now() + 86400000),
        revoked: true,
        createdAt: new Date(),
      });

      await expect(service.refresh('revoked-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired token', async () => {
      prisma.refreshToken.findUnique!.mockResolvedValue({
        id: 1,
        userId: 1,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000),
        revoked: false,
        createdAt: new Date(),
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should revoke all active refresh tokens for user', async () => {
      prisma.refreshToken.updateMany!.mockResolvedValue({ count: 3 });

      const result = await service.logout(1);

      expect(result).toEqual({ message: '已登出' });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, revoked: false },
        data: { revoked: true },
      });
    });
  });
});
