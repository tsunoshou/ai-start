/**
 * AIモデルのサポートレベルを示す列挙型
 */
export enum AIModelTier {
  BASIC = 'basic', // 基本的な機能を提供
  STANDARD = 'standard', // 標準的な機能を提供
  PREMIUM = 'premium', // 高度な機能を提供
}

/**
 * AIモデルの提供会社を示す列挙型
 */
export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  OPEN_SOURCE = 'open_source',
}

/**
 * AIモデルの情報を表すインターフェース
 */
export interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  tier: AIModelTier;
  maxTokens: number;
  costPerToken: number;
}

/**
 * AIメッセージの役割を示す列挙型
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
}

/**
 * AIメッセージを表すインターフェース
 */
export interface AIMessage {
  role: MessageRole;
  content: string;
}

/**
 * AI対話のオプションを表すインターフェース
 */
export interface AIConversationOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * AI対話の応答を表すインターフェース
 */
export interface AIConversationResponse {
  message: AIMessage;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  modelUsed: string;
}

/**
 * AIサービスのインターフェース
 *
 * 複数のAIプロバイダーを抽象化し、統一されたインターフェースを提供します。
 */
export interface AIService {
  /**
   * 利用可能なすべてのAIモデルを取得します
   */
  getAvailableModels(): Promise<AIModel[]>;

  /**
   * 特定のAIモデルの詳細情報を取得します
   * @param modelId モデルID
   */
  getModelInfo(modelId: string): Promise<AIModel | null>;

  /**
   * AI対話を実行します
   * @param messages メッセージの配列
   * @param options 対話オプション
   */
  chat(messages: AIMessage[], options: AIConversationOptions): Promise<AIConversationResponse>;

  /**
   * AI対話をストリーミングモードで実行します
   * @param messages メッセージの配列
   * @param options 対話オプション
   * @param onChunk チャンク受信時のコールバック
   */
  chatStream(
    messages: AIMessage[],
    options: AIConversationOptions,
    onChunk: (chunk: string) => void
  ): Promise<AIConversationResponse>;

  /**
   * 対話文脈に基づいて最適なモデルを自動選択します
   * @param messages メッセージの配列
   * @param tier 必要なモデル階層
   */
  selectOptimalModel(messages: AIMessage[], tier?: AIModelTier): Promise<string>;
}
