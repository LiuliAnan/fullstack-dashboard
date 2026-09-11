import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BaseCheckpointSaver,
  MemorySaver,
  type Checkpoint,
  type CheckpointMetadata,
  type CheckpointTuple,
  type CheckpointListOptions,
  type PendingWrite,
} from '@langchain/langgraph-checkpoint';
import type { RunnableConfig } from '@langchain/core/runnables';
import { DataSource } from 'typeorm';
import { AiCacheService } from './ai-cache.service';
import { AiContext } from '../security/ai-context';
import { AiRecordsService } from '../services/ai-records.service';

// Delegate serialization and checkpoint semantics to the official MemorySaver,
// persisting its serialized state atomically in Redis after each mutation.
type Snapshot = string;
function restore(snapshot?: Snapshot) {
  const saver = new MemorySaver();
  if (snapshot) {
    const data = JSON.parse(snapshot, (_key, value: unknown) => {
      if (value && typeof value === 'object' && '__aiBytes' in value)
        return new Uint8Array(Buffer.from(String(value.__aiBytes), 'base64'));
      return value;
    }) as Pick<MemorySaver, 'storage' | 'writes'>;
    saver.storage = data.storage;
    saver.writes = data.writes;
  }
  return saver;
}
function snapshot(saver: MemorySaver): Snapshot {
  return JSON.stringify(
    { storage: saver.storage, writes: saver.writes },
    (_key, value: unknown) =>
      value instanceof Uint8Array
        ? { __aiBytes: Buffer.from(value).toString('base64') }
        : value,
  );
}
export class AiRedisCheckpointer extends BaseCheckpointSaver {
  constructor(
    private readonly cache: AiCacheService,
    private readonly key: string,
    private readonly threadId: string,
    private readonly scoped: <T>(fn: () => Promise<T>) => Promise<T>,
  ) {
    super();
  }
  private validate(config: RunnableConfig) {
    if (config.configurable?.thread_id !== this.threadId)
      throw new BadRequestException(
        'Checkpointer is bound to one authorized task',
      );
  }
  private async read<T>(
    config: RunnableConfig,
    fn: (saver: MemorySaver) => Promise<T>,
  ) {
    this.validate(config);
    return this.scoped(async () =>
      fn(restore(await this.cache.requiredRead<Snapshot>(this.key))),
    );
  }
  private async change<T>(
    config: RunnableConfig,
    fn: (saver: MemorySaver) => Promise<T>,
  ) {
    this.validate(config);
    return this.scoped(() =>
      this.cache.mutate<Snapshot, T>(
        this.key,
        this.cache.ttl('TASK', 7200),
        async (old) => {
          const saver = restore(old);
          const result = await fn(saver);
          return { value: snapshot(saver), result };
        },
      ),
    );
  }
  getTuple(config: RunnableConfig): Promise<CheckpointTuple | undefined> {
    return this.read(config, (saver) => saver.getTuple(config));
  }
  async *list(
    config: RunnableConfig,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    const tuples = await this.read(config, async (saver) => {
      const items: CheckpointTuple[] = [];
      for await (const item of saver.list(config, options)) items.push(item);
      return items;
    });
    yield* tuples;
  }
  put(
    config: RunnableConfig,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
  ): Promise<RunnableConfig> {
    return this.change(config, (saver) =>
      saver.put(config, checkpoint, metadata),
    );
  }
  putWrites(
    config: RunnableConfig,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    return this.change(config, (saver) =>
      saver.putWrites(config, writes, taskId),
    );
  }
  deleteThread(threadId: string): Promise<void> {
    this.validate({ configurable: { thread_id: threadId } });
    return this.scoped(() => this.cache.requiredRemove(this.key));
  }
}

@Injectable()
export class AiCheckpointerService {
  constructor(
    private readonly db: DataSource,
    private readonly records: AiRecordsService,
    private readonly cache: AiCacheService,
  ) {}
  forTask(ctx: AiContext, taskId: string) {
    const scoped = <T>(fn: () => Promise<T>) =>
      this.db.transaction(async (manager) => {
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [`ai-task:${taskId}`],
        );
        await this.records.task(ctx, taskId, manager);
        return fn();
      });
    return new AiRedisCheckpointer(
      this.cache,
      this.cache.key('task', ctx, `${taskId}:checkpoints`),
      taskId,
      scoped,
    );
  }
}
