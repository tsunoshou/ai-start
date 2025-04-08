import { container } from 'tsyringe';

import type { LoggerInterface } from '@/shared/logger/logger.interface';
import { LoggerToken } from '@/shared/logger/logger.token';

import { ENV } from '../../config/environment';
import { AIProvider, AIService } from '../../domain/services/ai/AIService';

import { OpenAIService } from './OpenAIService';

// DIコンテナからロガーを取得
const logger = container.resolve<LoggerInterface>(LoggerToken);

/**
 * AIサービスファクトリークラス
 *
 * 適切なAIサービス実装を提供するファクトリー
 */
export class AIServiceFactory {
  /**
   * 指定されたプロバイダーのAIサービスを作成して返す
   * @param provider AIプロバイダー
   * @param apiKey APIキー
   */
  static createService(provider: AIProvider, apiKey: string): AIService {
    switch (provider) {
      case AIProvider.OPENAI:
        return container.resolve(OpenAIService);
      case AIProvider.ANTHROPIC:
        // Anthropicサービスの実装（未実装）
        throw new Error('Anthropic service is not implemented yet');
      case AIProvider.GOOGLE:
        // Googleサービスの実装（未実装）
        throw new Error('Google service is not implemented yet');
      case AIProvider.OPEN_SOURCE:
        // オープンソースモデルサービスの実装（未実装）
        throw new Error('Open source model service is not implemented yet');
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  }

  /**
   * 環境変数から適切なAIサービスを作成して返す
   * 設定されているAPIキーがあるプロバイダーを優先的に選択
   */
  static createServiceFromEnv(): AIService {
    const openaiKey = ENV.OPENAI_API_KEY;
    const anthropicKey = ENV.ANTHROPIC_API_KEY;
    const geminiKey = ENV.GEMINI_API_KEY;

    // 利用可能なAPIキーを持つプロバイダーで最初に見つかったものを使用
    if (openaiKey) {
      return this.createService(AIProvider.OPENAI, openaiKey);
    } else if (anthropicKey) {
      // Anthropicサービスの実装（未実装）
      throw new Error('Anthropic service is not implemented yet');
    } else if (geminiKey) {
      // Googleサービスの実装（未実装）
      throw new Error('Google service is not implemented yet');
    }

    // デフォルトはダミーのOpenAIサービス（警告を表示）
    logger.warn({
      message: 'No AI provider API key found in environment variables. Using dummy OpenAI service.'
    });
    
    return container.resolve(OpenAIService);
  }
}
