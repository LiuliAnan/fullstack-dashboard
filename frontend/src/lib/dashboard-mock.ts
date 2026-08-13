import type { Company } from '@/types/api';
import { calculateDashboardData } from './dashboard-calculations';

// 从 backend/data/companies_0708.csv 摘取的真实公司子集。
// 组件开发、离线预览和计算测试均可使用这份原始结构。
export const dummyCompanies: Company[] = [
  { company_code: 'C0', company_name: 'Rodriguez, Figueroa and Sanchez', level: 1, country: 'China', city: 'Beijing', founded_year: 1994, annual_revenue: 317736, employees: 4606, parent_company: null },
  { company_code: 'C01', company_name: 'Doyle Ltd', level: 2, country: 'Japan', city: 'Nagoya', founded_year: 1917, annual_revenue: 429408, employees: 889, parent_company: 'C0' },
  { company_code: 'C02', company_name: 'Mcclain, Miller and Henderson', level: 2, country: 'China', city: 'Hangzhou', founded_year: 1954, annual_revenue: 894345, employees: 310, parent_company: 'C0' },
  { company_code: 'C001', company_name: 'Walker LLC', level: 3, country: 'Japan', city: 'Tokyo', founded_year: 1994, annual_revenue: 94834, employees: 744, parent_company: 'C01' },
  { company_code: 'C002', company_name: 'Chapman and Sons', level: 3, country: 'USA', city: 'Houston', founded_year: 1994, annual_revenue: 92538, employees: 947, parent_company: 'C01' },
  { company_code: 'C0302', company_name: 'Estrada-Nolan', level: 4, country: 'Germany', city: 'Düsseldorf', founded_year: 2014, annual_revenue: 30690, employees: 194, parent_company: 'C03' },
  { company_code: 'C0303', company_name: 'Santana-Byrd', level: 4, country: 'France', city: 'Lille', founded_year: 2023, annual_revenue: 95680, employees: 377, parent_company: 'C03' },
];

// 由原始 dummy companies 动态计算，不再手写聚合结果。
export const dashboardMock = calculateDashboardData(dummyCompanies);
