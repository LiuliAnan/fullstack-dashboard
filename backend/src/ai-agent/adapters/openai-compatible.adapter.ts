import { BadGatewayException, Injectable } from '@nestjs/common';
import type { ModelAdapter } from './model-adapter.interface';
import type {
  ModelChatRequest,
  ModelChatResponse,
  ModelProvider,
} from '../types/model.types';

interface ProviderConfig {
  baseUrl: string;
  apiKey: string;
  defaultModel: string;
}

const PROVIDERS: Record<
  Exclude<ModelProvider, 'mock'>,
  { baseUrl: string; keyEnv: string; modelEnv: string; defaultModel: string }
> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    keyEnv: 'OPENAI_API_KEY',
    modelEnv: 'OPENAI_MODEL',
    defaultModel: 'gpt-4o-mini',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    keyEnv: 'DEEPSEEK_API_KEY',
    modelEnv: 'DEEPSEEK_MODEL',
    defaultModel: 'deepseek-chat',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    keyEnv: 'QWEN_API_KEY',
    modelEnv: 'QWEN_MODEL',
    defaultModel: 'qwen-plus',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    keyEnv: 'KIMI_API_KEY',
    modelEnv: 'KIMI_MODEL',
    defaultModel: 'moonshot-v1-8k',
  },
};

@Injectable()
export class OpenAiCompatibleAdapter implements ModelAdapter {
  constructor(public readonly provider: Exclude<ModelProvider, 'mock'>) {}

  private config(): ProviderConfig {
    const definition = PROVIDERS[this.provider];
    return {
      baseUrl:
        process.env[`${this.provider.toUpperCase()}_BASE_URL`] ||
        definition.baseUrl,
      apiKey: process.env[definition.keyEnv] || '',
      defaultModel: process.env[definition.modelEnv] || definition.defaultModel,
    };
  }

  async chat(request: ModelChatRequest): Promise<ModelChatResponse> {
    const config = this.config();
    if (!config.apiKey) {
      throw new BadGatewayException(
        `${this.provider} API key is not configured`,
      );
    }

    let response: Response;
    try {
      response = await fetch(
        `${config.baseUrl.replace(/\/$/, '')}/chat/completions`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: request.model || config.defaultModel,
            messages: request.messages,
            temperature: 0.4,
          }),
          signal: AbortSignal.timeout(60_000),
        },
      );
    } catch {
      throw new BadGatewayException(`Unable to connect to ${this.provider}`);
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException(
        `${this.provider} returned HTTP ${response.status}: ${detail.slice(0, 200)}`,
      );
    }
    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
    };
    const content = body.choices?.[0]?.message?.content;
    if (!content)
      throw new BadGatewayException(
        `${this.provider} returned an empty response`,
      );
    return {
      content,
      provider: this.provider,
      model: body.model || request.model || config.defaultModel,
    };
  }
}
