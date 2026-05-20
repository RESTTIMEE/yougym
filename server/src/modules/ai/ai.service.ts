import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { RedisService } from '../../config/redis.service';
import { AiConfigService } from '../../config/ai-config.service';
import { PrismaService } from '../../config/prisma.service';
import { AchievementService } from '../achievement/achievement.service';
import { Response } from 'express';

@Injectable()
export class AiService {
  private cacheTTL = 86400; // 24h

  constructor(
    private readonly achievementService: AchievementService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly aiConfig: AiConfigService,
  ) {}

  private async cacheGet(key: string): Promise<string | null> {
    try { return await this.redis.get(key); } catch { return null; }
  }

  private async cacheSet(key: string, value: string): Promise<void> {
    try { await this.redis.set(key, value, 'EX', this.cacheTTL); } catch { /* Redis may be down */ }
  }

  private async callAI(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.aiConfig.baseUrl}/chat/completions`,
      {
        model: this.aiConfig.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.aiConfig.apiKey}`,
        },
        timeout: 30000,
      },
    );
    return response.data.choices[0].message.content;
  }

  private async callVisionAI(prompt: string, imageBase64: string): Promise<string> {
    const response = await axios.post(
      `${this.aiConfig.baseUrl}/chat/completions`,
      {
        model: this.aiConfig.visionModel || 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
            ],
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.aiConfig.apiKey}`,
        },
        timeout: 60000,
      },
    );
    return response.data.choices[0].message.content;
  }

  async getTrainingAdvice(userId: number) {
    const cacheKey = `ai:training:${userId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, cached: true };
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId, checkinDate: { gte: since } },
      orderBy: { checkinDate: 'desc' },
    });

    const totalDays = checkins.length;
    const totalDuration = checkins.reduce((s, c) => s + c.durationMinutes, 0);
    const avgFeeling = totalDays > 0
      ? (checkins.reduce((s, c) => s + c.feelingRating, 0) / totalDays).toFixed(1)
      : '无';

    const userProfile = `目标:${user.fitnessGoal || '未设置'}, 身高:${user.height || '?'}cm, 体重:${user.weight || '?'}kg`;
    const trainingHistory = `近7天训练${totalDays}次, 总时长${totalDuration}分钟, 平均感觉评分${avgFeeling}/5`;

    const prompt = this.aiConfig.prompts.trainingAdvice
      .replace('{userProfile}', userProfile)
      .replace('{trainingHistory}', trainingHistory);

    const raw = await this.callAI(prompt);
    let advice: string[];
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      advice = parsed.advice || [raw];
    } catch {
      advice = raw.split('\n').filter((l: string) => l.trim());
    }

    const result = { advice, cached: false, generatedAt: new Date().toISOString() };
    await this.cacheSet(cacheKey, JSON.stringify(result));
    this.achievementService.checkAndUnlock(userId, 'ai_advice').catch(() => { /* 成就解锁失败不影响主流程 */ });
    return result;
  }

  async getDietAdvice(userId: number) {
    const cacheKey = `ai:diet:${userId}`;
    const cached = await this.cacheGet(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data, cached: true };
    }

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const records = await this.prisma.dietRecord.findMany({
      where: { userId, recordDate: { gte: since } },
      include: { food: true },
    });

    let avgCal = 0, avgProtein = 0, avgFat = 0, avgCarbs = 0;
    const days = new Set(records.map(r => r.recordDate.toISOString().split('T')[0])).size || 1;
    for (const r of records) {
      const factor = r.servingAmount / 100;
      avgCal += r.food.caloriesPer100g * factor;
      avgProtein += r.food.proteinG * factor;
      avgFat += r.food.fatG * factor;
      avgCarbs += r.food.carbsG * factor;
    }

    const userProfile = `目标:${user.fitnessGoal || '未设置'}, 身高:${user.height || '?'}cm, 体重:${user.weight || '?'}kg`;
    const dietRecords = `近7天日均: ${Math.round(avgCal / days)}kcal, 蛋白${(avgProtein / days).toFixed(0)}g, 脂肪${(avgFat / days).toFixed(0)}g, 碳水${(avgCarbs / days).toFixed(0)}g`;

    const prompt = this.aiConfig.prompts.dietAdvice
      .replace('{userProfile}', userProfile)
      .replace('{dietRecords}', dietRecords);

    const raw = await this.callAI(prompt);
    let evaluation = '', suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      evaluation = parsed.evaluation || '';
      suggestions = parsed.suggestions || [];
    } catch {
      evaluation = raw;
    }

    const result = { evaluation, suggestions, cached: false, generatedAt: new Date().toISOString() };
    await this.cacheSet(cacheKey, JSON.stringify(result));
    this.achievementService.checkAndUnlock(userId, 'ai_advice').catch(() => { /* 成就解锁失败不影响主流程 */ });
    return result;
  }

  async assessPosture(userId: number, imageBase64: string, description?: string) {
    const userDesc = description || '请根据图片分析体态';
    const prompt = this.aiConfig.prompts.postureAnalysis.replace('{userDescription}', userDesc);

    const raw = await this.callVisionAI(prompt, imageBase64);

    let postureType = '未知', severity = '未知', correctionPlan: any[] = [];
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      postureType = parsed.postureType || '未知';
      severity = parsed.severity || '未知';
      correctionPlan = parsed.correctionPlan || [];
    } catch {
      postureType = '分析失败';
    }

    const assessment = await this.prisma.postureAssessment.create({
      data: {
        userId,
        assessmentDate: new Date(),
        postureType,
        severity,
        testDataJson: raw,
      },
    });

    if (correctionPlan.length > 0) {
      await Promise.all(
        correctionPlan.map((plan: any) =>
          this.prisma.postureCorrectionPlan.create({
            data: {
              userId,
              assessmentId: assessment.id,
              exerciseName: plan.exerciseName || '',
              frequency: plan.frequency || '',
              durationMinutes: plan.durationMinutes || 30,
              notes: plan.notes || '',
            },
          }),
        ),
      );
    }

    this.achievementService.checkAndUnlock(userId, 'posture').catch(() => { /* 成就解锁失败不影响主流程 */ });
    return { postureType, severity, correctionPlan };
  }

  /** Stream training advice via SSE */
  async streamTrainingAdvice(userId: number, res: Response) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const checkins = await this.prisma.dailyCheckin.findMany({
      where: { userId, checkinDate: { gte: since } },
      orderBy: { checkinDate: 'desc' },
    });

    const totalDays = checkins.length;
    const totalDuration = checkins.reduce((s, c) => s + c.durationMinutes, 0);
    const avgFeeling = totalDays > 0
      ? (checkins.reduce((s, c) => s + c.feelingRating, 0) / totalDays).toFixed(1)
      : '无';

    const userProfile = `目标:${user.fitnessGoal || '未设置'}, 身高:${user.height || '?'}cm, 体重:${user.weight || '?'}kg`;
    const trainingHistory = `近7天训练${totalDays}次, 总时长${totalDuration}分钟, 平均感觉评分${avgFeeling}/5`;
    const prompt = this.aiConfig.prompts.trainingAdvice
      .replace('{userProfile}', userProfile)
      .replace('{trainingHistory}', trainingHistory);

    return this.streamFromDeepSeek(prompt, res, userId, 'ai:training');
  }

  /** Stream diet advice via SSE */
  async streamDietAdvice(userId: number, res: Response) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const records = await this.prisma.dietRecord.findMany({
      where: { userId, recordDate: { gte: since } },
      include: { food: true },
    });

    let avgCal = 0, avgProtein = 0, avgFat = 0, avgCarbs = 0;
    const days = new Set(records.map(r => r.recordDate.toISOString().split('T')[0])).size || 1;
    for (const r of records) {
      const factor = r.servingAmount / 100;
      avgCal += r.food.caloriesPer100g * factor;
      avgProtein += r.food.proteinG * factor;
      avgFat += r.food.fatG * factor;
      avgCarbs += r.food.carbsG * factor;
    }

    const userProfile = `目标:${user.fitnessGoal || '未设置'}, 身高:${user.height || '?'}cm, 体重:${user.weight || '?'}kg`;
    const dietRecords = `近7天日均: ${Math.round(avgCal / days)}kcal, 蛋白${(avgProtein / days).toFixed(0)}g, 脂肪${(avgFat / days).toFixed(0)}g, 碳水${(avgCarbs / days).toFixed(0)}g`;
    const prompt = this.aiConfig.prompts.dietAdvice
      .replace('{userProfile}', userProfile)
      .replace('{dietRecords}', dietRecords);

    return this.streamFromDeepSeek(prompt, res, userId, 'ai:diet');
  }

  private async streamFromDeepSeek(prompt: string, res: Response, userId: number, cachePrefix: string) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const response = await axios.post(
        `${this.aiConfig.baseUrl}/chat/completions`,
        {
          model: this.aiConfig.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          stream: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.aiConfig.apiKey}`,
          },
          timeout: 30000,
          responseType: 'stream',
        },
      );

      let fullText = '';

      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                res.write(content);
              }
            } catch { /* skip malformed chunks */ }
          }
        }
      });

      response.data.on('end', () => {
        res.end();
        const cacheKey = `${cachePrefix}:${userId}`;
        try {
          this.redis.set(cacheKey, fullText, 'EX', 86400).catch(() => { /* Redis 缓存失败静默 */ });
        } catch { /* Redis may be down */ }
        this.achievementService.checkAndUnlock(userId, 'ai_advice').catch(() => { /* 成就解锁失败不影响主流程 */ });
      });

      response.data.on('error', (err: Error) => {
        res.end();
      });
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ code: 500, message: 'AI 服务暂时不可用' });
      } else {
        res.end();
      }
    }
  }
}
