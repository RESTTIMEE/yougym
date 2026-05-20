import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PlanQueryDto } from './dto/plan-query.dto';
import { CreateUserPlanDto } from './dto/create-user-plan.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { CheckinDto } from './dto/checkin.dto';

@Controller('training')
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('plans')
  async getPlans(@Query() query: PlanQueryDto) {
    return this.trainingService.getPlans(query);
  }

  @Get('plans/:id')
  async getPlanDetail(@Param('id') id: string) {
    return this.trainingService.getPlanDetail(Number(id));
  }

  @Post('user-plan')
  @UseGuards(JwtAuthGuard)
  async createUserPlan(@CurrentUser('sub') userId: number, @Body() body: CreateUserPlanDto) {
    return this.trainingService.createUserPlan(userId, body);
  }

  @Post('plans')
  @UseGuards(JwtAuthGuard)
  async createPlan(@CurrentUser('sub') userId: number, @Body() body: CreatePlanDto) {
    return this.trainingService.createPlan(userId, body);
  }

  @Get('my-plans')
  @UseGuards(JwtAuthGuard)
  async getMyPlans(@CurrentUser('sub') userId: number) {
    return this.trainingService.getMyPlans(userId);
  }

  @Post('checkin')
  @UseGuards(JwtAuthGuard)
  async checkin(@CurrentUser('sub') userId: number, @Body() body: CheckinDto) {
    return this.trainingService.checkin(userId, body);
  }

  @Get('checkins')
  @UseGuards(JwtAuthGuard)
  async getCheckins(
    @CurrentUser('sub') userId: number,
    @Query('year') year?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    if (year) return this.trainingService.getYearCheckins(userId, Number(year));
    return this.trainingService.getCheckins(userId, Number(page), Number(pageSize));
  }

  @Get('report/cycle')
  @UseGuards(JwtAuthGuard)
  async getCycleReport(@CurrentUser('sub') userId: number, @Query('userPlanId') userPlanId: string) {
    return this.trainingService.getCycleReport(userId, Number(userPlanId));
  }
}
