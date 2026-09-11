import {
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/user.entity';

export abstract class AiOwnedEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'tenant_id', length: 64 }) tenantId: string;
  @Column({ name: 'user_id' }) userId: number;
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
