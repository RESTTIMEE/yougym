import { IsString, IsInt, IsNumber, IsDateString, Min } from 'class-validator';
import { Trim } from '../../../common/decorators/trim.decorator';

export class SaveDietPlanDto {
  @IsString() @Trim() goal: string;
  @IsInt() @Min(500) dailyCalories: number;
  @IsNumber() @Min(0) proteinTargetG: number;
  @IsNumber() @Min(0) fatTargetG: number;
  @IsNumber() @Min(0) carbsTargetG: number;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
}
