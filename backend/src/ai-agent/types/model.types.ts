export type ModelProvider = 'mock' | 'openai' | 'deepseek' | 'qwen' | 'kimi';

export interface ModelChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelChatRequest {
  messages: ModelChatMessage[];
  model?: string;
}

export interface ModelChatResponse {
  content: string;
  model: string;
  provider: ModelProvider;
}
