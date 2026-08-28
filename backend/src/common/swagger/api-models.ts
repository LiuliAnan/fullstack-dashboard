import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 }) statusCode: number;
  @ApiProperty({
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['email must be an email'],
  })
  message: string | string[];
  @ApiProperty({ example: 'Bad Request' }) error: string;
}

export class UserViewDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 'jane@example.com' }) email: string;
  @ApiProperty({ example: 'Jane Doe' }) name: string;
  @ApiProperty({
    enum: ['Admin', 'Manager', 'Editor', 'User'],
    example: 'User',
  })
  role: string;
  @ApiProperty({ enum: ['active', 'banned', 'pending'], example: 'active' })
  status: string;
  @ApiProperty({ example: '2026-08-26T02:00:00.000Z' }) createdAt: string;
}

export class BasicUserDto {
  @ApiProperty({ example: 1 }) id: number;
  @ApiProperty({ example: 'jane@example.com' }) email: string;
  @ApiPropertyOptional({ example: '2026-08-26T02:00:00.000Z' })
  createdAt?: string;
}

export class LoginDataDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;
  @ApiProperty({ type: BasicUserDto }) user: BasicUserDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: 200 }) statusCode: number;
  @ApiProperty({ example: 'Login successful' }) message: string;
  @ApiProperty({ type: LoginDataDto }) data: LoginDataDto;
}

export class SignupResponseDto {
  @ApiProperty({ example: 201 }) statusCode: number;
  @ApiProperty({ example: 'User registered successfully' }) message: string;
  @ApiProperty({ type: BasicUserDto }) data: BasicUserDto;
}

export class MeResponseDto {
  @ApiProperty({ example: 200 }) statusCode: number;
  @ApiProperty({ type: BasicUserDto }) data: BasicUserDto;
}

export class PaginatedUsersDto {
  @ApiProperty({ type: [UserViewDto] }) items: UserViewDto[];
  @ApiProperty({ example: 25 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 10 }) pageSize: number;
}

export class DeleteUserDto {
  @ApiProperty({ example: 12 }) id: number;
}

export class DeleteUsersResultDto {
  @ApiProperty({ example: 2 }) deleted: number;
}

export class CompanyViewDto {
  @ApiProperty({ example: 'C1001' }) company_code: string;
  @ApiProperty({ example: 'Example Supplier Ltd' }) company_name: string;
  @ApiProperty({ minimum: 1, maximum: 4, example: 2 }) level: number;
  @ApiProperty({ example: 'China' }) country: string;
  @ApiProperty({ example: 'Shanghai' }) city: string;
  @ApiProperty({ example: 2001 }) founded_year: number;
  @ApiProperty({ example: 1000000 }) annual_revenue: number;
  @ApiProperty({ example: 120 }) employees: number;
  @ApiPropertyOptional({ example: 'C1000', nullable: true }) parent_company?:
    string | null;
  @ApiPropertyOptional({ example: 'Parent Supplier Ltd', nullable: true })
  parent_company_name?: string | null;
  @ApiPropertyOptional({ example: 8333 }) profit_efficiency?: number;
}

export class PaginatedCompaniesDto {
  @ApiProperty({ type: [CompanyViewDto] }) items: CompanyViewDto[];
  @ApiProperty({ example: 2000 }) total: number;
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 10 }) pageSize: number;
}

export class DeleteCompanyDto {
  @ApiProperty({ example: 'C1001' }) company_code: string;
}

export class DashboardStatsDto {
  @ApiProperty({ example: 2000 }) companyCount: number;
  @ApiProperty({ example: 182779175 }) totalRevenue: number;
  @ApiProperty({ example: 8 }) countryCount: number;
  @ApiProperty({ example: 699119 }) employeeCount: number;
}

export class LevelDistributionDto {
  @ApiProperty({ example: 1 }) level: number;
  @ApiProperty({ example: 1 }) count: number;
  @ApiProperty({ example: 0.05 }) percentage: number;
}

export class FoundedTrendDto {
  @ApiProperty({ example: 1900 }) year: number;
  @ApiProperty({ example: 1 }) cumulative: number;
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardStatsDto }) stats: DashboardStatsDto;
  @ApiProperty({ type: [LevelDistributionDto] })
  levelDistribution: LevelDistributionDto[];
  @ApiProperty({ type: [FoundedTrendDto] }) foundedTrend: FoundedTrendDto[];
}

export class NumericRangeDto {
  @ApiProperty({ example: 1900 }) min: number;
  @ApiProperty({ example: 2023 }) max: number;
}

export class DashboardRangesDto {
  @ApiProperty({ type: NumericRangeDto }) foundedYear: NumericRangeDto;
  @ApiProperty({ type: NumericRangeDto }) annualRevenue: NumericRangeDto;
  @ApiProperty({ type: NumericRangeDto }) employees: NumericRangeDto;
}

export class BarChartOptionsDto {
  @ApiProperty({ type: [Number], example: [1, 2, 3, 4] }) levels: number[];
  @ApiProperty({ type: [String], example: ['China', 'USA'] })
  countries: string[];
  @ApiProperty({ type: [String], example: ['Beijing', 'New York'] })
  cities: string[];
  @ApiProperty({ type: DashboardRangesDto }) ranges: DashboardRangesDto;
}

export class BarChartDataDto {
  @ApiProperty({ example: 'China' }) label: string;
  @ApiProperty({ example: 120 }) count: number;
  @ApiProperty({ example: 56.07 }) percentage: number;
}

export class BarChartResponseDto {
  @ApiProperty({ enum: ['level', 'country', 'city'], example: 'country' })
  dimension: string;
  @ApiProperty({ example: 214 }) total: number;
  @ApiProperty({ type: [BarChartDataDto] }) data: BarChartDataDto[];
}

export class HierarchyNodeDto {
  @ApiProperty({ example: 'Example Supplier Ltd' }) name: string;
  @ApiProperty({ example: 'C1001' }) code: string;
  @ApiProperty({ example: 2 }) level: number;
  @ApiPropertyOptional({ example: 'China' }) country?: string;
  @ApiPropertyOptional({ example: 'Shanghai' }) city?: string;
  @ApiPropertyOptional({ example: 2001 }) foundedYear?: number;
  @ApiPropertyOptional({ example: 1000000 }) annualRevenue?: number;
  @ApiPropertyOptional({ example: 120 }) employees?: number;
  @ApiProperty({ example: 1 }) value: number;
  @ApiPropertyOptional({ example: true }) matched?: boolean;
  @ApiProperty({ type: () => [HierarchyNodeDto] }) children: HierarchyNodeDto[];
}

export class BubbleChartResponseDto {
  @ApiProperty({ example: 50 }) total: number;
  @ApiProperty({ type: HierarchyNodeDto }) hierarchy: HierarchyNodeDto;
}
