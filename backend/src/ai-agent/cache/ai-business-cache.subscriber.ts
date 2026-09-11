import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  TransactionCommitEvent,
} from 'typeorm';
import { AiCacheService } from './ai-cache.service';

@Injectable()
export class AiBusinessCacheSubscriber implements EntitySubscriberInterface {
  constructor(
    db: DataSource,
    private readonly cache: AiCacheService,
  ) {
    db.subscribers.push(this);
  }
  private async changed(
    event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>,
  ) {
    if (
      !['company', 'relationship', 'user', 'user_profile'].includes(
        event.metadata.tableName,
      )
    )
      return;
    const dimensions = [
      'chat',
      ...(event.metadata.tableName === 'company' ||
      event.metadata.tableName === 'relationship'
        ? ['company', 'dashboard']
        : ['user']),
    ];
    if (event.queryRunner.isTransactionActive) {
      const pending =
        (event.queryRunner.data.aiCacheDimensions as Set<string> | undefined) ??
        new Set<string>();
      dimensions.forEach((dimension) => pending.add(dimension));
      event.queryRunner.data.aiCacheDimensions = pending;
    } else {
      await Promise.all(
        dimensions.map((dimension) => this.cache.invalidateBusiness(dimension)),
      );
    }
  }
  afterInsert(event: InsertEvent<unknown>) {
    return this.changed(event);
  }
  afterUpdate(event: UpdateEvent<unknown>) {
    return this.changed(event);
  }
  afterRemove(event: RemoveEvent<unknown>) {
    return this.changed(event);
  }
  async afterTransactionCommit(event: TransactionCommitEvent) {
    // Nested savepoint commits must not invalidate until the outer transaction commits.
    if (event.queryRunner.isTransactionActive) return;
    const pending = event.queryRunner.data.aiCacheDimensions as
      Set<string> | undefined;
    delete event.queryRunner.data.aiCacheDimensions;
    if (pending)
      await Promise.all(
        [...pending].map((dimension) =>
          this.cache.invalidateBusiness(dimension),
        ),
      );
  }
}
