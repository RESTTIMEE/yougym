import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { DietService } from './diet.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DietRecordDto } from './dto/diet-record.dto';
import { DietQueryDto } from './dto/diet-query.dto';
import { SaveDietPlanDto } from './dto/save-plan.dto';

@Controller('diet')
export class DietController {
  constructor(private readonly dietService: DietService) {}

  @Get('foods')
  async searchFoods(@Query('keyword') keyword: string) {
    return this.dietService.searchFoods(keyword);
  }

  @Post('records')
  @UseGuards(JwtAuthGuard)
  async addRecords(@CurrentUser('sub') userId: number, @Body() body: DietRecordDto) {
    return this.dietService.addRecords(userId, body);
  }

  @Get('records')
  @UseGuards(JwtAuthGuard)
  async getRecords(@CurrentUser('sub') userId: number, @Query() query: DietQueryDto) {
    return this.dietService.getRecords(userId, query);
  }

  @Get('plan')
  @UseGuards(JwtAuthGuard)
  async getPlan(@CurrentUser('sub') userId: number) {
    return this.dietService.getPlan(userId);
  }

  @Get('frequent-foods')
  @UseGuards(JwtAuthGuard)
  async getFrequentFoods(@CurrentUser('sub') userId: number) {
    return this.dietService.getFrequentFoods(userId);
  }

  @Post('plan')
  @UseGuards(JwtAuthGuard)
  async savePlan(@CurrentUser('sub') userId: number, @Body() body: SaveDietPlanDto) {
    return this.dietService.savePlan(userId, body);
  }
}
