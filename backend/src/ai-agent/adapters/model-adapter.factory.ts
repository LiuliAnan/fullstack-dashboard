import { BadRequestException, Injectable } from '@nestjs/common';
import { MockModelAdapter } from './mock.adapter';
import { OpenAiCompatibleAdapter } from './openai-compatible.adapter';
import type { ModelAdapter } from './model-adapter.interface';
import type { ModelProvider } from '../types/model.types';

const PROVIDERS: ModelProvider[] = [
  'mock',
  'openai',
  'deepseek',
  'qwen',
  'kimi',
];

@Injectable()
export class ModelAdapterFactory {
  constructor(private readonly mock: MockModelAdapter) {}

  create(provider?: string): ModelAdapter {
    const selected = (
      provider ||
      process.env.AI_MODEL_PROVIDER ||
      'mock'
    ).toLowerCase() as ModelProvider;
    if (!PROVIDERS.includes(selected))
      throw new BadRequestException(`Unsupported model provider: ${selected}`);
    return selected === 'mock'
      ? this.mock
      : new OpenAiCompatibleAdapter(selected);
  }
}
