import { Controller, Get, Put, Post, Body, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AddBodyRecordDto } from './dto/body-record.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(@CurrentUser('sub') userId: number) {
    return this.userService.getDashboard(userId);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser('sub') userId: number) {
    return this.userService.getProfile(userId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@CurrentUser('sub') userId: number, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(userId, dto);
  }

  @Post('body-record')
  @UseGuards(JwtAuthGuard)
  addBodyRecord(@CurrentUser('sub') userId: number, @Body() dto: AddBodyRecordDto) {
    return this.userService.addBodyRecord(userId, dto);
  }

  @Get('body-records')
  @UseGuards(JwtAuthGuard)
  getBodyRecords(
    @CurrentUser('sub') userId: number,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.userService.getBodyRecords(userId, page, pageSize);
  }

  @Post('monthly-report')
  @UseGuards(JwtAuthGuard)
  async getMonthlyReport(@CurrentUser('sub') userId: number, @Body() body: any) {
    return this.userService.getMonthlyReport(userId, body);
  }
}
