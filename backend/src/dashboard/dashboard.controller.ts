import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { BarChartQueryDto } from './dto/bar-chart-query.dto';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({ description: 'Missing, invalid, or expired JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // 一次返回所有数据：数据卡 + 环形图 + 折线图
  @Get()
  @ApiOperation({ summary: 'Get dashboard cards, level distribution, and founded-year trend' })
  getDashboard() {
    return this.dashboardService.getDashboard();
  }

  @Get('barchart/options')
  @ApiOperation({ summary: 'Get available bar-chart filters and numeric ranges' })
  getBarChartOptions() {
    return this.dashboardService.getBarChartOptions();
  }

  @Post('barchart')
  @ApiOperation({ summary: 'Group companies by a dimension using combined filters' })
  getCompaniesByFilter(@Body() dto: BarChartQueryDto) {
    return this.dashboardService.getCompaniesByFilter(dto);
  }
}
