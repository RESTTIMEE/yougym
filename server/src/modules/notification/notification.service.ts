import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../config/prisma.service';
import { RedisService } from '../../config/redis.service';

@Injectable()
export class NotificationService {
  // 内存降级缓存：Redis 不可用时回退到内存
  private tokenCache = new Map<string, { token: string; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ========== 微信 Access Token 管理 ==========

  /**
   * 获取微信 Access Token
   * 优先从 Redis 读取，Redis 失败回退内存缓存，均未命中则调微信 API
   */
  private async getAccessToken(): Promise<string> {
    const cacheKey = 'wx_access_token';

    // 1. 尝试 Redis
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) return cached;
    } catch {
      // Redis 不可用，尝试内存缓存
      const memCached = this.tokenCache.get(cacheKey);
      if (memCached && memCached.expiresAt > Date.now()) {
        return memCached.token;
      }
    }

    const appid = process.env.WECHAT_APPID;
    const secret = process.env.WECHAT_SECRET;

    // 2. 开发模式：跳过真实 API 调用
    if (!appid || appid.startsWith('wx000') || appid === 'your_appid') {
      const devToken = 'dev_access_token';
      try {
        await this.redis.set(cacheKey, devToken, 'EX', 7200);
      } catch {
        this.tokenCache.set(cacheKey, { token: devToken, expiresAt: Date.now() + 7200 * 1000 });
      }
      return devToken;
    }

    // 3. 调微信 API 获取新 token
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appid}&secret=${secret}`;
    const response = await fetch(url);
    const data = (await response.json()) as any;

    if (data.errcode) {
      throw new Error(`获取微信 access_token 失败: ${data.errmsg}`);
    }

    const token = data.access_token as string;
    const ttl: number = data.expires_in || 7200;
    const cacheTtl = Math.max(ttl - 60, 1); // 预留 60s 缓冲，避免边界过期

    // 4. 写缓存
    try {
      await this.redis.set(cacheKey, token, 'EX', cacheTtl);
    } catch {
      this.tokenCache.set(cacheKey, { token, expiresAt: Date.now() + cacheTtl * 1000 });
    }

    return token;
  }

  // ========== 微信订阅消息发送 ==========

  /**
   * 发送微信订阅消息
   */
  async sendSubscribeMessage(
    openid: string,
    templateId: string,
    data: Record<string, any>,
  ): Promise<any> {
    const appid = process.env.WECHAT_APPID;

    // 开发模式：仅打印日志，返回成功
    if (!appid || appid.startsWith('wx000') || appid === 'your_appid') {
      console.log('[Notification] 开发模式 - 模拟发送订阅消息', {
        openid,
        templateId,
        data,
      });
      return { errcode: 0 };
    }

    const token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${token}`;

    const body = {
      touser: openid,
      template_id: templateId,
      data,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as any;
    console.log('[Notification] 订阅消息发送结果:', result);
    return result;
  }

  // ========== 发送检查（每日上限控制） ==========

  /**
   * 检查每日配额并发送通知
   * 每日同一用户最多 3 条
   */
  async checkAndSend(
    userId: number,
    type: 'training' | 'diet' | 'achievement',
    data: { openid: string; templateId: string; templateData: Record<string, any> },
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const todayStart = new Date(today);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // 查询今日已发送数量
    const count = await this.prisma.notificationLog.count({
      where: {
        userId,
        sentAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    if (count >= 3) {
      console.log(`[Notification] 用户 ${userId} 今日已达上限 (${count}/3)，跳过 ${type}`);
      return;
    }

    // 发送订阅消息
    await this.sendSubscribeMessage(data.openid, data.templateId, data.templateData);

    // 记录发送日志
    await this.prisma.notificationLog.create({
      data: {
        userId,
        type,
      },
    });

    console.log(`[Notification] 已发送 ${type} 通知 -> 用户 ${userId} (${count + 1}/3)`);
  }

  // ========== 定时任务 ==========

  /**
   * 早晨训练提醒（9:00）
   * 查询有活跃训练计划但今日尚未打卡的用户
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendMorningReminders() {
    console.log('[Notification] 开始发送早晨训练提醒');
    const today = new Date().toISOString().split('T')[0];

    const plans = await this.prisma.userTrainingPlan.findMany({
      where: { status: 'active' },
      include: { user: true },
    });

    for (const plan of plans) {
      const hasCheckedIn = await this.prisma.dailyCheckin.findFirst({
        where: {
          userId: plan.userId,
          checkinDate: new Date(today),
        },
      });

      if (!hasCheckedIn && plan.user.openid) {
        await this.checkAndSend(plan.userId, 'training', {
          openid: plan.user.openid,
          templateId: process.env.WX_TRAINING_TEMPLATE_ID || '',
          templateData: {
            thing1: { value: '晨间训练提醒' },
            time2: {
              value: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            thing3: { value: '新的一天，别忘了完成今天的训练计划哦！' },
          },
        });
      }
    }

    console.log('[Notification] 早晨训练提醒发送完成');
  }

  /**
   * 晚间训练提醒（18:00）
   * 查询今日仍未打卡的用户，推送晚间提醒
   */
  @Cron(CronExpression.EVERY_DAY_AT_6PM)
  async sendEveningReminders() {
    console.log('[Notification] 开始发送晚间训练提醒');
    const today = new Date().toISOString().split('T')[0];

    const plans = await this.prisma.userTrainingPlan.findMany({
      where: { status: 'active' },
      include: { user: true },
    });

    for (const plan of plans) {
      const hasCheckedIn = await this.prisma.dailyCheckin.findFirst({
        where: {
          userId: plan.userId,
          checkinDate: new Date(today),
        },
      });

      if (!hasCheckedIn && plan.user.openid) {
        await this.checkAndSend(plan.userId, 'training', {
          openid: plan.user.openid,
          templateId: process.env.WX_TRAINING_TEMPLATE_ID || '',
          templateData: {
            thing1: { value: '晚间训练提醒' },
            time2: {
              value: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            thing3: { value: '今天还没有完成训练，现在还来得及！' },
          },
        });
      }
    }

    console.log('[Notification] 晚间训练提醒发送完成');
  }

  /**
   * 午餐饮食提醒（12:00）
   * 查询有活跃饮食计划的用户
   */
  @Cron('0 12 * * *')
  async sendDietReminder() {
    console.log('[Notification] 开始发送午餐饮食提醒');
    const today = new Date().toISOString().split('T')[0];

    const dietPlans = await this.prisma.dietPlan.findMany({
      where: {
        endDate: {
          gte: new Date(today),
        },
      },
      include: { user: true },
    });

    for (const plan of dietPlans) {
      if (plan.user.openid) {
        await this.checkAndSend(plan.userId, 'diet', {
          openid: plan.user.openid,
          templateId: process.env.WX_DIET_TEMPLATE_ID || '',
          templateData: {
            thing1: { value: '午餐饮食提醒' },
            time2: {
              value: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            thing3: { value: `记得控制午餐热量，今日目标 ${plan.dailyCalories} 大卡` },
          },
        });
      }
    }

    console.log('[Notification] 午餐饮食提醒发送完成');
  }
}
