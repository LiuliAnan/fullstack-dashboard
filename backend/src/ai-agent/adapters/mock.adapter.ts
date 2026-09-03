import { Injectable } from '@nestjs/common';
import type { ModelAdapter } from './model-adapter.interface';
import type {
  ModelChatRequest,
  ModelChatResponse,
  ModelProvider,
} from '../types/model.types';

@Injectable()
export class MockModelAdapter implements ModelAdapter {
  readonly provider: ModelProvider = 'mock';

  chat(request: ModelChatRequest): Promise<ModelChatResponse> {
    const userMessages = request.messages.filter(
      (message) => message.role === 'user',
    );
    const latest = userMessages.at(-1)?.content ?? '';
    return Promise.resolve({
      provider: this.provider,
      model: 'mock-chat',
      content: `这是本地 Mock 模型回复。\n\n你刚才说：**${latest}**\n\n当前会话已经包含 ${userMessages.length} 轮用户消息，可用于验证多轮对话与刷新恢复。`,
    });
  }
}
