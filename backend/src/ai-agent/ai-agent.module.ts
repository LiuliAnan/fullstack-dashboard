import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatController } from './controllers/ai-chat.controller';
import { AiSessionService } from './services/ai-session.service';
import { AiChatService } from './services/ai-chat.service';
import { MockModelAdapter } from './adapters/mock.adapter';
import { ModelAdapterFactory } from './adapters/model-adapter.factory';
import { AiUserMemory } from './entities/ai-user-memory.entity';
import { AiTaskRecord } from './entities/ai-task-record.entity';
import { AiOperationAudit } from './entities/ai-operation-audit.entity';
import { AiRecordsController } from './controllers/ai-records.controller';
import { AiRecordsService } from './services/ai-records.service';
import { AiAuditService } from './services/ai-audit.service';
import { AiCacheService } from './cache/ai-cache.service';
import { AiCheckpointerService } from './cache/ai-checkpointer.service';
import { AiBusinessCacheSubscriber } from './cache/ai-business-cache.subscriber';
import { AiScopeGuard } from './security/ai-scope.guard';
import { DashboardModule } from '../dashboard/dashboard.module';
import { AiToolsService } from './services/ai-tools.service';
import { AiToolsController } from './controllers/ai-tools.controller';

@Module({
  imports: [
    DashboardModule,
    TypeOrmModule.forFeature([
      AiChatSession,
      AiChatMessage,
      AiUserMemory,
      AiTaskRecord,
      AiOperationAudit,
    ]),
  ],
  controllers: [AiChatController, AiRecordsController, AiToolsController],
  providers: [
    AiSessionService,
    AiChatService,
    MockModelAdapter,
    ModelAdapterFactory,
    AiRecordsService,
    AiAuditService,
    AiCacheService,
    AiCheckpointerService,
    AiBusinessCacheSubscriber,
    AiScopeGuard,
    AiToolsService,
  ],
  exports: [
    AiRecordsService,
    AiAuditService,
    AiCacheService,
    AiCheckpointerService,
  ],
})
export class AiAgentModule {}
