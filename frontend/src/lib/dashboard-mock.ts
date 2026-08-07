import type { DashboardData } from '@/types/api';

// Mock 数据：摘取真实数据的聚合特征，用于先开发组件
// 后端 API 做好后替换为真实请求
export const dashboardMock: DashboardData = {
  stats: {
    companyCount: 2000,
    totalRevenue: 182779175,
    countryCount: 8,
    employeeCount: 699119,
  },
  levelDistribution: [
    { level: 1, count: 1, percentage: 0.05 },
    { level: 2, count: 50, percentage: 2.5 },
    { level: 3, count: 250, percentage: 12.5 },
    { level: 4, count: 1699, percentage: 84.95 },
  ],
  // 摘取部分年份的累积趋势（真实数据 1900-2023，这里取关键节点）
  foundedTrend: [
    { year: 1900, cumulative: 1 },
    { year: 1910, cumulative: 8 },
    { year: 1920, cumulative: 22 },
    { year: 1930, cumulative: 45 },
    { year: 1940, cumulative: 78 },
    { year: 1950, cumulative: 120 },
    { year: 1960, cumulative: 180 },
    { year: 1970, cumulative: 260 },
    { year: 1980, cumulative: 380 },
    { year: 1990, cumulative: 540 },
    { year: 2000, cumulative: 850 },
    { year: 2010, cumulative: 1300 },
    { year: 2020, cumulative: 1850 },
    { year: 2023, cumulative: 2000 },
  ],
};