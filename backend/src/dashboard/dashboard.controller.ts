import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  // 一次返回所有数据：数据卡 + 环形图 + 折线图
  @Get()
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}