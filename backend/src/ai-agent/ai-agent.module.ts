import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiChatSession } from './entities/ai-chat-session.entity';
import { AiChatMessage } from './entities/ai-chat-message.entity';
import { AiChatController } from './controllers/ai-chat.controller';
import { AiSessionService } from './services/ai-session.service';
import { AiChatService } from './services/ai-chat.service';
import { MockModelAdapter } from './adapters/mock.adapter';
import { ModelAdapterFactory } from './adapters/model-adapter.factory';

@Module({
  imports: [TypeOrmModule.forFeature([AiChatSession, AiChatMessage])],
  controllers: [AiChatController],
  providers: [
    AiSessionService,
    AiChatService,
    MockModelAdapter,
    ModelAdapterFactory,
  ],
})
export class AiAgentModule {}
