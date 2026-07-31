import { IsString, IsInt, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  company_code: string;

  @IsString()
  company_name: string;

  @IsInt()
  level: number;

  @IsString()
  country: string;

  @IsString()
  city: string;

  @IsInt()
  founded_year: number;

  @IsInt()
  annual_revenue: number;

  @IsInt()
  employees: number;

  @IsOptional()
  @IsString()
  parent_company?: string;
}