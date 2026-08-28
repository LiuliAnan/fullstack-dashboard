import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BarChartQueryDto } from './dto/bar-chart-query.dto';
import { BubbleChartQueryDto } from './dto/bubble-chart-query.dto';
import {
  BarChartOptionsDto,
  BarChartResponseDto,
  BubbleChartResponseDto,
  DashboardResponseDto,
  ErrorResponseDto,
} from '../common/swagger/api-models';

@ApiTags('Dashboard')
@ApiBearerAuth('access-token')
@ApiUnauthorizedResponse({
  type: ErrorResponseDto,
  description: 'Missing, invalid, or expired JWT',
})
@UseGuards(JwtAuthGuard)
@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // 一次返回所有数据：数据卡 + 环形图 + 折线图
  @Get()
  @ApiOperation({
    summary: 'Get dashboard cards, level distribution, and founded-year trend',
  })
  @ApiOkResponse({ type: DashboardResponseDto })
  getDashboard() {
    return this.dashboardService.getDashboard();
  }

  @Get('barchart/options')
  @ApiOperation({
    summary: 'Get available bar-chart filters and numeric ranges',
  })
  @ApiOkResponse({ type: BarChartOptionsDto })
  getBarChartOptions() {
    return this.dashboardService.getBarChartOptions();
  }

  @Post('barchart')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Group companies by a dimension using combined filters',
  })
  @ApiOkResponse({ type: BarChartResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Invalid dimension, filter values, or reversed range',
  })
  getCompaniesByFilter(@Body() dto: BarChartQueryDto) {
    return this.dashboardService.getCompaniesByFilter(dto);
  }

  @Post('bubblechart')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Get a filtered company hierarchy for the zoomable bubble chart',
  })
  @ApiOkResponse({ type: BubbleChartResponseDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Invalid filter values or reversed range',
  })
  getCompanyHierarchy(@Body() dto: BubbleChartQueryDto) {
    return this.dashboardService.getCompanyHierarchy(dto);
  }
}
