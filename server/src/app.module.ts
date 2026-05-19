import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { envValidationSchema } from './config/validation';
import { InfrastructureModule } from './config/infrastructure.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { TrainingModule } from './modules/training/training.module';
import { DietModule } from './modules/diet/diet.module';
import { AiModule } from './modules/ai/ai.module';
import { AchievementModule } from './modules/achievement/achievement.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HealthModule } from './modules/health/health.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    // 环境变量配置 (全局)
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      envFilePath: ['.env.local', '.env'],
    }),
    // 限流: 每分钟100次
    ThrottlerModule.forRoot([{ ttl: 60, limit: 100 }]),
    // 定时任务 (训练/饮食提醒)
    ScheduleModule.forRoot(),
    // DI 基础设施 (全局)
    InfrastructureModule,
    // 业务模块
    AuthModule,
    UserModule,
    TrainingModule,
    DietModule,
    AiModule,
    AchievementModule,
    NotificationModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
