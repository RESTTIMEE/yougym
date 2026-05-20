import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Module({
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}

// 注：PrismaService 与 RedisService 由 @Global() InfrastructureModule 提供，
// NotificationService 通过 constructor 直接注入即可，无需在此模块重复声明。
