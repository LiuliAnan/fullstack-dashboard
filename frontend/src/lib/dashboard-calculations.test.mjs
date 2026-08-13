import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDashboardData,
  calculateFoundedTrend,
} from './dashboard-calculations.ts';

const companies = [
  { company_code: 'A', company_name: 'A', level: 1, country: 'China', city: 'A', founded_year: 2000, annual_revenue: 100, employees: 10, parent_company: null },
  { company_code: 'B', company_name: 'B', level: 2, country: 'China', city: 'B', founded_year: 2001, annual_revenue: 200, employees: 20, parent_company: 'A' },
  { company_code: 'C', company_name: 'C', level: 2, country: 'Japan', city: 'C', founded_year: 2001, annual_revenue: 300, employees: 30, parent_company: 'A' },
  { company_code: 'D', company_name: 'D', level: 2, country: 'Japan', city: 'D', founded_year: 2001, annual_revenue: 400, employees: 40, parent_company: 'A' },
];

test('calculates cards and unique countries from raw companies', () => {
  const result = calculateDashboardData(companies);
  assert.deepEqual(result.stats, {
    companyCount: 4,
    totalRevenue: 1000,
    countryCount: 2,
    employeeCount: 100,
  });
});

test('calculates level counts and percentages', () => {
  const result = calculateDashboardData(companies);
  assert.deepEqual(result.levelDistribution, [
    { level: 1, count: 1, percentage: 25 },
    { level: 2, count: 3, percentage: 75 },
  ]);
});

test('calculates cumulative companies by founded year', () => {
  assert.deepEqual(calculateFoundedTrend(companies), [
    { year: 2000, cumulative: 1 },
    { year: 2001, cumulative: 4 },
  ]);
});

test('returns empty dashboard data for an empty company list', () => {
  assert.deepEqual(calculateDashboardData([]), {
    stats: { companyCount: 0, totalRevenue: 0, countryCount: 0, employeeCount: 0 },
    levelDistribution: [],
    foundedTrend: [],
  });
});
