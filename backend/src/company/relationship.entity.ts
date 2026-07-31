import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('relationship')
export class Relationship {
  @PrimaryColumn({ name: 'company_code' })
  company_code: string;

  @Column({ name: 'parent_company', type: 'varchar', nullable: true })
  parent_company: string | null;
}