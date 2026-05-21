/** 分页请求 DTO */
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

/** 分页返回结构 */
export interface PaginatedResult<T> {
  page: number;
  pageSize: number;
  total: number;
  list: T[];
}

export function paginated<T>(page: number, pageSize: number, total: number, list: T[]): PaginatedResult<T> {
  return { page, pageSize, total, list };
}
