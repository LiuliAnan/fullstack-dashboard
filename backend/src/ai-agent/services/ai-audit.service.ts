import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { AiOperationAudit } from '../entities/ai-operation-audit.entity';
import { AiContext, requireAiAdmin } from '../security/ai-context';
import { AiQueryDto, CreateAuditDto } from '../dto/records.dto';

function redact(value: unknown, depth = 0): unknown {
  if (depth > 8) return '[truncated]';
  if (Array.isArray(value))
    return value.slice(0, 100).map((item) => redact(item, depth + 1));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        /password|token|secret|api.?key|authorization|cookie|content|prompt|message/i.test(
          key,
        )
          ? '[redacted]'
          : redact(item, depth + 1),
      ]),
    );
  if (typeof value === 'string')
    return value.replace(/sk-[a-zA-Z0-9_-]+/g, '[redacted]').slice(0, 1000);
  return value;
}
@Injectable()
export class AiAuditService {
  constructor(private readonly db: DataSource) {}
  append(
    ctx: AiContext,
    dto: CreateAuditDto,
    manager: EntityManager = this.db.manager,
  ) {
    return manager.save(
      AiOperationAudit,
      manager.create(AiOperationAudit, {
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        actorId: ctx.userId,
        action: dto.action,
        resource: dto.resource,
        resourceId: dto.resourceId ?? null,
        outcome: dto.outcome,
        requestId: randomUUID(),
        details: redact(dto.details ?? {}) as Record<string, unknown>,
      }),
    );
  }
  async list(ctx: AiContext, query: AiQueryDto) {
    const qb = this.db
      .getRepository(AiOperationAudit)
      .createQueryBuilder('a')
      .where('a.tenant_id = :tenant', { tenant: ctx.tenantId });
    if (!ctx.isAdmin) qb.andWhere('a.user_id = :owner', { owner: ctx.userId });
    if (query.userId)
      qb.andWhere('a.user_id = :filter', { filter: query.userId });
    const [items, total] = await qb
      .orderBy('a.created_at', 'DESC')
      .addOrderBy('a.id', 'DESC')
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize)
      .getManyAndCount();
    return { items, total, page: query.page, pageSize: query.pageSize };
  }
  async get(ctx: AiContext, id: string, manager = this.db.manager) {
    const row = await manager.findOneBy(AiOperationAudit, {
      id,
      tenantId: ctx.tenantId,
      ...(!ctx.isAdmin ? { userId: ctx.userId } : {}),
    });
    if (!row) throw new NotFoundException('Audit record not found');
    return row;
  }
  async correct(ctx: AiContext, id: string, reason: string, remove = false) {
    requireAiAdmin(ctx);
    return this.db.transaction(async (manager) => {
      const row = await this.get(ctx, id, manager);
      const safeReason = String(redact(reason));
      await manager.update(
        AiOperationAudit,
        { id: row.id, tenantId: ctx.tenantId },
        remove ? { deletedAt: new Date() } : { correction: safeReason },
      );
      await this.append(
        ctx,
        {
          action: remove ? 'audit.soft_delete' : 'audit.correct',
          resource: 'audit',
          resourceId: id,
          outcome: 'success',
          details: { reason: safeReason, previousCorrection: row.correction },
        },
        manager,
      );
      return this.get(ctx, id, manager);
    });
  }
}
