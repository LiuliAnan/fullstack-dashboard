import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiChatSession } from '../entities/ai-chat-session.entity';
import { AiChatMessage } from '../entities/ai-chat-message.entity';
import { CreateSessionDto } from '../dto/create-session.dto';

@Injectable()
export class AiSessionService {
  constructor(
    @InjectRepository(AiChatSession)
    private readonly sessions: Repository<AiChatSession>,
    @InjectRepository(AiChatMessage)
    private readonly messages: Repository<AiChatMessage>,
  ) {}

  create(userId: number, dto: CreateSessionDto) {
    return this.sessions.save(
      this.sessions.create({
        userId,
        title: dto.title?.trim() || 'New conversation',
        modelProvider: dto.provider || process.env.AI_MODEL_PROVIDER || 'mock',
        modelName: dto.model || null,
      }),
    );
  }

  list(userId: number) {
    return this.sessions.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async getOwned(sessionId: string, userId: number, includeMessages = false) {
    const session = await this.sessions.findOne({
      where: { id: sessionId },
      relations: includeMessages ? { messages: true } : undefined,
      order: includeMessages ? { messages: { createdAt: 'ASC' } } : undefined,
    });
    if (!session) throw new NotFoundException('Chat session not found');
    if (session.userId !== userId)
      throw new ForbiddenException('This chat session belongs to another user');
    return session;
  }

  async remove(sessionId: string, userId: number) {
    const session = await this.getOwned(sessionId, userId);
    await this.sessions.remove(session);
    return { deleted: true };
  }

  async addMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: { text: string },
    attachments: Array<Record<string, unknown>> = [],
  ) {
    const message = await this.messages.save(
      this.messages.create({
        sessionId,
        role,
        messageType: 'text',
        content,
        attachments,
      }),
    );
    await this.sessions.update(sessionId, { updatedAt: new Date() });
    return message;
  }
}
