import { IsOptional, IsString, IsInt, IsNumber, Min, Max, IsDateString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() nickname?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsInt() @Min(0) @Max(2) gender?: number;
  @IsOptional() @IsDateString() birthday?: string;
  @IsOptional() @IsNumber() @Min(50) @Max(250) height?: number;
  @IsOptional() @IsNumber() @Min(20) @Max(300) weight?: number;
  @IsOptional() @IsString() fitnessGoal?: string;
}
