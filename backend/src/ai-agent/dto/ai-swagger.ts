import { ApiResponse } from '@nestjs/swagger';

type Kind = 'session' | 'memory' | 'task' | 'audit' | 'deleted' | 'state';
export function AiRecordResponse(kind: Kind, paged = false, status = 200) {
  const uuid = { type: 'string' as const, format: 'uuid' };
  const date = { type: 'string' as const, format: 'date-time' };
  const object = { type: 'object' as const, additionalProperties: true };
  const common = {
    id: uuid,
    tenantId: { type: 'string' as const },
    userId: { type: 'integer' as const },
    createdAt: date,
    updatedAt: date,
  };
  const fields = {
    session: {
      ...common,
      title: { type: 'string' as const },
      modelProvider: { type: 'string' as const },
      modelName: { type: 'string' as const, nullable: true },
      status: { type: 'string' as const, enum: ['active', 'closed'] },
      version: { type: 'integer' as const },
      messages: { type: 'array' as const, items: object },
    },
    memory: {
      ...common,
      kind: { type: 'string' as const },
      key: { type: 'string' as const },
      value: object,
      sessionId: { ...uuid, nullable: true },
      expiresAt: { ...date, nullable: true },
      version: { type: 'integer' as const },
    },
    task: {
      ...common,
      sessionId: { ...uuid, nullable: true },
      type: { type: 'string' as const },
      status: {
        type: 'string' as const,
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
      },
      progress: { type: 'integer' as const, minimum: 0, maximum: 100 },
      input: object,
      result: { ...object, nullable: true },
      errorSummary: { type: 'string' as const, nullable: true },
      version: { type: 'integer' as const },
      startedAt: { ...date, nullable: true },
      finishedAt: { ...date, nullable: true },
    },
    audit: {
      id: uuid,
      tenantId: { type: 'string' as const },
      userId: { type: 'integer' as const, nullable: true },
      actorId: { type: 'integer' as const, nullable: true },
      action: { type: 'string' as const },
      resource: { type: 'string' as const },
      resourceId: { ...uuid, nullable: true },
      outcome: { type: 'string' as const, enum: ['success', 'failure'] },
      requestId: uuid,
      details: object,
      correction: { type: 'string' as const, nullable: true },
      deletedAt: { ...date, nullable: true },
      createdAt: date,
    },
    deleted: { deleted: { type: 'boolean' as const } },
    state: {
      taskId: uuid,
      state: { ...object, nullable: true },
      updatedAt: date,
      expired: { type: 'boolean' as const },
    },
  };
  const item = { type: 'object' as const, properties: fields[kind] };
  return ApiResponse({
    status,
    description: paged
      ? 'Scoped paginated records'
      : 'Authorized record/result',
    schema: paged
      ? {
          type: 'object',
          required: ['items', 'total', 'page', 'pageSize'],
          properties: {
            items: { type: 'array', items: item },
            total: { type: 'integer' },
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
          },
        }
      : item,
  });
}
