import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { AiConfigService } from './ai-config.service';

@Global()
@Module({
  providers: [PrismaService, RedisService, AiConfigService],
  exports: [PrismaService, RedisService, AiConfigService],
})
export class InfrastructureModule {}
