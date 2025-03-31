# プロトタイプ/PoC開発のコード例集

最終更新日: 2025-03-26

このドキュメントは、`03_prototype_development.md`で説明されているプロトタイプ開発に関連するコードサンプルを集約したものです。
概念の詳細な説明については、メインドキュメントを参照してください。

## リポジトリパターンとRLSの実装例

```typescript
// domain/models/value-objects/ids.ts
export type UserId = string & { readonly _brand: unique symbol };
export type ProjectId = string & { readonly _brand: unique symbol };

// ID生成・変換関数
export function createUserId(id: string): UserId {
  if (!isValidUUID(id)) {
    throw new ValidationError('INVALID_ID', 'Invalid UserId format');
  }
  return id as UserId;
}

export function generateUserId(): UserId {
  return crypto.randomUUID() as UserId;
}

// domain/repositories/userRepository.ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByEmail(email: EmailAddress): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
  delete(id: UserId): Promise<boolean>;
}

// infrastructure/database/repositories/supabaseUserRepository.ts
import { UserRepository } from '@/domain/repositories/userRepository';
import { User } from '@/domain/models/entities/user/User';
import { UserId } from '@/domain/models/value-objects/ids';
import { EmailAddress } from '@/domain/models/value-objects/EmailAddress';
import { Session } from '@supabase/supabase-js';
import { DataError } from '@/shared/errors/errorTypes';
import { userMapper } from '@/infrastructure/mappers/userMapper';

export class SupabaseUserRepository implements UserRepository {
  constructor(private readonly session: Session | null) {}

  private async getClient() {
    return getAuthenticatedClient(this.session);
  }

  async findById(id: UserId): Promise<User | null> {
    try {
      const client = await this.getClient();

      const { data, error } = await client
        .from('users')
        .select('*')
        .eq('id', id.toString())
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null; // レコードが見つからない
        throw new DataError('DATABASE_ERROR', error.message, { userId: id.toString() });
      }

      return data ? userMapper.toDomain(data) : null;
    } catch (error) {
      if (error instanceof DataError) {
        throw error;
      }
      throw new DataError(
        'DATABASE_ERROR',
        `Failed to fetch user: ${error instanceof Error ? error.message : String(error)}`,
        { userId: id.toString() }
      );
    }
  }

  // 他のメソッドの実装...
}
```

## AI対話システムコンポーネント例

### PromptTemplateManager

```typescript
// domain/models/value-objects/prompt-template.ts
export type PromptTemplateId = string & { readonly _brand: unique symbol };

export function createPromptTemplateId(id: string): PromptTemplateId {
  if (!id || typeof id !== 'string') {
    throw new ValidationError('INVALID_ID', 'Invalid PromptTemplateId format');
  }
  return id as PromptTemplateId;
}

// domain/models/entities/prompt/PromptTemplate.ts
export interface PromptTemplate extends EntityBase {
  readonly id: PromptTemplateId;
  readonly name: string;
  readonly description: string;
  readonly content: string;
  readonly category: string;
  readonly version: number;
}

// domain/repositories/promptTemplateRepository.ts
export interface PromptTemplateRepository {
  findById(id: PromptTemplateId): Promise<PromptTemplate | null>;
  findByCategory(category: string): Promise<PromptTemplate[]>;
  findAll(): Promise<PromptTemplate[]>;
  save(promptTemplate: PromptTemplate): Promise<PromptTemplate>;
  delete(id: PromptTemplateId): Promise<boolean>;
}

// domain/services/prompt/PromptTemplateManager.ts
export class PromptTemplateManager {
  constructor(private readonly templateRepository: PromptTemplateRepository) {}

  /**
   * テンプレートIDに基づいてプロンプトテンプレートを取得し、変数を置換する
   * @param templateId テンプレートID
   * @param variables 置換する変数のマップ
   * @returns 変数置換後のテンプレート文字列
   * @throws {NotFoundError} テンプレートが見つからない場合
   */
  async renderTemplate(
    templateId: PromptTemplateId,
    variables: Record<string, string>
  ): Promise<string> {
    const template = await this.templateRepository.findById(templateId);
    if (!template) {
      throw new NotFoundError('TEMPLATE_NOT_FOUND', `Template not found: ${templateId.toString()}`);
    }

    return this.replaceVariables(template.content, variables);
  }

  /**
   * テンプレート内の変数プレースホルダーを実際の値で置換する
   * @param template テンプレート文字列
   * @param variables 置換する変数のマップ
   * @returns 変数置換後の文字列
   */
  private replaceVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
```

### ContextBuildStrategy

```typescript
// domain/models/value-objects/ai-context.ts
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIContext {
  messages: AIMessage[];
  totalTokens: number;
}

// domain/models/entities/message/Message.ts
export interface Message extends EntityBase {
  readonly id: MessageId;
  readonly conversationId: ConversationId;
  readonly content: string;
  readonly role: 'user' | 'assistant' | 'system';
  readonly metadata?: Record<string, unknown>;
}

// application/services/ai/strategies/ContextBuildStrategy.ts
export interface ContextBuildStrategy {
  formatHistory(history: Message[]): AIMessage[];
  formatSystemPrompt(systemPrompt: string): string;
  optimizeContext(context: AIContext, maxTokens: number): AIContext;
}

/**
 * 初期対話用のコンテキスト構築戦略
 * 新しい会話を開始する際に使用される
 */
export class InitialContextStrategy implements ContextBuildStrategy {
  /**
   * 初期対話では履歴を使用しない
   * @param history メッセージ履歴
   * @returns 空の配列
   */
  formatHistory(history: Message[]): AIMessage[] {
    return [];
  }

  /**
   * 初期対話用のシステムプロンプト強化
   * @param systemPrompt 基本システムプロンプト
   * @returns 初期対話向けに拡張されたプロンプト
   */
  formatSystemPrompt(systemPrompt: string): string {
    return `${systemPrompt}\n重要: これは初期対話です。まず概要説明と状況確認を行ってください。`;
  }

  /**
   * 初期対話のコンテキスト最適化
   * システムプロンプトを優先し、不要なコンテキストを削減
   * @param context AIコンテキスト
   * @param maxTokens 最大トークン数
   * @returns 最適化されたコンテキスト
   */
  optimizeContext(context: AIContext, maxTokens: number): AIContext {
    // システムプロンプトは常に保持
    const systemMessage = context.messages.find((msg) => msg.role === 'system');

    if (!systemMessage || context.totalTokens <= maxTokens) {
      return context;
    }

    // システムプロンプトのみを保持し、他のメッセージは削除
    const systemTokens = Math.ceil(systemMessage.content.length / 4);

    if (systemTokens > maxTokens) {
      // システムプロンプトが大きすぎる場合は切り詰める
      const truncatedContent = systemMessage.content.substring(0, maxTokens * 4 - 100);
      return {
        messages: [{ role: 'system', content: truncatedContent }],
        totalTokens: Math.ceil(truncatedContent.length / 4),
      };
    }

    // システムメッセージと最後のユーザーメッセージのみを保持
    const userMessage = context.messages.findLast((msg) => msg.role === 'user');

    if (userMessage) {
      return {
        messages: [systemMessage, userMessage],
        totalTokens:
          Math.ceil(systemMessage.content.length / 4) + Math.ceil(userMessage.content.length / 4),
      };
    }

    return {
      messages: [systemMessage],
      totalTokens: systemTokens,
    };
  }
}

/**
 * 継続対話用のコンテキスト構築戦略
 * 会話の流れを維持しながら対話を続ける場合に使用
 */
export class ContinuousContextStrategy implements ContextBuildStrategy {
  /**
   * 継続対話用の履歴フォーマット
   * 直近のメッセージを優先
   * @param history メッセージ履歴
   * @returns フォーマットされたAIメッセージ配列
   */
  formatHistory(history: Message[]): AIMessage[] {
    return history
      .slice(-10) // 最新10メッセージのみ使用
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));
  }

  /**
   * 継続対話用のシステムプロンプト
   * @param systemPrompt 基本システムプロンプト
   * @returns 継続対話向けに拡張されたプロンプト
   */
  formatSystemPrompt(systemPrompt: string): string {
    return `${systemPrompt}\n継続対話です。これまでの会話を考慮して回答してください。`;
  }

  /**
   * 継続対話のコンテキスト最適化
   * 古い履歴から削減して最新の会話の流れを優先
   * @param context AIコンテキスト
   * @param maxTokens 最大トークン数
   * @returns 最適化されたコンテキスト
   */
  optimizeContext(context: AIContext, maxTokens: number): AIContext {
    if (context.totalTokens <= maxTokens) {
      return context;
    }

    // システムメッセージと最近のメッセージを優先
    const systemMessage = context.messages.find((msg) => msg.role === 'system');

    // ユーザーとアシスタントのメッセージを抽出（最新順）
    const conversationMessages = context.messages.filter((msg) => msg.role !== 'system').reverse();

    const optimizedMessages: AIMessage[] = [];
    let currentTokens = 0;

    // システムメッセージを追加
    if (systemMessage) {
      optimizedMessages.push(systemMessage);
      currentTokens += Math.ceil(systemMessage.content.length / 4);
    }

    // 最新のメッセージから順に追加
    for (const message of conversationMessages) {
      const messageTokens = Math.ceil(message.content.length / 4);

      if (currentTokens + messageTokens <= maxTokens) {
        optimizedMessages.push(message);
        currentTokens += messageTokens;
      } else {
        break; // トークン制限を超える場合は追加を停止
      }
    }

    // メッセージを正しい順序に並べ替え
    optimizedMessages.sort((a, b) => {
      // システムメッセージを最初に
      if (a.role === 'system') return -1;
      if (b.role === 'system') return 1;
      // その他のメッセージは追加順（最新のメッセージが最後）
      return 0;
    });

    return {
      messages: optimizedMessages,
      totalTokens: currentTokens,
    };
  }
}

/**
 * チェックポイント対話用のコンテキスト構築戦略
 * 対話の要約と次のステップを準備する場合に使用
 */
export class CheckpointContextStrategy implements ContextBuildStrategy {
  /**
   * チェックポイント用の履歴フォーマット
   * 要約と重要ポイントを抽出
   * @param history メッセージ履歴
   * @returns フォーマットされたAIメッセージ配列
   */
  formatHistory(history: Message[]): AIMessage[] {
    // 履歴から重要なポイントを抽出（実際の実装ではより洗練された手法を使用）
    const keyMessages = this.extractKeyMessages(history);

    return keyMessages.map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));
  }

  /**
   * 重要なメッセージを抽出
   * @param history メッセージ履歴
   * @returns 重要なメッセージの配列
   */
  private extractKeyMessages(history: Message[]): Message[] {
    if (history.length <= 5) {
      return history;
    }

    // 重要なメッセージを選択するロジック
    // 実際の実装ではより洗練された方法が必要
    const result: Message[] = [];

    // 最初のシステムメッセージ
    const systemMessage = history.find((msg) => msg.role === 'system');
    if (systemMessage) {
      result.push(systemMessage);
    }

    // 最初のユーザーメッセージ
    const firstUserMessage = history.find((msg) => msg.role === 'user');
    if (firstUserMessage) {
      result.push(firstUserMessage);
    }

    // 重要なフラグが付いたメッセージ（例として、メタデータに基づく選択）
    const importantMessages = history.filter(
      (msg) =>
        msg.metadata && (msg.metadata.important === true || msg.metadata.isCheckpoint === true)
    );
    result.push(...importantMessages);

    // 最新の数メッセージを追加
    const recentMessages = history.slice(-3);
    result.push(...recentMessages);

    // 重複を排除
    return Array.from(new Set(result));
  }

  /**
   * チェックポイント用のシステムプロンプト
   * @param systemPrompt 基本システムプロンプト
   * @returns チェックポイント向けに拡張されたプロンプト
   */
  formatSystemPrompt(systemPrompt: string): string {
    return `${systemPrompt}\nこれはチェックポイントです。これまでの進捗を要約し、次のステップの準備をしてください。`;
  }

  /**
   * チェックポイントのコンテキスト最適化
   * 要約を優先し、詳細な履歴は削減
   * @param context AIコンテキスト
   * @param maxTokens 最大トークン数
   * @returns 最適化されたコンテキスト
   */
  optimizeContext(context: AIContext, maxTokens: number): AIContext {
    // 要約と重要なポイントを優先する最適化ロジック
    // 実装省略
    return context;
  }
}
```

### ConversationManager

```typescript
// domain/models/value-objects/conversation-types.ts
export type ConversationId = string & { readonly _brand: unique symbol };
export type MessageId = string & { readonly _brand: unique symbol };

export enum ConversationType {
  INITIAL = 'initial',
  CONTINUOUS = 'continuous',
  CHECKPOINT = 'checkpoint',
  OUTPUT_CREATION = 'output_creation',
}

// domain/repositories/conversationRepository.ts
export interface ConversationRepository {
  findById(id: ConversationId): Promise<Conversation | null>;
  findByUserId(userId: UserId): Promise<Conversation[]>;
  findByType(type: ConversationType): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<Conversation>;
  updateTimestamp(id: ConversationId): Promise<boolean>;
  delete(id: ConversationId): Promise<boolean>;
}

// domain/repositories/messageRepository.ts
export interface MessageRepository {
  findById(id: MessageId): Promise<Message | null>;
  findByConversationId(conversationId: ConversationId): Promise<Message[]>;
  save(message: Message): Promise<Message>;
  delete(id: MessageId): Promise<boolean>;
}

// application/services/ai/ConversationManager.ts
export class ConversationManager {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly messageRepository: MessageRepository
  ) {}

  /**
   * 新しい会話を開始する
   * @param userId ユーザーID
   * @param conversationType 会話種別
   * @param initialPrompt 初期プロンプト（オプション）
   * @returns 生成された会話エンティティ
   */
  async startConversation(
    userId: UserId,
    conversationType: ConversationType,
    initialPrompt?: string
  ): Promise<Conversation> {
    const conversation = createConversation({
      id: generateId<ConversationId>(),
      userId,
      type: conversationType,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.conversationRepository.save(conversation);

    if (initialPrompt) {
      await this.addSystemMessage(conversation.id, initialPrompt);
    }

    return conversation;
  }

  /**
   * 会話にメッセージを追加する
   * @param conversationId 会話ID
   * @param content メッセージ内容
   * @param role メッセージのロール
   * @returns 生成されたメッセージエンティティ
   */
  async addMessage(
    conversationId: ConversationId,
    content: string,
    role: 'user' | 'assistant' | 'system'
  ): Promise<Message> {
    const message = createMessage({
      id: generateId<MessageId>(),
      conversationId,
      content,
      role,
      createdAt: new Date(),
    });

    await this.messageRepository.save(message);
    await this.conversationRepository.updateTimestamp(conversationId);

    return message;
  }

  /**
   * 会話履歴を取得する
   * @param conversationId 会話ID
   * @returns メッセージの配列
   */
  async getConversationHistory(conversationId: ConversationId): Promise<Message[]> {
    return this.messageRepository.findByConversationId(conversationId);
  }

  /**
   * システムメッセージを追加する
   * @param conversationId 会話ID
   * @param content メッセージ内容
   * @returns 生成されたメッセージエンティティ
   */
  private async addSystemMessage(
    conversationId: ConversationId,
    content: string
  ): Promise<Message> {
    return this.addMessage(conversationId, content, 'system');
  }
}
```

### AIService

```typescript
// domain/models/value-objects/ai-service-types.ts
export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface AIResponse {
  content: string;
  tokenUsage: TokenUsage;
  model: string;
}

export type AIServiceErrorCode =
  | 'API_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'CONTEXT_LENGTH_ERROR'
  | 'INVALID_REQUEST_ERROR'
  | 'SERVICE_UNAVAILABLE';

export class AIServiceError extends Error {
  constructor(
    public readonly code: AIServiceErrorCode,
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AIServiceError';
  }
}

// domain/services/ai/AIService.ts
export interface AIService {
  generateCompletion(context: AIContext, options?: AIRequestOptions): Promise<AIResponse>;

  generateCompletionStream(
    context: AIContext,
    options?: AIRequestOptions,
    callback?: (chunk: string) => void
  ): Promise<AIResponse>;
}

// infrastructure/services/ai/OpenAIService.ts
export class OpenAIService implements AIService {
  constructor(
    private readonly openai: OpenAIApi,
    private readonly config: AIServiceConfig
  ) {}

  /**
   * OpenAI APIを使用してテキスト完成（チャット）を生成する
   * @param context AIコンテキスト
   * @param options 生成オプション
   * @returns AI応答
   * @throws {AIServiceError} API呼び出しに失敗した場合
   */
  async generateCompletion(context: AIContext, options?: AIRequestOptions): Promise<AIResponse> {
    try {
      const messages = context.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await this.openai.createChatCompletion({
        model: options?.model || this.config.defaultModel,
        messages,
        temperature: options?.temperature || this.config.defaultTemperature,
        max_tokens: options?.maxTokens || this.config.defaultMaxTokens,
        stream: false,
      });

      return {
        content: response.data.choices[0].message?.content || '',
        tokenUsage: {
          promptTokens: response.data.usage?.prompt_tokens || 0,
          completionTokens: response.data.usage?.completion_tokens || 0,
          totalTokens: response.data.usage?.total_tokens || 0,
          cost: this.calculateCost(response.data.usage),
        },
        model: response.data.model,
      };
    } catch (error) {
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * ストリーミングレスポンス形式でテキスト完成を生成する
   * @param context AIコンテキスト
   * @param options 生成オプション
   * @param callback チャンク受信時のコールバック関数
   * @returns AI応答
   * @throws {AIServiceError} API呼び出しに失敗した場合
   */
  async generateCompletionStream(
    context: AIContext,
    options?: AIRequestOptions,
    callback?: (chunk: string) => void
  ): Promise<AIResponse> {
    // ストリーミング実装（省略）
    throw new Error('Method not implemented');
  }

  /**
   * OpenAIエラーを標準化されたAIServiceErrorに変換する
   * @param error 元のエラー
   * @returns 標準化されたAIServiceError
   */
  private handleOpenAIError(error: any): AIServiceError {
    // エラー種別によって適切なエラーコードに変換
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 429) {
        return new AIServiceError(
          'RATE_LIMIT_ERROR',
          'Rate limit exceeded, please try again later',
          { status, data }
        );
      } else if (status === 400) {
        if (data.error?.code === 'context_length_exceeded') {
          return new AIServiceError(
            'CONTEXT_LENGTH_ERROR',
            'Input is too long, please reduce the context size',
            { status, data }
          );
        }
        return new AIServiceError(
          'INVALID_REQUEST_ERROR',
          data.error?.message || 'Invalid request to OpenAI API',
          { status, data }
        );
      } else if (status >= 500) {
        return new AIServiceError(
          'SERVICE_UNAVAILABLE',
          'OpenAI service is currently unavailable',
          { status, data }
        );
      }
    }

    return new AIServiceError('API_ERROR', error.message || 'Unknown error occurred', {
      originalError: error,
    });
  }

  /**
   * トークン使用量からコストを計算する
   * @param usage トークン使用量情報
   * @returns 推定コスト（米ドル）
   */
  private calculateCost(usage?: { prompt_tokens?: number; completion_tokens?: number }): number {
    if (!usage) return 0;

    const model = this.config.defaultModel;
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;

    // モデルごとの価格（1000トークンあたりの米ドル）
    // 注: 価格は変更される可能性があるため、最新の公式価格を参照すること
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4-turbo-preview': { prompt: 0.01, completion: 0.03 },
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-3.5-turbo': { prompt: 0.0015, completion: 0.002 },
    };

    const price = pricing[model] || pricing['gpt-3.5-turbo'];

    // コスト計算（1000トークンあたりの価格）
    const promptCost = (promptTokens / 1000) * price.prompt;
    const completionCost = (completionTokens / 1000) * price.completion;

    return promptCost + completionCost;
  }
}
```

## テストケース例

```typescript
// __tests__/domain/services/prompt/PromptTemplateManager.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PromptTemplateManager } from '@/domain/services/prompt/PromptTemplateManager';
import { PromptTemplateRepository } from '@/domain/repositories/promptTemplateRepository';
import { PromptTemplate } from '@/domain/models/entities/prompt/PromptTemplate';
import { createPromptTemplateId } from '@/domain/models/value-objects/prompt-template';
import { NotFoundError } from '@/shared/errors/errorTypes';

describe('PromptTemplateManager', () => {
  let promptTemplateManager: PromptTemplateManager;
  // 型安全なモック定義
  let mockRepository: {
    findById: ReturnType<typeof vi.fn<[PromptTemplateId], Promise<PromptTemplate | null>>>;
  };

  beforeEach(() => {
    // 型安全なモック作成
    mockRepository = {
      findById: vi.fn<[PromptTemplateId], Promise<PromptTemplate | null>>(),
    };

    promptTemplateManager = new PromptTemplateManager(
      mockRepository as unknown as PromptTemplateRepository
    );
  });

  it('should render template with variables', async () => {
    // モックセットアップ - 適切な型で作成
    const templateId = createPromptTemplateId('template-1');
    const mockTemplate: PromptTemplate = {
      id: templateId,
      name: 'Test Template',
      description: 'A test template',
      content: 'Hello {{name}}, welcome to {{service}}!',
      category: 'greeting',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };

    mockRepository.findById.mockResolvedValue(mockTemplate);

    // テスト実行
    const result = await promptTemplateManager.renderTemplate(templateId, {
      name: 'John',
      service: 'AiStart',
    });

    // 検証
    expect(result).toBe('Hello John, welcome to AiStart!');
    expect(mockRepository.findById).toHaveBeenCalledWith(templateId);
  });

  it('should throw error when template not found', async () => {
    // モックセットアップ
    const templateId = createPromptTemplateId('non-existent');
    mockRepository.findById.mockResolvedValue(null);

    // テスト実行と検証
    await expect(promptTemplateManager.renderTemplate(templateId, {})).rejects.toThrow(
      NotFoundError
    );

    await expect(promptTemplateManager.renderTemplate(templateId, {})).rejects.toThrow(
      'Template not found'
    );
  });
});
```

## データベースマイグレーション例

Drizzleスキーマと対応するSQLマイグレーションの両方を定義して整合性を確保します。

```typescript
// infrastructure/database/schema/conversations.ts
import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom().notNull(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  type: varchar('type', { length: 50 })
    .notNull()
    .check(
      'valid_conversation_type',
      `type IN ('initial', 'continuous', 'checkpoint', 'output_creation')`
    ),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  metadata: jsonb('metadata'),
});
```

```sql
-- migrations/0001_create_conversations_table.sql
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'initial', 'continuous', 'checkpoint', 'output_creation'
  )),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- RLSポリシー設定
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 挿入ポリシー: 自分のconversationのみ作成可能
CREATE POLICY conversations_insert_policy ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 選択ポリシー: 自分のconversationのみ読み取り可能
CREATE POLICY conversations_select_policy ON conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- 更新ポリシー: 自分のconversationのみ更新可能
CREATE POLICY conversations_update_policy ON conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 削除ポリシー: 自分のconversationのみ削除可能
CREATE POLICY conversations_delete_policy ON conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- インデックス作成
CREATE INDEX conversations_user_id_idx ON conversations(user_id);
CREATE INDEX conversations_type_idx ON conversations(type);
CREATE INDEX conversations_updated_at_idx ON conversations(updated_at);
```

## 環境変数設定例と型安全な管理

```typescript
// config/env.ts
import { z } from 'zod';

/**
 * 環境変数のスキーマ定義
 * 型安全性を確保するためのバリデーション
 */
const envSchema = z.object({
  // アプリケーション
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // データベース
  DATABASE_URL: z.string().min(1),

  // 認証
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),
  BYPASS_AUTH: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  // OpenAI - 01_requirements_definition.mdの外部サービス連携要件と整合
  OPENAI_API_KEY: z.string().min(1),
  OPENAI_ORGANIZATION: z.string().optional(),
  OPENAI_DEFAULT_MODEL: z
    .enum(['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'])
    .default('gpt-4-turbo-preview'),
  OPENAI_DEFAULT_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.7),
  OPENAI_DEFAULT_MAX_TOKENS: z.coerce.number().positive().default(1000),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // レート制限
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

/**
 * 環境変数の検証と型安全な取得
 * プロセス開始時に一度だけ検証を行う
 */
export const env = envSchema.parse(process.env);

// 型定義のエクスポート
export type Env = z.infer<typeof envSchema>;
```

```bash
# .env.local例
# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# データベース
DATABASE_URL="postgresql://postgres:password@localhost:5432/aistart_poc"

# 認証
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-nextauth-secret"
BYPASS_AUTH=true # 開発環境用

# OpenAI
OPENAI_API_KEY="your-openai-api-key"
OPENAI_ORGANIZATION="your-openai-org-id"
OPENAI_DEFAULT_MODEL="gpt-4-turbo-preview"
OPENAI_DEFAULT_TEMPERATURE=0.7
OPENAI_DEFAULT_MAX_TOKENS=1000

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# レート制限
UPSTASH_REDIS_REST_URL="your-upstash-redis-url"
UPSTASH_REDIS_REST_TOKEN="your-upstash-redis-token"
```
