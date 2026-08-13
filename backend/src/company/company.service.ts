import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Company } from './company.entity';
import { Relationship } from './relationship.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyQueryDto } from './dto/company-query.dto';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Relationship)
    private relationshipRepository: Repository<Relationship>,
    private dataSource: DataSource,
  ) {}

  // 公共查询构造器：联表 company + relationship + 父公司，选出所有字段
  private companyBaseQuery() {
    return this.companyRepository
      .createQueryBuilder('c')
      .leftJoin('relationship', 'r', 'r.company_code = c.company_code')
      .leftJoin('company', 'p', 'p.company_code = r.parent_company')
      .select([
        'c.company_code AS company_code',
        'c.company_name AS company_name',
        'c.level AS level',
        'c.country AS country',
        'c.city AS city',
        'c.founded_year AS founded_year',
        'c.annual_revenue AS annual_revenue',
        'c.employees AS employees',
        'r.parent_company AS parent_company',
        'p.company_name AS parent_company_name',
      ]);
  }

  // 计算盈利效率 = annual_revenue / employees
  private withProfitEfficiency(company: any) {
    return {
      ...company,
      profit_efficiency:
        company.employees > 0
          ? Math.round(company.annual_revenue / company.employees)
          : 0,
    };
  }

  // 列表查询：支持 level 过滤和 name 搜索，计算盈利效率
  async findAll(query: CompanyQueryDto) {
    const qb = this.companyBaseQuery();

    // level 多选过滤（逗号分隔，如 ?level=1,2）
    if (query.level) {
      const levels = query.level
        .split(',')
        .filter(Boolean)
        .map(Number);
      if (levels.length > 0) {
        qb.andWhere('c.level IN (:...levels)', { levels });
      }
    }

    // 公司名搜索（模糊匹配）
    if (query.search) {
      qb.andWhere('c.company_name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const total = await qb.getCount();
    const companies = await qb
      .orderBy('c.company_code', 'ASC')
      .offset((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .getRawMany();

    return {
      items: companies.map((company) => this.withProfitEfficiency(company)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  // 查询单个公司（联表，含盈利效率）
  async findOne(company_code: string) {
    const result = await this.companyBaseQuery()
      .where('c.company_code = :code', { code: company_code })
      .getRawOne();

    if (!result) {
      throw new NotFoundException('Company not found');
    }

    return this.withProfitEfficiency(result);
  }

  // 创建公司 + 关系（事务）
  async createCompany(dto: CreateCompanyDto) {
    const existing = await this.companyRepository.findOne({
      where: { company_code: dto.company_code },
    });
    if (existing) {
      throw new ConflictException('Company code already exists');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. 建公司
      const company = manager.create(Company, {
        company_code: dto.company_code,
        company_name: dto.company_name,
        level: dto.level,
        country: dto.country,
        city: dto.city,
        founded_year: dto.founded_year,
        annual_revenue: dto.annual_revenue,
        employees: dto.employees,
      });
      await manager.save(company);

      // 2. 建关系（parent_company 没传则为 null，即顶级公司）
      const relationship = manager.create(Relationship, {
        company_code: dto.company_code,
        parent_company: dto.parent_company || null,
      });
      await manager.save(relationship);

      return {
        ...company,
        parent_company: dto.parent_company || null,
      };
    });
  }

  // 更新公司（分别更新 company 和 relationship 表）
  async updateCompany(company_code: string, dto: UpdateCompanyDto) {
    const company = await this.companyRepository.findOne({
      where: { company_code },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // 更新 company 表字段
    if (dto.company_name !== undefined) company.company_name = dto.company_name;
    if (dto.level !== undefined) company.level = dto.level;
    if (dto.country !== undefined) company.country = dto.country;
    if (dto.city !== undefined) company.city = dto.city;
    if (dto.founded_year !== undefined) company.founded_year = dto.founded_year;
    if (dto.annual_revenue !== undefined)
      company.annual_revenue = dto.annual_revenue;
    if (dto.employees !== undefined) company.employees = dto.employees;
    await this.companyRepository.save(company);

    // 更新 relationship 表的 parent_company
    if (dto.parent_company !== undefined) {
      const relationship = await this.relationshipRepository.findOne({
        where: { company_code },
      });
      if (relationship) {
        relationship.parent_company = dto.parent_company || null;
        await this.relationshipRepository.save(relationship);
      } else {
        // 没有关系记录则新建
        const newRel = this.relationshipRepository.create({
          company_code,
          parent_company: dto.parent_company || null,
        });
        await this.relationshipRepository.save(newRel);
      }
    }

    return this.findOne(company_code);
  }

  // 删除公司（先删关系再删公司）
  async removeCompany(company_code: string) {
    const company = await this.companyRepository.findOne({
      where: { company_code },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    await this.relationshipRepository.delete({ company_code });
    await this.companyRepository.delete({ company_code });
    return { company_code };
  }
}
