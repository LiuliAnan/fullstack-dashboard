import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('company')
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