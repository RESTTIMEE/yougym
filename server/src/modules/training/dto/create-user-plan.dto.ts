import { IsNotEmpty, IsInt, IsDateString } from 'class-validator';

export class CreateUserPlanDto {
  @IsNotEmpty()
  @IsInt()
  planId: number;

  @IsNotEmpty()
  @IsDateString()
  startDate: string;
}
