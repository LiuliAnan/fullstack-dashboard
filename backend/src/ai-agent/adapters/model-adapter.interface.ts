import type {
  ModelChatRequest,
  ModelChatResponse,
  ModelProvider,
} from '../types/model.types';

export interface ModelAdapter {
  readonly provider: ModelProvider;
  chat(request: ModelChatRequest): Promise<ModelChatResponse>;
}
