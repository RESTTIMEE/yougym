import { IsNotEmpty, IsString, IsArray, ValidateNested, IsNumber, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class DietRecordItem {
  @IsNotEmpty()
  @IsNumber()
  foodId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  servingAmount: number;
}

export class DietRecordDto {
  @IsNotEmpty()
  @IsString()
  mealType: string;

  @IsNotEmpty()
  @IsDateString()
  recordDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietRecordItem)
  items: DietRecordItem[];
}
