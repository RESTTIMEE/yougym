import { IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class AddBodyRecordDto {
  @IsNumber() @Min(20) @Max(300) weight: number;
  @IsOptional() @IsNumber() @Min(1) @Max(60) bodyFatPct?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(100) muscleMassKg?: number;
  @IsOptional() @IsNumber() @Min(1) @Max(10) flexibilityScore?: number;
  @IsOptional() @IsNumber() @Min(50) @Max(200) chest?: number;
  @IsOptional() @IsNumber() @Min(50) @Max(200) waist?: number;
  @IsOptional() @IsNumber() @Min(50) @Max(200) hip?: number;
  @IsOptional() @IsNumber() @Min(10) @Max(50) bmi?: number;
  @IsDateString() recordDate: string;
}
