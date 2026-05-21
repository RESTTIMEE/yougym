import { Controller, Get, UseGuards } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('achievement')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  @Get('list')
  async getList() {
    return this.achievementService.getList();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyAchievements(@CurrentUser('sub') userId: number) {
    return this.achievementService.getMyAchievements(userId);
  }

  @Get('points')
  @UseGuards(JwtAuthGuard)
  async getMyPoints(@CurrentUser('sub') userId: number) {
    return this.achievementService.getMyPoints(userId);
  }
}
