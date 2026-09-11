import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AiUserMemory } from '../entities/ai-user-memory.entity';
import { AiTaskRecord } from '../entities/ai-task-record.entity';
import { AiContext } from '../security/ai-context';
import {
  AiQueryDto,
  CreateMemoryDto,
  UpdateMemoryDto,
  CreateTaskDto,
  UpdateTaskDto,
  TaskStateDto,
} from '../dto/records.dto';
import { AiSessionService } from './ai-session.service';
import { AiAuditService } from './ai-audit.service';
import { AiCacheService } from '../cache/ai-cache.service';

@Injectable()
export class AiRecordsService {
  constructor(
    private readonly db: DataSource,
    private readonly sessions: AiSessionService,
    private readonly audit: AiAuditService,
    private readonly cache: AiCacheService,
  ) {}
  async list(ctx: AiContext, kind: 'memory' | 'task', query: AiQueryDto) {
    const qb = this.db
      .getRepository(kind === 'memory' ? AiUserMemory : AiTaskRecord)
      .createQueryBuilder('r')
      .where('r.tenant_id = :tenant AND r.user_id = :owner', {
        tenant: ctx.tenantId,
        owner: ctx.userId,
      });
    if (query.userId)
      qb.andWhere('r.user_id = :filter', { filter: query.userId });
    if (kind === 'memory')
      qb.andWhere('(r.expires_at IS NULL OR r.expires_at > CURRENT_TIMESTAMP)');
    const [items, total] = await qb
      .orderBy('r.updated_at', 'DESC')
      .addOrderBy('r.id', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async memory(ctx: AiContext, id: string, manager = this.db.manager) {
    const row = await manager.findOneBy(AiUserMemory, {
      id,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
    if (!row) throw new NotFoundException('Memory not found');
    return row;
  }
  async task(ctx: AiContext, id: string, manager = this.db.manager) {
    const row = await manager.findOneBy(AiTaskRecord, {
      id,
      tenantId: ctx.tenantId,
      userId: ctx.userId,
    });
    if (!row) throw new NotFoundException('Task not found');
    return row;
  }
  private async session(
    ctx: AiContext,
    id: string | undefined,
    manager: EntityManager,
  ) {
    if (id) await this.sessions.getOwned(id, ctx.userId, false, manager);
  }
  private async event(
    ctx: AiContext,
    action: string,
    resource: string,
    id: string,
    manager: EntityManager,
  ) {
    await this.audit.append(
      ctx,
      { action, resource, resourceId: id, outcome: 'success' },
      manager,
    );
  }
  async saveMemory(
    ctx: AiContext,
    dto: CreateMemoryDto | UpdateMemoryDto,
    id?: string,
  ) {
    try {
      return await this.db.transaction(async (manager) => {
        await this.session(ctx, dto.sessionId, manager);
        if (id)
          await manager.query(
            'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
            [`ai-memory:${id}`],
          );
        const row = id
          ? await this.memory(ctx, id, manager)
          : manager.create(AiUserMemory, {
              userId: ctx.userId,
              tenantId: ctx.tenantId,
            });
        const { expiresAt, ...fields } = dto;
        Object.assign(row, fields);
        if (expiresAt !== undefined) row.expiresAt = new Date(expiresAt);
        if (id) row.version++;
        const saved = await manager.save(row);
        await this.event(
          ctx,
          id ? 'memory.update' : 'memory.create',
          'memory',
          saved.id,
          manager,
        );
        return saved;
      });
    } catch (error) {
      if ((error as { code?: string }).code === '23505')
        throw new ConflictException('Memory key already exists');
      throw error;
    }
  }
  saveTask(ctx: AiContext, dto: CreateTaskDto | UpdateTaskDto, id?: string) {
    return this.db.transaction(async (manager) => {
      await this.session(ctx, dto.sessionId, manager);
      if (id)
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [`ai-task:${id}`],
        );
      const row = id
        ? await this.task(ctx, id, manager)
        : manager.create(AiTaskRecord, {
            userId: ctx.userId,
            tenantId: ctx.tenantId,
          });
      const update = dto as UpdateTaskDto;
      if (id && update.status && update.status !== row.status) {
        const transitions: Record<string, string[]> = {
          pending: ['running', 'cancelled', 'failed'],
          running: ['completed', 'failed', 'cancelled'],
          completed: [],
          failed: [],
          cancelled: [],
        };
        if (!transitions[row.status]?.includes(update.status))
          throw new BadRequestException('Invalid task status transition');
      }
      Object.assign(row, dto);
      if (update.status === 'running' && !row.startedAt)
        row.startedAt = new Date();
      if (
        update.status &&
        ['completed', 'failed', 'cancelled'].includes(update.status)
      )
        row.finishedAt = new Date();
      if (row.status === 'completed') row.progress = 100;
      if (id) row.version++;
      const saved = await manager.save(row);
      await this.event(
        ctx,
        id ? 'task.update' : 'task.create',
        'task',
        saved.id,
        manager,
      );
      return saved;
    });
  }
  remove(ctx: AiContext, kind: 'memory' | 'task', id: string) {
    return this.db.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`ai-${kind}:${id}`],
      );
      const row =
        kind === 'memory'
          ? await this.memory(ctx, id, manager)
          : await this.task(ctx, id, manager);
      await manager.remove(row);
      if (kind === 'task') {
        await this.cache.remove(this.cache.key('task', ctx, `${id}:state`));
        await this.cache.remove(
          this.cache.key('task', ctx, `${id}:checkpoints`),
        );
      }
      await this.event(ctx, `${kind}.delete`, kind, id, manager);
      return { deleted: true };
    });
  }
  async state(ctx: AiContext, id: string, dto?: TaskStateDto) {
    return this.db.transaction(async (manager) => {
      await manager.query(
        'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
        [`ai-task:${id}`],
      );
      await this.task(ctx, id, manager);
      const key = this.cache.key('task', ctx, `${id}:state`);
      if (dto) {
        const ttl = dto.ttlSeconds ?? this.cache.ttl('TASK', 7200);
        await this.cache.mutate(key, ttl, () =>
          Promise.resolve({
            value: { state: dto.state, updatedAt: new Date().toISOString() },
            result: undefined,
          }),
        );
        await this.event(ctx, 'task.state.update', 'task', id, manager);
      }
      return {
        taskId: id,
        ...((await this.cache.requiredRead<{
          state: Record<string, unknown>;
          updatedAt: string;
        }>(key)) ?? { state: null, expired: true }),
      };
    });
  }
}
