import { ForbiddenException } from '@nestjs/common';

export interface AiContext {
  userId: number;
  tenantId: string;
  isAdmin: boolean;
}

// Server-controlled membership, never sourced from request bodies or headers.
export function aiContext(userId: number): AiContext {
  const mappings = JSON.parse(process.env.AI_TENANT_USERS || '{}') as Record<
    string,
    unknown
  >;
  const mapped = mappings[String(userId)];
  if (Object.keys(mappings).length && typeof mapped !== 'string') {
    throw new ForbiddenException('No AI tenant membership configured');
  }
  const tenantId =
    typeof mapped === 'string'
      ? mapped
      : process.env.AI_DEFAULT_TENANT || 'default';
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(tenantId))
    throw new ForbiddenException('Invalid tenant configuration');
  const admins = (process.env.AI_ADMIN_USER_IDS || '')
    .split(',')
    .map((id) => Number(id.trim()));
  return { userId, tenantId, isAdmin: admins.includes(userId) };
}

export function requireAiAdmin(ctx: AiContext) {
  if (!ctx.isAdmin)
    throw new ForbiddenException('AI tenant administrator required');
}
