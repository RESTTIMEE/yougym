import { Controller, Post, Body, UseGuards, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PostureDto } from './dto/posture.dto';
import { Response } from 'express';

@Throttle({ default: { limit: 10, ttl: 60000 } })
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('training-advice')
  @UseGuards(JwtAuthGuard)
  async getTrainingAdvice(@CurrentUser('sub') userId: number) {
    return this.aiService.getTrainingAdvice(userId);
  }

  @Post('diet-advice')
  @UseGuards(JwtAuthGuard)
  async getDietAdvice(@CurrentUser('sub') userId: number) {
    return this.aiService.getDietAdvice(userId);
  }

  @Post('posture-assessment')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async assessPosture(
    @CurrentUser('sub') userId: number,
    @UploadedFile() file: any,
    @Body() body: PostureDto,
  ) {
    const base64 = file.buffer.toString('base64');
    return this.aiService.assessPosture(userId, base64, body.description);
  }

  @Post('training-advice/stream')
  @UseGuards(JwtAuthGuard)
  async streamTrainingAdvice(@CurrentUser('sub') userId: number, @Res() res: Response) {
    return this.aiService.streamTrainingAdvice(userId, res);
  }

  @Post('diet-advice/stream')
  @UseGuards(JwtAuthGuard)
  async streamDietAdvice(@CurrentUser('sub') userId: number, @Res() res: Response) {
    return this.aiService.streamDietAdvice(userId, res);
  }
}
