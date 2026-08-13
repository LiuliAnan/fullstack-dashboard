import { Entity, PrimaryColumn, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Company } from './company.entity';

@Entity('relationship')
export class Relationship {
  @PrimaryColumn({ name: 'company_code' })
  company_code: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_code' })
  company: Company;

  @Column({ name: 'parent_company', type: 'varchar', nullable: true })
  parent_company: string | null;

  @ManyToOne(() => Company, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parent_company' })
  parent: Company | null;
}
