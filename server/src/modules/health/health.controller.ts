import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const result = {
      status: 'ok' as 'ok' | 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: 'connected' as 'connected' | 'disconnected',
        redis: 'connected' as 'connected' | 'disconnected',
      },
    };

    // Check DB
    try {
      await this.prisma.$executeRaw`SELECT 1`;
    } catch (err) {
      result.status = 'degraded';
      result.dependencies.database = 'disconnected';
      this.logger.error('Database health check failed', err instanceof Error ? err.message : String(err));
    }

    // Check Redis
    try {
      const pong = await this.redis.ping();
      if (pong !== 'PONG') {
        throw new Error('Redis ping returned non-PONG');
      }
    } catch (err) {
      result.status = 'degraded';
      result.dependencies.redis = 'disconnected';
      this.logger.error('Redis health check failed', err instanceof Error ? err.message : String(err));
    }

    const httpStatus = result.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
    return res.status(httpStatus).json({
      code: httpStatus,
      data: result,
      message: result.status === 'ok' ? 'OK' : 'Service degraded',
    });
  }
}
