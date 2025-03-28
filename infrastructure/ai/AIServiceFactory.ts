import { AIService, AIProvider } from '../../domain/services/ai/AIService';
import { OpenAIService } from './OpenAIService';

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
        return new OpenAIService(apiKey);
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
    const openaiKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    
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
    console.warn('No AI provider API key found in environment variables. Using dummy OpenAI service.');
    return new OpenAIService('dummy-key');
  }
} 