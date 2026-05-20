import { IsOptional, IsString } from 'class-validator';

export class PostureDto {
  @IsOptional()
  @IsString()
  description?: string;
}
