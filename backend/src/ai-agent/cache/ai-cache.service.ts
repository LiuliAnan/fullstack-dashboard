import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createClient } from 'redis';
import { createHash, randomUUID } from 'node:crypto';
import { AiContext } from '../security/ai-context';

export const AI_CACHE_PREFIXES = {
  session: 'ai:session:',
  chat: 'ai:chat_cache:',
  llm: 'ai:llm_cache:',
  task: 'ai:task_state:',
} as const;
type Family = keyof typeof AI_CACHE_PREFIXES;
export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stableJson(v)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

@Injectable()
export class AiCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiCacheService.name);
  private readonly client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      connectTimeout: 1500,
      reconnectStrategy: (retries) => Math.min(250 * (retries + 1), 3000),
    },
    password: process.env.REDIS_PASSWORD || undefined,
    disableOfflineQueue: true,
  });
  private epoch = randomUUID();
  constructor() {
    // A reconnect invalidates all result-cache keys from this worker's previous connection.
    this.client.on('error', () => {
      this.epoch = randomUUID();
    });
    this.client.on('ready', () => {
      this.epoch = randomUUID();
    });
  }
  onModuleInit() {
    void this.client
      .connect()
      .catch(() =>
        this.logger.warn(
          'Redis unavailable; conversation history falls back to PostgreSQL',
        ),
      );
  }
  onModuleDestroy() {
    if (this.client.isOpen) this.client.destroy();
  }
  get ready() {
    return this.client.isReady;
  }
  key(family: Family, ctx: AiContext, resource: string) {
    return `${AI_CACHE_PREFIXES[family]}${ctx.tenantId}:${ctx.userId}:${resource}`;
  }
  hash(value: unknown) {
    return createHash('sha256').update(stableJson(value)).digest('hex');
  }
  ttl(name: 'SESSION' | 'CHAT' | 'TASK', fallback: number) {
    const value = Number(process.env[`AI_${name}_TTL_SECONDS`] || fallback);
    return Number.isInteger(value) && value > 0 && value <= 604800
      ? value
      : fallback;
  }
  private async optional<T>(fn: () => Promise<T>): Promise<T | undefined> {
    if (!this.ready) return undefined;
    try {
      return await fn();
    } catch {
      this.epoch = randomUUID();
      return undefined;
    }
  }
  async read<T>(key: string): Promise<T | undefined> {
    return this.optional(async () => {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : undefined;
    });
  }
  async write(key: string, value: unknown, ttl: number) {
    await this.optional(() =>
      this.client.set(key, JSON.stringify(value), { EX: ttl }),
    );
  }
  async remove(key: string) {
    await this.optional(() => this.client.del(key));
  }
  async invalidateBusiness(dimension: string) {
    // Business tables are shared by the current application; one version invalidates all tenant/user cache variants.
    await this.optional(() =>
      this.client.set(`ai:chat_cache:version:${dimension}`, randomUUID()),
    );
    this.epoch = randomUUID();
  }
  async resultKey(
    ctx: AiContext,
    dimension: string,
    input: unknown,
  ): Promise<string | undefined> {
    if (
      !this.ready ||
      process.env.AI_CHAT_CACHE_ENABLED === 'false' ||
      process.env[`AI_CACHE_${dimension.toUpperCase()}_ENABLED`] === 'false'
    )
      return undefined;
    const version = await this.optional(
      async () =>
        (await this.client.get(`ai:chat_cache:version:${dimension}`)) || '0',
    );
    if (version === undefined) return undefined;
    return this.key(
      'chat',
      ctx,
      `${dimension}:${this.hash({ input, version, epoch: this.epoch })}`,
    );
  }
  resultTtl(dimension: string) {
    const ttl = Number(
      process.env[`AI_CACHE_${dimension.toUpperCase()}_TTL_SECONDS`],
    );
    return Number.isInteger(ttl) && ttl > 0 && ttl <= 604800
      ? ttl
      : this.ttl('CHAT', 600);
  }
  // Required state cannot silently succeed when Redis is down. CAS protects concurrent checkpoint writes.
  async mutate<T, R>(
    key: string,
    ttl: number,
    fn: (value: T | undefined) => Promise<{ value: T; result: R }>,
  ): Promise<R> {
    if (!this.ready)
      throw new ServiceUnavailableException('Task state store unavailable');
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const old = await this.client.get(key);
        const next = await fn(old ? (JSON.parse(old) as T) : undefined);
        const encoded = JSON.stringify(next.value);
        if (Buffer.byteLength(encoded) > 4 * 1024 * 1024)
          throw new ServiceUnavailableException(
            'Task state exceeds 4 MiB limit',
          );
        const changed = await this.client.eval(
          "local v=redis.call('GET',KEYS[1]); if (not v and ARGV[1]=='__missing__') or v==ARGV[1] then redis.call('SET',KEYS[1],ARGV[2],'EX',ARGV[3]); return 1 end; return 0",
          {
            keys: [key],
            arguments: [old ?? '__missing__', encoded, String(ttl)],
          },
        );
        if (changed === 1) return next.result;
      }
      throw new Error('Concurrent state updates');
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Task state store unavailable or busy',
      );
    }
  }
  async requiredRead<T>(key: string): Promise<T | undefined> {
    if (!this.ready)
      throw new ServiceUnavailableException('Task state store unavailable');
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : undefined;
    } catch {
      throw new ServiceUnavailableException('Task state store unavailable');
    }
  }
  async requiredRemove(key: string) {
    if (!this.ready)
      throw new ServiceUnavailableException('Task state store unavailable');
    try {
      await this.client.del(key);
    } catch {
      throw new ServiceUnavailableException('Task state store unavailable');
    }
  }
}
