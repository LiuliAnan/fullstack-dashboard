import { Column, Entity, Index, Unique } from 'typeorm';
import { AiOwnedEntity } from './ai-owned.entity';

@Entity('ai_user_memory')
@Unique('UQ_ai_memory_key', ['tenantId', 'userId', 'kind', 'key'])
@Index('IDX_ai_memory_owner', ['tenantId', 'userId', 'updatedAt'])
export class AiUserMemory extends AiOwnedEntity {
  @Column({ length: 40 }) kind: string;
  @Column({ length: 120 }) key: string;
  @Column({ type: 'jsonb' }) value: Record<string, unknown>;
  @Column({ name: 'session_id', type: 'uuid', nullable: true }) sessionId:
    string | null;
  @Column({ default: 1 }) version: number;
  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date | null;
}
