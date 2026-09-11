import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

@Entity('ai_operation_audit')
@Index('IDX_ai_audit_owner', ['tenantId', 'userId', 'createdAt'])
@Index('IDX_ai_audit_resource', ['tenantId', 'resource', 'resourceId'])
export class AiOperationAudit {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tenant_id', length: 64 }) tenantId: string;
  @Column({ name: 'user_id', type: 'integer', nullable: true }) userId:
    number | null;
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;
  @Column({ name: 'actor_id', type: 'integer', nullable: true }) actorId:
    number | null;
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'actor_id' })
  actor: User | null;
  @Column({ length: 80 }) action: string;
  @Column({ length: 80 }) resource: string;
  @Column({ name: 'resource_id', type: 'uuid', nullable: true }) resourceId:
    string | null;
  @Column({ length: 20 }) outcome: string;
  @Column({ name: 'request_id', type: 'uuid' }) requestId: string;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) details: Record<
    string,
    unknown
  >;
  @Column({ name: 'correction', type: 'varchar', length: 1000, nullable: true })
  correction: string | null;
  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
