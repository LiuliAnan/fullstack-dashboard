import { Check, Column, Entity, Index } from 'typeorm';
import { AiOwnedEntity } from './ai-owned.entity';

@Entity('ai_task_record')
@Index('IDX_ai_task_owner', ['tenantId', 'userId', 'status', 'createdAt'])
@Check('CHK_ai_task_progress', 'progress BETWEEN 0 AND 100')
@Check(
  'CHK_ai_task_status',
  "status IN ('pending','running','completed','failed','cancelled')",
)
export class AiTaskRecord extends AiOwnedEntity {
  @Column({ name: 'session_id', type: 'uuid', nullable: true }) sessionId:
    string | null;
  @Column({ length: 80 }) type: string;
  @Column({ length: 20, default: 'pending' }) status: string;
  @Column({ default: 0 }) progress: number;
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" }) input: Record<
    string,
    unknown
  >;
  @Column({ type: 'jsonb', nullable: true }) result: Record<
    string,
    unknown
  > | null;
  @Column({
    name: 'error_summary',
    type: 'varchar',
    length: 1000,
    nullable: true,
  })
  errorSummary: string | null;
  @Column({ default: 1 }) version: number;
  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;
  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt: Date | null;
}
