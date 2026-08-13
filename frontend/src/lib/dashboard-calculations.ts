import type { Company, DashboardData, DashboardStats, FoundedTrendItem, LevelDistributionItem } from '@/types/api';

export function calculateDashboardStats(companies: Company[]): DashboardStats {
  return {
    companyCount: companies.length,
    totalRevenue: companies.reduce((sum, company) => sum + company.annual_revenue, 0),
    countryCount: new Set(companies.map((company) => company.country)).size,
    employeeCount: companies.reduce((sum, company) => sum + company.employees, 0),
  };
}

export function calculateLevelDistribution(
  companies: Company[],
): LevelDistributionItem[] {
  const counts = new Map<number, number>();
  for (const company of companies) {
    counts.set(company.level, (counts.get(company.level) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([level, count]) => ({
      level,
      count,
      percentage: companies.length > 0 ? (count / companies.length) * 100 : 0,
    }));
}

export function calculateFoundedTrend(companies: Company[]): FoundedTrendItem[] {
  const counts = new Map<number, number>();
  for (const company of companies) {
    counts.set(
      company.founded_year,
      (counts.get(company.founded_year) ?? 0) + 1,
    );
  }

  let cumulative = 0;
  return [...counts.entries()]
    .sort(([left], [right]) => left - right)
    .map(([year, count]) => {
      cumulative += count;
      return { year, cumulative };
    });
}

export function calculateDashboardData(companies: Company[]): DashboardData {
  return {
    stats: calculateDashboardStats(companies),
    levelDistribution: calculateLevelDistribution(companies),
    foundedTrend: calculateFoundedTrend(companies),
  };
}
