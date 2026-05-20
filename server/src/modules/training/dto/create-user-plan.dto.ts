import { IsNotEmpty, IsInt, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateUserPlanDto {
  @IsNotEmpty()
  @IsInt()
  planId: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  goalDescription?: string;
}
