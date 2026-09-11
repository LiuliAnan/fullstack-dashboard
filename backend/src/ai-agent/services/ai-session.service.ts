import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AiChatSession } from '../entities/ai-chat-session.entity';
import { AiChatMessage } from '../entities/ai-chat-message.entity';
import { CreateSessionDto } from '../dto/create-session.dto';
import { AiQueryDto, UpdateSessionDto } from '../dto/records.dto';
import { aiContext } from '../security/ai-context';
import { AiCacheService } from '../cache/ai-cache.service';
import { AiAuditService } from './ai-audit.service';

@Injectable()
export class AiSessionService {
  constructor(
    private readonly db: DataSource,
    private readonly cache: AiCacheService,
    private readonly audit: AiAuditService,
  ) {}
  create(userId: number, dto: CreateSessionDto) {
    const ctx = aiContext(userId);
    return this.db.transaction(async (manager) => {
      const row = await manager.save(
        AiChatSession,
        manager.create(AiChatSession, {
          userId,
          tenantId: ctx.tenantId,
          title: dto.title?.trim() || 'New conversation',
          modelProvider:
            dto.provider || process.env.AI_MODEL_PROVIDER || 'mock',
          modelName: dto.model || null,
        }),
      );
      await this.audit.append(
        ctx,
        {
          action: 'session.create',
          resource: 'session',
          resourceId: row.id,
          outcome: 'success',
        },
        manager,
      );
      return row;
    });
  }
  async list(userId: number, query = new AiQueryDto()) {
    const ctx = aiContext(userId);
    if (query.userId && query.userId !== userId)
      return {
        items: [],
        total: 0,
        page: query.page,
        pageSize: query.pageSize,
      };
    const [items, total] = await this.db
      .getRepository(AiChatSession)
      .findAndCount({
        where: { userId, tenantId: ctx.tenantId },
        order: { updatedAt: 'DESC', id: 'DESC' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      });
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async getOwned(
    id: string,
    userId: number,
    includeMessages = false,
    manager = this.db.manager,
  ) {
    const ctx = aiContext(userId);
    const row = await manager.findOne(AiChatSession, {
      where: { id, userId, tenantId: ctx.tenantId },
      relations: includeMessages ? { messages: true } : undefined,
      order: includeMessages
        ? { messages: { createdAt: 'ASC', id: 'ASC' } }
        : undefined,
    });
    if (!row) throw new NotFoundException('Chat session not found');
    return row;
  }
  async locked<T>(
    id: string,
    userId: number,
    fn: (session: AiChatSession, manager: EntityManager) => Promise<T>,
  ) {
    return this.db
      .transaction(async (manager) => {
        await manager.query("SET LOCAL lock_timeout = '5s'");
        // Serializes send/update/close/delete across workers, including Redis outages.
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [`ai-session:${aiContext(userId).tenantId}:${userId}:${id}`],
        );
        return fn(await this.getOwned(id, userId, false, manager), manager);
      })
      .catch((error: unknown) => {
        if ((error as { code?: string }).code === '55P03')
          throw new ConflictException(
            'Session is busy; retry after the current message completes',
          );
        throw error;
      });
  }
  update(id: string, userId: number, dto: UpdateSessionDto) {
    return this.locked(id, userId, async (session, manager) => {
      if (dto.title !== undefined && !dto.title.trim())
        throw new BadRequestException('Title cannot be blank');
      if (dto.title !== undefined) session.title = dto.title.trim();
      if (dto.provider !== undefined) {
        session.modelProvider = dto.provider;
        session.modelName = dto.model ?? null;
      }
      if (dto.model !== undefined) session.modelName = dto.model;
      if (dto.status !== undefined) session.status = dto.status;
      session.version++;
      await manager.save(session);
      const ctx = aiContext(userId);
      await this.cache.remove(this.cache.key('session', ctx, id));
      await this.audit.append(
        ctx,
        {
          action: 'session.update',
          resource: 'session',
          resourceId: id,
          outcome: 'success',
          details: { status: session.status },
        },
        manager,
      );
      return session;
    });
  }
  remove(id: string, userId: number) {
    return this.locked(id, userId, async (session, manager) => {
      const ctx = aiContext(userId);
      await manager.remove(session);
      await this.cache.remove(this.cache.key('session', ctx, id));
      await this.audit.append(
        ctx,
        {
          action: 'session.delete',
          resource: 'session',
          resourceId: id,
          outcome: 'success',
        },
        manager,
      );
      return { deleted: true };
    });
  }
  async recentMessages(id: string, manager: EntityManager) {
    const rows = await manager.find(AiChatMessage, {
      where: { sessionId: id },
      order: { createdAt: 'DESC', id: 'DESC' },
      take: 20,
    });
    return rows.reverse().map((row) => ({
      role: row.role,
      content: String(row.content.text ?? ''),
    }));
  }
}
