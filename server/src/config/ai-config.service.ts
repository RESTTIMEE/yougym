import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiConfigService {
  public readonly model: string;
  public readonly visionModel: string;
  public readonly prompts: Record<string, string>;

  constructor(private readonly config: ConfigService) {
    this.model = this.config.get<string>('AI_MODEL') || 'deepseek-chat';
    this.visionModel = this.config.get<string>('AI_VISION_MODEL') || 'deepseek-chat';

    this.prompts = {
      trainingAdvice: `
        你是一名专业健身教练，拥有10年指导经验。
        用户信息：{userProfile}
        训练历史：{trainingHistory}
        请给出3条具体的训练调整建议，JSON格式返回。
      `,
      dietAdvice: `
        你是一位运动营养师。
        用户信息：{userProfile}
        近期饮食：{dietRecords}
        请评价当前饮食并给出3条调整建议，JSON格式返回。
      `,
      postureAnalysis: `
        你是一位体态矫正专家。
        用户描述：{userDescription}
        请判断体态类型和严重程度，并给出矫正方案，JSON格式返回。
      `,
    };
  }

  get apiKey(): string {
    return this.config.getOrThrow<string>('AI_API_KEY');
  }

  get baseUrl(): string {
    return this.config.get<string>('AI_API_URL') || 'https://api.deepseek.com/v1';
  }
}
