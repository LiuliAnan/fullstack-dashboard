import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Company } from '../company/company.entity';
import { Relationship } from '../company/relationship.entity';
import { BarChartQueryDto } from './dto/bar-chart-query.dto';
import { BubbleChartQueryDto } from './dto/bubble-chart-query.dto';
import { CompanyBarChartFilterDto } from './dto/bar-chart-query.dto';

export type HierarchyNode = {
  name: string;
  code: string;
  level: number;
  country: string;
  city: string;
  foundedYear: number;
  annualRevenue: number;
  employees: number;
  value: number;
  matched: boolean;
  children: HierarchyNode[];
};

export type BubbleChartResponse = {
  total: number;
  hierarchy: HierarchyNode | { name: string; code: string; level: number; value: number; children: HierarchyNode[] };
};

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

  async getBarChartOptions() {
    const [countries, cities, ranges] = await Promise.all([
      this.companyRepository.createQueryBuilder('c').select('DISTINCT c.country', 'value').orderBy('c.country').getRawMany(),
      this.companyRepository.createQueryBuilder('c').select('DISTINCT c.city', 'value').orderBy('c.city').getRawMany(),
      this.companyRepository.createQueryBuilder('c')
        .select('MIN(c.founded_year)', 'foundedYearMin').addSelect('MAX(c.founded_year)', 'foundedYearMax')
        .addSelect('MIN(c.annual_revenue)', 'revenueMin').addSelect('MAX(c.annual_revenue)', 'revenueMax')
        .addSelect('MIN(c.employees)', 'employeesMin').addSelect('MAX(c.employees)', 'employeesMax').getRawOne(),
    ]);
    return {
      levels: [1, 2, 3, 4],
      countries: countries.map((row) => row.value),
      cities: cities.map((row) => row.value),
      ranges: {
        foundedYear: { min: Number(ranges.foundedYearMin), max: Number(ranges.foundedYearMax) },
        annualRevenue: { min: Number(ranges.revenueMin), max: Number(ranges.revenueMax) },
        employees: { min: Number(ranges.employeesMin), max: Number(ranges.employeesMax) },
      },
    };
  }

  async getCompaniesByFilter(dto: BarChartQueryDto) {
    const dimensionColumns = { level: 'c.level', country: 'c.country', city: 'c.city' } as const;
    const dimensionColumn = dimensionColumns[dto.dimension];
    const filter = dto.filter ?? {};
    this.validateRange(filter.founded_year?.start, filter.founded_year?.end, 'founded_year');
    this.validateRange(filter.annual_revenue?.min, filter.annual_revenue?.max, 'annual_revenue');
    this.validateRange(filter.employees?.min, filter.employees?.max, 'employees');

    const qb = this.applyCompanyFilters(this.companyRepository.createQueryBuilder('c'), filter);

    const rows = await qb.select(dimensionColumn, 'label').addSelect('COUNT(*)', 'count')
      .groupBy(dimensionColumn).orderBy('COUNT(*)', 'DESC').addOrderBy(dimensionColumn, 'ASC').getRawMany();
    const total = rows.reduce((sum, row) => sum + Number(row.count), 0);
    return {
      dimension: dto.dimension,
      total,
      data: rows.map((row) => ({ label: String(row.label), count: Number(row.count), percentage: total ? (Number(row.count) / total) * 100 : 0 })),
    };
  }

  async getCompanyHierarchy(dto: BubbleChartQueryDto): Promise<BubbleChartResponse> {
    const filter = dto.filter ?? {};
    this.validateRange(filter.founded_year?.start, filter.founded_year?.end, 'founded_year');
    this.validateRange(filter.annual_revenue?.min, filter.annual_revenue?.max, 'annual_revenue');
    this.validateRange(filter.employees?.min, filter.employees?.max, 'employees');

    const matchedCompanies = await this.applyCompanyFilters(
      this.companyRepository.createQueryBuilder('c'),
      filter,
    ).getMany();
    const matchedCodes = new Set(matchedCompanies.map((company) => company.company_code));

    if (!matchedCodes.size) {
      return {
        total: 0,
        hierarchy: { name: 'Company network', code: 'ROOT', level: 0, value: 0, children: [] },
      };
    }

    // Build from the complete network, then prune branches that contain no match.
    // This keeps the ancestor path of every matched company instead of promoting
    // filtered children to unrelated root bubbles.
    const rows = await this.companyRepository.createQueryBuilder('c')
      .leftJoin(Relationship, 'r', 'r.company_code = c.company_code')
      .addSelect('r.parent_company', 'parent_company')
      .getRawAndEntities();

    const parentByCode = new Map<string, string | null>();
    rows.raw.forEach((raw: { parent_company: string | null }, index) => {
      parentByCode.set(rows.entities[index].company_code, raw.parent_company);
    });
    const nodes = new Map<string, HierarchyNode>();
    rows.entities.forEach((company) => nodes.set(company.company_code, {
      name: company.company_name,
      code: company.company_code,
      level: company.level,
      country: company.country,
      city: company.city,
      foundedYear: company.founded_year,
      annualRevenue: company.annual_revenue,
      employees: company.employees,
      value: matchedCodes.has(company.company_code) ? 1 : 0,
      matched: matchedCodes.has(company.company_code),
      children: [],
    }));

    const roots: HierarchyNode[] = [];
    nodes.forEach((node, code) => {
      const parent = nodes.get(parentByCode.get(code) ?? '');
      if (parent && parent !== node) parent.children.push(node);
      else roots.push(node);
    });
    const sortTree = (node: HierarchyNode) => {
      node.children.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
      node.children.forEach(sortTree);
    };
    roots.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    roots.forEach(sortTree);
    const retainMatchedBranches = (node: HierarchyNode): boolean => {
      node.children = node.children.filter(retainMatchedBranches);
      return node.matched || node.children.length > 0;
    };
    const filteredRoots = roots.filter(retainMatchedBranches);

    return {
      total: matchedCodes.size,
      hierarchy: { name: 'Company network', code: 'ROOT', level: 0, value: 0, children: filteredRoots },
    };
  }

  private applyCompanyFilters(qb: SelectQueryBuilder<Company>, filter: CompanyBarChartFilterDto) {
    if (filter.level?.length) qb.andWhere('c.level IN (:...levels)', { levels: filter.level });
    if (filter.country?.length) qb.andWhere('c.country IN (:...countries)', { countries: filter.country });
    if (filter.city?.length) qb.andWhere('c.city IN (:...cities)', { cities: filter.city });
    if (filter.founded_year?.start !== undefined) qb.andWhere('c.founded_year >= :yearStart', { yearStart: filter.founded_year.start });
    if (filter.founded_year?.end !== undefined) qb.andWhere('c.founded_year <= :yearEnd', { yearEnd: filter.founded_year.end });
    if (filter.annual_revenue?.min !== undefined) qb.andWhere('c.annual_revenue >= :revenueMin', { revenueMin: filter.annual_revenue.min });
    if (filter.annual_revenue?.max !== undefined) qb.andWhere('c.annual_revenue <= :revenueMax', { revenueMax: filter.annual_revenue.max });
    if (filter.employees?.min !== undefined) qb.andWhere('c.employees >= :employeesMin', { employeesMin: filter.employees.min });
    if (filter.employees?.max !== undefined) qb.andWhere('c.employees <= :employeesMax', { employeesMax: filter.employees.max });
    return qb;
  }

  private validateRange(min: number | undefined, max: number | undefined, field: string) {
    if (min !== undefined && max !== undefined && min > max) {
      throw new BadRequestException(`${field} minimum must not exceed maximum`);
    }
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
