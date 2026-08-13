import { Entity, PrimaryColumn, Column, Check } from 'typeorm';

@Entity('company')
@Check('CHK_company_level', '"level" BETWEEN 1 AND 4')
@Check('CHK_company_founded_year', '"founded_year" BETWEEN 1800 AND 2100')
@Check('CHK_company_annual_revenue', '"annual_revenue" >= 0')
@Check('CHK_company_employees', '"employees" >= 0')
export class Company {
  @PrimaryColumn()
  company_code: string;

  @Column({ name: 'company_name' })
  company_name: string;

  @Column()
  level: number;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column({ name: 'founded_year' })
  founded_year: number;

  @Column({ name: 'annual_revenue' })
  annual_revenue: number;

  @Column()
  employees: number;
}
