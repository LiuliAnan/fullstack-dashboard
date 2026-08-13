import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const BAR_CHART_DIMENSIONS = ['level', 'country', 'city'] as const;
export type BarChartDimension = (typeof BAR_CHART_DIMENSIONS)[number];

export class YearRangeDto {
  @ApiPropertyOptional({ example: 1950, minimum: 1800, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  @Max(2100)
  start?: number;

  @ApiPropertyOptional({ example: 2023, minimum: 1800, maximum: 2100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1800)
  @Max(2100)
  end?: number;
}

export class NumberRangeDto {
  @ApiPropertyOptional({ example: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min?: number;

  @ApiPropertyOptional({ example: 1000000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max?: number;
}

export class CompanyBarChartFilterDto {
  @ApiPropertyOptional({ type: [Number], example: [1, 2, 3] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(4, { each: true })
  level?: number[];

  @ApiPropertyOptional({ type: [String], example: ['China', 'USA'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  country?: string[];

  @ApiPropertyOptional({ type: [String], example: ['Beijing', 'New York'] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  city?: string[];

  @ApiPropertyOptional({ type: YearRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => YearRangeDto)
  founded_year?: YearRangeDto;

  @ApiPropertyOptional({ type: NumberRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NumberRangeDto)
  annual_revenue?: NumberRangeDto;

  @ApiPropertyOptional({ type: NumberRangeDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NumberRangeDto)
  employees?: NumberRangeDto;
}

export class BarChartQueryDto {
  @ApiProperty({ enum: BAR_CHART_DIMENSIONS, example: 'country' })
  @IsIn(BAR_CHART_DIMENSIONS)
  dimension: BarChartDimension;

  @ApiProperty({ type: CompanyBarChartFilterDto })
  @ValidateNested()
  @Type(() => CompanyBarChartFilterDto)
  filter: CompanyBarChartFilterDto;
}
