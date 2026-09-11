import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../user/user.entity';
import { AiChatMessage } from './ai-chat-message.entity';

@Entity('ai_chat_session')
@Index('IDX_ai_session_owner', ['tenantId', 'userId', 'updatedAt'])
@Index('UQ_ai_session_scope', ['id', 'tenantId', 'userId'], { unique: true })
@Check('CHK_ai_session_status', "status IN ('active','closed')")
export class AiChatSession {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tenant_id', length: 64 }) tenantId: string;
  @Column({ default: 1 }) version: number;
  @Column({ name: 'user_id' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  @Column({ length: 120, default: 'New conversation' }) title: string;
  @Column({ name: 'model_provider', length: 30, default: 'mock' })
  modelProvider: string;
  @Column({ name: 'model_name', type: 'varchar', length: 80, nullable: true })
  modelName: string | null;
  @Column({ length: 20, default: 'active' }) status: string;
  @OneToMany(() => AiChatMessage, (message) => message.session)
  messages: AiChatMessage[];
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
