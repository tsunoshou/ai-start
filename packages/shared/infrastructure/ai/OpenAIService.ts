import { inject, injectable } from 'tsyringe';

import {
  AIService,
  AIModel,
  AIProvider,
  AIModelTier,
  AIMessage,
  AIConversationOptions,
  AIConversationResponse,
  MessageRole,
} from '@core/ai/domain/services/ai.service';
import type { LoggerInterface } from '@core/shared/logger/logger.interface';
import { LoggerToken } from '@core/shared/logger/logger.token';

/**
 * OpenAIサービスの実装クラス
 */
@injectable()
export class OpenAIService implements AIService {
  private apiKey: string;
  private availableModels: AIModel[] = [
    {
      id: 'gpt-4o',
      provider: AIProvider.OPENAI,
      name: 'GPT-4o',
      tier: AIModelTier.PREMIUM,
      maxTokens: 128000,
      costPerToken: 0.00001,
    },
    {
      id: 'gpt-4o-mini',
      provider: AIProvider.OPENAI,
      name: 'GPT-4o-mini',
      tier: AIModelTier.STANDARD,
      maxTokens: 128000,
      costPerToken: 0.000005,
    },
    {
      id: 'gpt-3.5-turbo',
      provider: AIProvider.OPENAI,
      name: 'GPT-3.5 Turbo',
      tier: AIModelTier.BASIC,
      maxTokens: 16385,
      costPerToken: 0.0000015,
    },
  ];

  constructor(
    apiKey: string,
    @inject(LoggerToken) private readonly logger: LoggerInterface
  ) {
    this.apiKey = apiKey;
  }

  /**
   * 利用可能なすべてのAIモデルを取得します
   */
  async getAvailableModels(): Promise<AIModel[]> {
    return this.availableModels;
  }

  /**
   * 特定のAIモデルの詳細情報を取得します
   * @param modelId モデルID
   */
  async getModelInfo(modelId: string): Promise<AIModel | null> {
    return this.availableModels.find((model) => model.id === modelId) || null;
  }

  /**
   * AI対話を実行します
   * @param messages メッセージの配列
   * @param options 対話オプション
   */
  async chat(
    messages: AIMessage[],
    options: AIConversationOptions
  ): Promise<AIConversationResponse> {
    // 実際の実装では、OpenAI APIを呼び出す処理を実装
    // この部分はOpenAI SDKを使用して実装
    this.logger.info({
      message: 'OpenAI chat called with model',
      model: options.model,
    });

    // ダミーのレスポンスを返す（実際の実装では削除）
    return {
      message: {
        role: MessageRole.ASSISTANT,
        content: 'これはOpenAI APIのダミーレスポンスです。',
      },
      totalTokens: 100,
      promptTokens: 50,
      completionTokens: 50,
      modelUsed: options.model,
    };
  }

  /**
   * AI対話をストリーミングモードで実行します
   * @param messages メッセージの配列
   * @param options 対話オプション
   * @param onChunk チャンク受信時のコールバック
   */
  async chatStream(
    messages: AIMessage[],
    options: AIConversationOptions,
    onChunk: (chunk: string) => void
  ): Promise<AIConversationResponse> {
    // 実際の実装では、OpenAI APIをストリーミングモードで呼び出す処理を実装
    // この部分はOpenAI SDKを使用して実装
    this.logger.info({
      message: 'OpenAI chat stream called with model',
      model: options.model,
    });

    // ダミーのストリーミング（実際の実装では削除）
    const chunks = ['これは', 'OpenAI API', 'のダミー', 'ストリーミング', 'レスポンスです。'];
    for (const chunk of chunks) {
      onChunk(chunk);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // ダミーのレスポンスを返す（実際の実装では削除）
    return {
      message: {
        role: MessageRole.ASSISTANT,
        content: chunks.join(''),
      },
      totalTokens: 100,
      promptTokens: 50,
      completionTokens: 50,
      modelUsed: options.model,
    };
  }

  /**
   * 対話文脈に基づいて最適なモデルを自動選択します
   * @param messages メッセージの配列
   * @param tier 必要なモデル階層
   */
  async selectOptimalModel(
    messages: AIMessage[],
    tier: AIModelTier = AIModelTier.STANDARD
  ): Promise<string> {
    // 文脈の長さや複雑さに基づいてモデルを選択するロジック
    // ここでは単純にtierに基づいて選択
    const models = this.availableModels.filter((model) => model.tier === tier);
    return models.length > 0 ? models[0].id : 'gpt-3.5-turbo'; // デフォルトモデル
  }
}
