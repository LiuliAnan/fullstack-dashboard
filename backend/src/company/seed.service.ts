import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { Company } from './company.entity';
import { Relationship } from './relationship.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Relationship)
    private relationshipRepository: Repository<Relationship>,
  ) {}

  // 应用启动时自动执行
  async onModuleInit() {
    const count = await this.companyRepository.count();
    if (count > 0) {
      this.logger.log(`Company table already has ${count} records, skipping seed.`);
      return;
    }
    await this.seedCompanies();
    await this.seedRelationships();
  }

  private async seedCompanies() {
    const filePath = path.join(process.cwd(), 'data', 'companies_0708.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    const companies = records.map((r: any) => ({
      company_code: r.company_code,
      company_name: r.company_name,
      level: Number(r.level),
      country: r.country,
      city: r.city,
      founded_year: Number(r.founded_year),
      annual_revenue: Number(r.annual_revenue),
      employees: Number(r.employees),
    }));

    await this.companyRepository.save(companies);
    this.logger.log(`Seeded ${companies.length} companies.`);
  }

  private async seedRelationships() {
    const filePath = path.join(process.cwd(), 'data', 'relationships_0708.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
    });

    const relationships = records.map((r: any) => ({
      company_code: r.company_code,
      parent_company: r.parent_company || null,
    }));

    await this.relationshipRepository.save(relationships);
    this.logger.log(`Seeded ${relationships.length} relationships.`);
  }
}