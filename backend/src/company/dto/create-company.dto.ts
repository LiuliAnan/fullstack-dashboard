import { IsString, IsInt, IsOptional, IsNotEmpty, MaxLength, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { trimString } from '../../common/validation/transformers';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({ example: 'C1001' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  company_code: string;

  @ApiProperty({ example: 'Example Supplier Ltd' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  company_name: string;

  @ApiProperty({ minimum: 1, maximum: 4, example: 2 })
  @IsInt()
  @Min(1)
  @Max(4)
  level: number;

  @ApiProperty({ example: 'China' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  country: string;

  @ApiProperty({ example: 'Shanghai' })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @ApiProperty({ minimum: 1800, maximum: 2100, example: 2001 })
  @IsInt()
  @Min(1800)
  @Max(2100)
  founded_year: number;

  @ApiProperty({ minimum: 0, example: 1000000 })
  @IsInt()
  @Min(0)
  annual_revenue: number;

  @ApiProperty({ minimum: 0, example: 120 })
  @IsInt()
  @Min(0)
  employees: number;

  @ApiPropertyOptional({ example: 'C1000', nullable: true })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(50)
  parent_company?: string;
}
