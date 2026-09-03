import { BadRequestException, Injectable } from '@nestjs/common';
import { AiSessionService } from './ai-session.service';
import { ModelAdapterFactory } from '../adapters/model-adapter.factory';
import { SendMessageDto } from '../dto/send-message.dto';
import type { ModelChatMessage } from '../types/model.types';

@Injectable()
export class AiChatService {
  constructor(
    private readonly sessionService: AiSessionService,
    private readonly adapters: ModelAdapterFactory,
  ) {}

  async send(userId: number, dto: SendMessageDto) {
    const text = dto.message.trim();
    if (!text) throw new BadRequestException('Message cannot be empty');
    const session = await this.sessionService.getOwned(
      dto.sessionId,
      userId,
      true,
    );
    const userMessage = await this.sessionService.addMessage(
      session.id,
      'user',
      { text },
      (dto.attachments ?? []).map((attachment) => ({ ...attachment })),
    );
    const history: ModelChatMessage[] = session.messages
      .slice(-30)
      .map((message) => ({
        role: message.role,
        content: String(message.content.text ?? ''),
      }));
    history.push({ role: 'user', content: text });
    const adapter = this.adapters.create(session.modelProvider);
    const result = await adapter.chat({
      messages: history,
      model: session.modelName ?? undefined,
    });
    const assistantMessage = await this.sessionService.addMessage(
      session.id,
      'assistant',
      { text: result.content },
    );
    return {
      userMessage,
      assistantMessage,
      provider: result.provider,
      model: result.model,
    };
  }
}
