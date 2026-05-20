import { IsString, IsInt, IsOptional, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExerciseItemDto {
  @IsString() exerciseName: string;
  @IsInt() @Min(1) sets: number;
  @IsInt() @Min(1) reps: number;
  @IsInt() @Min(10) restSeconds: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsInt() sortOrder: number;
}

class TrainingDayDto {
  @IsInt() @Min(1) dayNumber: number;
  @IsOptional() @IsString() dayName?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => ExerciseItemDto) exercises: ExerciseItemDto[];
}

export class CreatePlanDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() category: string;
  @IsInt() @Min(1) @Max(3) difficulty: number;
  @IsInt() @Min(1) durationWeeks: number;
  @IsOptional() @IsString() coverImage?: string;
  @IsInt() @Min(1) @Max(14) cycleDays: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => TrainingDayDto) trainingDays: TrainingDayDto[];
}
