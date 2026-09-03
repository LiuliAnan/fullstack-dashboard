import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AiChatSession } from './ai-chat-session.entity';

@Entity('ai_chat_messages')
export class AiChatMessage {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'session_id' }) sessionId: string;
  @ManyToOne(() => AiChatSession, (session) => session.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'session_id' })
  session: AiChatSession;
  @Column({ length: 20 }) role: 'user' | 'assistant' | 'system';
  @Column({ name: 'message_type', length: 30, default: 'text' })
  messageType: string;
  @Column({ type: 'jsonb' }) content: { text?: string; [key: string]: unknown };
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" }) attachments: Array<
    Record<string, unknown>
  >;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
