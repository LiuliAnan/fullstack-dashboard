import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../company/company.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async getDashboard() {
    const [stats, levelDistribution, foundedTrend] = await Promise.all([
      this.getStats(),
      this.getLevelDistribution(),
      this.getFoundedTrend(),
    ]);
    return { stats, levelDistribution, foundedTrend };
  }

  // 数据卡：4 个汇总指标
  private async getStats() {
    const result = await this.companyRepository
      .createQueryBuilder('c')
      .select('COUNT(*)', 'company_count')
      .addSelect('COALESCE(SUM(c.annual_revenue), 0)', 'total_revenue')
      .addSelect('COUNT(DISTINCT c.country)', 'country_count')
      .addSelect('COALESCE(SUM(c.employees), 0)', 'employee_count')
      .getRawOne();

    return {
      companyCount: Number(result.company_count),
      totalRevenue: Number(result.total_revenue),
      countryCount: Number(result.country_count),
      employeeCount: Number(result.employee_count),
    };
  }

  // 环形图：各 level 公司数量和占比
  private async getLevelDistribution() {
    const rows = await this.companyRepository
      .createQueryBuilder('c')
      .select('c.level', 'level')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.level')
      .orderBy('c.level')
      .getRawMany();

    const total = rows.reduce((sum, r) => sum + Number(r.count), 0);

    return rows.map((r) => ({
      level: Number(r.level),
      count: Number(r.count),
      percentage: total > 0 ? (Number(r.count) / total) * 100 : 0,
    }));
  }

  // 折线图：按成立年份的累积公司数
  private async getFoundedTrend() {
    const rows = await this.companyRepository
      .createQueryBuilder('c')
      .select('c.founded_year', 'year')
      .addSelect('COUNT(*)', 'count')
      .groupBy('c.founded_year')
      .orderBy('c.founded_year')
      .getRawMany();

    // 计算累积：遍历年份，累加 count
    let cumulative = 0;
    return rows.map((r) => {
      cumulative += Number(r.count);
      return {
        year: Number(r.year),
        cumulative,
      };
    });
  }
}