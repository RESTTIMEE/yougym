import { IsNotEmpty, IsInt, IsOptional, IsString, Min, Max, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class SetLogDto {
  @IsInt() setNumber: number;
  @IsOptional() @IsNumber() weight?: number;
  @IsInt() @Min(0) reps: number;
}

class ExerciseLogDto {
  @IsInt() exerciseId: number;
  @IsArray() @ValidateNested({ each: true }) @Type(() => SetLogDto) sets: SetLogDto[];
}

export class CheckinDto {
  @IsNotEmpty()
  @IsInt()
  planId: number;

  @IsOptional()
  @IsInt()
  trainingDayId?: number;

  @IsNotEmpty()
  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  feelingRating?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseLogDto)
  exercises?: ExerciseLogDto[];
}
