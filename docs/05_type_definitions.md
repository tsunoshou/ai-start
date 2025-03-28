# 共通型定義・DB型定義

最終更新日: 2025-03-26

## 本ドキュメントの目的と位置づけ

このドキュメントは、AiStartプロジェクトにおける型定義の公式リファレンスです。「02_architecture_design.md」で概説されている型システムの詳細な実装例と具体的な型定義パターンを集約しています。開発者は型定義に関する詳細な情報や具体的な実装例については、常にこのドキュメントを参照してください。

「02_architecture_design.md」はアーキテクチャ全体の設計と概念を説明し、本ドキュメントは型定義に特化した詳細な実装指針を提供するという役割分担になっています。このドキュメントで定義された型定義パターンは、プロジェクト全体で一貫して使用してください。

> **注意**: 詳細なコード例や実装サンプルは「code_examples/05_type_definitions_examples.md」を参照してください。本ドキュメントでは、概念的な説明と型定義の指針のみを提供します。

## 型定義の基本方針

AiStartプロジェクトでは型安全性を最優先し、各レイヤーに適切な型定義を配置して、重複を避けつつ責務の明確な分離を実現します。Typescriptの型システムを活用して、ドメインの概念を明確に表現し、コンパイル時の型チェックによって多くのバグを未然に防ぎます。

### 型定義の階層構造

型定義は以下の階層構造に従って配置します：

```
【ドメイン層】
├── 基本型定義
│   ├── ID型（エンティティ名+Id）
│   ├── 共通ユーティリティ型
│   └── 列挙型（Enum）
└── ドメインモデル型
    ├── エンティティ（EntityBase継承）
    └── 値オブジェクト

【アプリケーション層】  
├── データ転送オブジェクト型（名詞+DTO）
├── APIリクエスト型（動詞+名詞+Request）
└── APIレスポンス型（名詞+Response）

【インフラストラクチャ層】
├── データベーススキーマ型
├── リレーション定義型
└── 外部サービス連携型

【共有リソース層】
├── ユーティリティ型
├── エラー型（名詞+Error）
└── 共通レスポンスラッパー型

【設定層】
├── 環境設定型
└── 機能フラグ型

【プレゼンテーション層】
├── UIコンポーネント型
│   ├── Props型（コンポーネント名+Props）
│   ├── 状態型（名詞+State）
│   └── コンテキスト型（名詞+Context）
├── キャッシュ関連型
└── AI固有型
```

各レイヤーの型は、以下の原則に従って定義します：

1. **ドメイン層**: ビジネスロジックの中心となる型定義。外部依存を持たない純粋なドメインモデル
2. **アプリケーション層**: ユースケースで使用される入出力型とDTO
3. **インフラストラクチャ層**: 永続化や外部サービスとの連携に必要な型
4. **共有リソース層**: 複数のレイヤーで共通に使用されるユーティリティ型や汎用的な型定義
5. **設定層**: アプリケーション設定や環境変数に関連する型定義
6. **プレゼンテーション層**: UI構築とAPI通信に必要な型

### 型の命名規則

| 型分類 | 命名規則 | 例 |
|-------|---------|-----|
| ID型 | エンティティ名+Id | UserId, ProjectId |
| エンティティ | PascalCase | User, Project |
| 値オブジェクト | PascalCase | EmailAddress, Money |
| Enum型 | PascalCase | StepType, UserRole |
| Props | コンポーネント名+Props | ButtonProps, UserCardProps |
| データ転送型 | 名詞+DTO | UserDTO, ProjectDTO |
| 状態型 | 名詞+State | AuthState, FormState |
| イベントハンドラ | on+動詞+名詞 | onUserClick, onFormSubmit |
| Context型 | 名詞+Context | AuthContext, ThemeContext |
| APIリクエスト型 | 動詞+名詞+Request | CreateUserRequest |
| APIレスポンス型 | 名詞+Response | UserResponse, ProjectResponse |
| エラー型 | 名詞+Error | ValidationError, APIError |

### 型の共有方法

サーバーとクライアント間で共有される型は、以下の原則に従って管理します：

1. **共有型のエクスポート**: ドメインモデルやDTOなど、共有される型は専用のファイルからエクスポート
2. **型の自動生成**: Next.jsのAPIルートやtrpcを使用する場合は、型の自動共有の仕組みを活用
3. **ブランド型の活用**: 文字列や数値型のIDは、ブランド型を使って型安全性を確保

> **参照**: 具体的な型の実装例については「code_examples/05_type_definitions_examples.md」の対応するセクションを参照してください。

## 基本・汎用ユーティリティ型

### 共通基本型

共通基本型は、プロジェクト全体で再利用される基本的な型定義です。日付関連の型、ドメイン固有の値オブジェクト、およびエンティティの基本構造を定義します。

**主要な共通基本型:**
- Timestamp - 日時を表す型
- DateOnly - 日付のみを表す型（YYYY-MM-DD形式）
- Email - メールアドレスを表すブランド型
- Money - 金額と通貨を表す複合型
- TimeStampFields - 作成日時と更新日時のフィールドを含む型
- EntityBase - 全エンティティの基底となる型

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「共通基本型」セクションを参照してください。

### ID型とブランド型

ID型はブランド型（branded type）を使用して、型レベルでの区別を可能にし、誤ったIDの使用を防ぎます。

**主要なID型:**
- UserId - ユーザーの一意識別子
- ProjectId - プロジェクトの一意識別子
- ProgramId - プログラムの一意識別子
- StepId - ステップの一意識別子
- OutputId - 出力物の一意識別子
- その他のドメイン固有ID型

ID型の生成と変換には専用のユーティリティ関数を使用します。

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「ID型とブランド型」セクションを参照してください。

### 型ユーティリティ

型ユーティリティは、既存の型から新しい型を生成するためのヘルパー型です。これらは型の変換、合成、および特定のプロパティの修飾に使用されます。

**主要な型ユーティリティ:**
- PickPartial - 一部のプロパティをPartialにする型
- RequiredNonNull - nullを許容しないRequired型
- OptionalKeys - 特定のキーをオプションにする型
- RequiredKeys - 特定のキーを必須にする型
- WithId - ID付きエンティティを表現するユーティリティ型

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「型ユーティリティ」セクションを参照してください。

### 共通エラー型

エラー型は、アプリケーション全体で一貫したエラーハンドリングを実現するための型定義です。

**主要なエラー関連型:**
- AIErrorCode - AI関連エラーの列挙型
- AuthErrorCode - 認証関連エラーの列挙型
- DataErrorCode - データ関連エラーの列挙型
- AIServiceError - AI機能のエラー情報を表す型
- ErrorResponse - エラーレスポンスの標準フォーマット

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「共通エラー型」セクションを参照してください。

## ドメインモデル型

### ドメインモデルの構造

ドメインモデルは、ビジネスロジックの中心となる型定義です。エンティティと値オブジェクトの2つの主要なカテゴリに分類されます。

ドメインモデルは下記のディレクトリ構造に従って整理されます：

```
domain/
  models/
    entities/           // 識別子を持つエンティティ
      user/
      program/
      project/
      step/
      // 他のエンティティ...
    value-objects/      // 識別子を持たない値オブジェクト
      ids.ts            // ID型定義
      common.ts         // 共通値オブジェクト
      enums.ts          // 列挙型
      // 他の値オブジェクト...
```

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「ドメインモデルの構造」セクションを参照してください。

### 集約・エンティティの型定義

エンティティは識別子（ID）を持ち、ライフサイクルを通じて同一性が保たれるオブジェクトです。

**主要なエンティティ:**
- User - ユーザー情報
- Program - プログラム（コース）情報
- Project - ユーザーのプロジェクト情報
- Step - プログラム内のステップ情報
- Output - ステップの成果物情報
- Conversation - AI対話情報
- Message - 対話内のメッセージ情報

各エンティティは、そのエンティティに固有の属性と、共通の属性（ID、タイムスタンプなど）を持ちます。

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「集約・エンティティの型定義」セクションを参照してください。

### 値オブジェクトの型定義

値オブジェクトは、識別子を持たず、属性の値によって同一性が定義されるオブジェクトです。

**主要な値オブジェクト:**
- EmailAddress - メールアドレスを表現する値オブジェクト
- UserRole - ユーザーロールの列挙型
- ProjectStatus - プロジェクト状態の列挙型
- ProgramStatus - プログラム状態の列挙型
- ConversationType - 会話種別の列挙型
- OutputFormat - 出力形式の列挙型
- StepType - ステップ種別の列挙型

値オブジェクトには、入力値の検証ロジックを含む場合があり、不変性を持つことが特徴です。

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「値オブジェクトの型定義」セクションを参照してください。

## データベーススキーマ型

### DB型定義の基本方針

データベーススキーマ型は、PostgreSQLのテーブル構造を反映した型定義です。Drizzle ORMを使用してスキーマ定義と型生成を行います。

データベーススキーマの型定義では、以下の原則に従います：
1. テーブル名は複数形で、スネークケースを使用（例: users, project_outputs）
2. カラム名はスネークケースを使用（例: first_name, created_at）
3. 主キーにはUUIDを使用
4. 作成日時（created_at）と更新日時（updated_at）のタイムスタンプフィールドを全テーブルに追加
5. 論理削除をサポートするdelete_atフィールドを必要に応じて追加
6. 外部キー制約を明示的に定義
7. インデックスを適切に設定

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「DB型定義の基本方針」セクションを参照してください。

### Drizzle Schema定義

Drizzle ORMを使用したスキーマ定義では、テーブル定義、関連付け、インデックス設定などを行います。

**主要なスキーマ定義:**
- usersテーブル - ユーザー情報
- programsテーブル - プログラム情報
- stepsテーブル - ステップ情報
- projectsテーブル - プロジェクト情報
- outputsテーブル - 成果物情報
- conversationsテーブル - 対話情報
- messagesテーブル - メッセージ情報

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「Drizzle Schema定義」セクションを参照してください。

### リレーション型

リレーション型は、テーブル間の関連付けを表現するための型定義です。

**主要なリレーション:**
- UserToProjects - ユーザーとプロジェクトの1対多関係
- ProgramToSteps - プログラムとステップの1対多関係
- ProjectToOutputs - プロジェクトと成果物の1対多関係
- StepToConversations - ステップと会話の1対多関係

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「リレーション型」セクションを参照してください。

## API Request/Response型

### API型定義の基本方針

API型定義では、クライアントとサーバー間で交換されるデータの構造を定義します。命名規則として、リクエスト型は「動詞+名詞+Request」、レスポンス型は「名詞+Response」のパターンを使用します。

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「API型定義の基本方針」セクションを参照してください。

### リクエスト型

リクエスト型は、APIエンドポイントへのリクエストデータの構造を定義します。

**主要なリクエスト型:**
- CreateUserRequest - ユーザー作成リクエスト
- UpdateUserRequest - ユーザー更新リクエスト
- CreateProjectRequest - プロジェクト作成リクエスト
- UpdateProjectRequest - プロジェクト更新リクエスト
- CreateProgramRequest - プログラム作成リクエスト
- CreateStepRequest - ステップ作成リクエスト
- SendMessageRequest - メッセージ送信リクエスト

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「リクエスト型」セクションを参照してください。

### レスポンス型

レスポンス型は、APIエンドポイントからのレスポンスデータの構造を定義します。

**主要なレスポンス型:**
- UserResponse - ユーザー情報レスポンス
- ProjectResponse - プロジェクト情報レスポンス
- ProgramResponse - プログラム情報レスポンス
- StepResponse - ステップ情報レスポンス
- ConversationResponse - 会話情報レスポンス
- OutputResponse - 成果物情報レスポンス
- APIResponse<T> - 汎用APIレスポンスラッパー型

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「レスポンス型」セクションを参照してください。

## DTO型

### DTO型の役割と設計原則

DTO（Data Transfer Object）型は、異なるレイヤー間でデータを転送するために使用される型です。特にドメインモデルとAPIレスポンス/リクエスト間の変換に使用されます。

DTOの命名規則は「名詞+DTO」のパターンを使用します。

**DTOの設計原則:**
1. 必要な属性のみを含める（最小限の情報）
2. ビジネスロジックを含めない
3. シリアライズ/デシリアライズが容易な単純なデータ構造を使用
4. ドメインモデルとは明確に区別する

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「DTO型の役割と設計原則」セクションを参照してください。

### 主要DTO型

**代表的なDTO型:**
- UserDTO - ユーザー情報DTO
- ProjectDTO - プロジェクト情報DTO
- ProgramDTO - プログラム情報DTO
- StepDTO - ステップ情報DTO
- ConversationDTO - 会話情報DTO
- OutputDTO - 成果物情報DTO

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「主要DTO型」セクションを参照してください。

## UIコンポーネント型

### UIコンポーネント型の設計原則

UIコンポーネント型は、Reactコンポーネントの型定義に使用されます。命名規則としては、Propsは「コンポーネント名+Props」、状態は「名詞+State」、コンテキストは「名詞+Context」のパターンを使用します。

**UIコンポーネント型の設計原則:**
1. コンポーネントの責務に応じた型定義
2. 再利用可能なコンポーネントは汎用的な型を使用
3. 必要に応じてジェネリクスを活用
4. 型の整合性を確保するための型ガード関数を提供

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「UIコンポーネント型の設計原則」セクションを参照してください。

### コンポーネントProps型

Propsは、Reactコンポーネントに渡されるプロパティの型定義です。

**主要なProps型:**
- LayoutProps - レイアウトコンポーネントのProps
- ButtonProps - ボタンコンポーネントのProps
- UserCardProps - ユーザーカードコンポーネントのProps
- ProjectCardProps - プロジェクトカードコンポーネントのProps
- ConversationProps - 会話コンポーネントのProps
- FormFieldProps - フォームフィールドコンポーネントのProps

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「コンポーネントProps型」セクションを参照してください。

### 状態・コンテキスト型

状態型とコンテキスト型は、コンポーネント間で共有される状態を定義します。

**主要な状態・コンテキスト型:**
- AuthState - 認証状態
- AuthContext - 認証コンテキスト
- ProjectState - プロジェクト状態
- ProjectContext - プロジェクトコンテキスト
- FormState - フォーム状態
- ToastState - トースト通知状態
- ModalState - モーダル状態

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「状態・コンテキスト型」セクションを参照してください。

## キャッシュ関連型

キャッシュ関連型は、クライアントサイドのデータキャッシュに関連する型定義です。

**主要なキャッシュ関連型:**
- CacheKey - キャッシュキーの型
- CacheEntry<T> - キャッシュエントリの型
- CacheOptions - キャッシュオプションの型
- QueryState<T> - クエリの状態を表す型
- MutationState<T> - ミューテーションの状態を表す型

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「キャッシュ関連型」セクションを参照してください。

## AI固有型

AI固有型は、複数のAIプロバイダー（OpenAI、Anthropic、Google、オープンソースモデルなど）との連携に関連する型定義です。

### AIプロバイダーと基本型

**主要なAIプロバイダーと基本型:**
- AIProviderType - AIプロバイダーの列挙型
- AIModelType - AIモデルの種類の列挙型
- AIServiceError - AIサービスのエラー型
- AIRequestBase - AIリクエストの基本型
- AIResponseBase - AIレスポンスの基本型

```typescript
// AIプロバイダー列挙型
export enum AIProviderType {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  GOOGLE = 'GOOGLE',
  LOCAL = 'LOCAL',
  CUSTOM = 'CUSTOM'
}

// AIモデル種類列挙型
export enum AIModelType {
  COMPLETION = 'COMPLETION',
  CHAT = 'CHAT',
  EMBEDDING = 'EMBEDDING',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  MULTIMODAL = 'MULTIMODAL'
}

// AIサービスエラー型
export interface AIServiceError extends Error {
  provider: AIProviderType;
  code: string;
  status?: number;
  requestId?: string;
  timestamp: Date;
}

// 基本AIリクエスト型
export interface AIRequestBase {
  requestId: string;
  timestamp: Date;
}

// 基本AIレスポンス型
export interface AIResponseBase {
  requestId: string;
  provider: AIProviderType;
  model: string;
  timestamp: Date;
  latency?: number;
}
```

### AIモデル機能と設定型

**主要なAIモデル機能と設定型:**
- AIModelCapability - AIモデルの機能を表す型
- AIModelInfo - AIモデル情報
- AIModelConfig - AIモデル設定
- AICompletionOptions - 補完オプション
- AIStreamingOptions - ストリーミングオプション

```typescript
// AIモデル機能インターフェース
export interface AIModelCapability {
  supportedTypes: AIModelType[];
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsFunctions: boolean;
  contextWindow: number;
  tokenizerName: string;
  costPer1KTokens: {
    input: number;
    output: number;
  };
}

// AIモデル情報型
export interface AIModelInfo {
  id: string;
  provider: AIProviderType;
  name: string;
  version: string;
  capabilities: AIModelCapability;
  recommendedUseCase: string[];
  deprecated: boolean;
}

// AIモデル設定型
export interface AIModelConfig {
  model: string;
  provider: AIProviderType;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  timeout?: number;
  apiVersion?: string;
}

// AI補完オプション型
export interface AICompletionOptions {
  systemPrompt?: string;
  userPrompt: string;
  modelConfig?: Partial<AIModelConfig>;
  functions?: AIFunctionDefinition[];
  responseFormat?: 'text' | 'json';
}

// AIストリーミングオプション型
export interface AIStreamingOptions {
  enabled: boolean;
  onToken?: (token: string) => void;
  onChunk?: (chunk: AIChunk) => void;
  onComplete?: (response: AICompletionResponse) => void;
  onError?: (error: AIServiceError) => void;
}
```

### AIサービスインターフェース型

**主要なAIサービスインターフェース型:**
- AIServiceInterface - AIサービスのインターフェース
- AIServiceRegistry - AIサービスのレジストリ
- AIServiceFactory - AIサービスのファクトリ
- AITokenizer - トークン化インターフェース
- AIMetricsCollector - メトリクス収集インターフェース

```typescript
// AIサービスインターフェース
export interface AIServiceInterface {
  provider: AIProviderType;
  getModelInfo(modelId: string): AIModelInfo | null;
  listAvailableModels(): AIModelInfo[];
  completion(options: AICompletionOptions): Promise<AICompletionResponse>;
  streamingCompletion(options: AICompletionOptions & AIStreamingOptions): Promise<void>;
  embedding(text: string | string[], modelConfig?: Partial<AIModelConfig>): Promise<number[][]>;
  countTokens(text: string, modelId?: string): number;
  calculateCost(usage: TokenUsage, modelId: string): number;
}

// AIサービスレジストリ型
export interface AIServiceRegistry {
  register(provider: AIProviderType, service: AIServiceInterface): void;
  unregister(provider: AIProviderType): boolean;
  get(provider: AIProviderType): AIServiceInterface | null;
  getDefault(): AIServiceInterface;
  setDefault(provider: AIProviderType): boolean;
  listRegisteredProviders(): AIProviderType[];
}

// AIサービスファクトリ型
export interface AIServiceFactory {
  createService(provider: AIProviderType, config?: any): AIServiceInterface;
  createOpenAIService(config: OpenAIServiceConfig): AIServiceInterface;
  createAnthropicService(config: AnthropicServiceConfig): AIServiceInterface;
  createGoogleService(config: GoogleServiceConfig): AIServiceInterface;
  createLocalService(config: LocalServiceConfig): AIServiceInterface;
}

// AIトークナイザーインターフェース
export interface AITokenizer {
  encode(text: string): number[];
  decode(tokens: number[]): string;
  countTokens(text: string): number;
}

// AIメトリクスコレクターインターフェース
export interface AIMetricsCollector {
  recordCompletion(provider: AIProviderType, model: string, usage: TokenUsage, latency: number): void;
  recordEmbedding(provider: AIProviderType, model: string, inputSize: number, latency: number): void;
  recordError(provider: AIProviderType, model: string, error: AIServiceError): void;
  getUsageSummary(timeRange?: { start: Date; end: Date }): AIUsageSummary;
  getCostSummary(timeRange?: { start: Date; end: Date }): AICostSummary;
}
```

### プロバイダー固有の設定型

**主要なプロバイダー固有の設定型:**
- OpenAIServiceConfig - OpenAIサービス設定
- AnthropicServiceConfig - Anthropicサービス設定
- GoogleServiceConfig - Googleサービス設定
- LocalServiceConfig - ローカルモデルサービス設定

```typescript
// OpenAIサービス設定型
export interface OpenAIServiceConfig {
  apiKey: string;
  organization?: string;
  baseUrl?: string;
  defaultModel: string;
  apiVersion?: string;
  timeout?: number;
  maxRetries?: number;
}

// Anthropicサービス設定型
export interface AnthropicServiceConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel: string;
  version?: string;
  timeout?: number;
  maxRetries?: number;
}

// Googleサービス設定型
export interface GoogleServiceConfig {
  apiKey: string;
  projectId?: string;
  defaultModel: string;
  location?: string;
  timeout?: number;
  maxRetries?: number;
}

// ローカルモデルサービス設定型
export interface LocalServiceConfig {
  modelPath: string;
  defaultModel: string;
  hostUrl?: string;
  apiKey?: string;
  contextSize?: number;
  backend?: 'llama.cpp' | 'ggml' | 'custom';
}
```

### メッセージと会話型

**主要なメッセージと会話型:**
- AIMessage - AIメッセージ
- ConversationContext - 会話コンテキスト
- AIMessageRole - メッセージの役割
- AIChunk - ストリーミングチャンク
- TokenUsage - トークン使用量

```typescript
// AIメッセージ役割列挙型
export enum AIMessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  FUNCTION = 'function',
  TOOL = 'tool'
}

// AIメッセージ型
export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  name?: string;
  functionCall?: AIFunctionCall;
  toolCalls?: AIToolCall[];
  createdAt: Date;
}

// 会話コンテキスト型
export interface ConversationContext {
  id: string;
  messages: AIMessage[];
  metadata: Record<string, any>;
  tokenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// AIストリーミングチャンク型
export interface AIChunk {
  id: string;
  content: string;
  isDelta: boolean;
  finishReason?: string;
  toolCalls?: Partial<AIToolCall>[];
}

// トークン使用量型
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// AIツールコール型
export interface AIToolCall {
  id: string;
  type: string;
  name: string;
  arguments: string;
}

// AI関数定義型
export interface AIFunctionDefinition {
  name: string;
  description?: string;
  parameters: Record<string, any>;
  required?: string[];
}

// AI関数コール型
export interface AIFunctionCall {
  name: string;
  arguments: string;
}

// AI使用量サマリー型
export interface AIUsageSummary {
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  requestCount: number;
  byProvider: Record<AIProviderType, {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestCount: number;
  }>;
  byModel: Record<string, {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    requestCount: number;
  }>;
}

// AIコストサマリー型
export interface AICostSummary {
  totalCost: number;
  promptCost: number;
  completionCost: number;
  byProvider: Record<AIProviderType, {
    totalCost: number;
    promptCost: number;
    completionCost: number;
  }>;
  byModel: Record<string, {
    totalCost: number;
    promptCost: number;
    completionCost: number;
  }>;
  currency: string;
}
```

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「AI固有型」セクションを参照してください。

## 外部サービス連携型

外部サービス連携型は、外部APIやサービスとの連携に関連する型定義です。

**主要な外部サービス連携型:**
- OpenAIConfig - OpenAI API設定
- OpenAIRequest - OpenAI APIリクエスト
- OpenAIResponse - OpenAI APIレスポンス
- StorageServiceConfig - ストレージサービス設定
- StorageUploadRequest - ストレージアップロードリクエスト
- StorageUploadResponse - ストレージアップロードレスポンス
- StripeConfig - Stripe API設定
- PaymentIntent - 決済意図情報
- SubscriptionCreationRequest - サブスクリプション作成リクエスト

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「外部サービス連携型」セクションを参照してください。

## 国際化（i18n）関連型

国際化（i18n）機能に関連する型定義は、多言語対応のためのリソース管理と翻訳処理を型安全に行うために使用されます。

### 言語リソース型

**主要な言語リソース型:**
- LocaleCode - サポートされる言語コードの列挙型（例: 'ja', 'en'）
- TranslationKey - 翻訳キーを表すブランド型
- TranslationParams - プレースホルダーパラメータを表す型
- LocaleResource - 言語リソースの構造を表す型
- TranslationOptions - 翻訳関数のオプション設定を表す型

```typescript
// 言語コードの列挙型
export type LocaleCode = 'ja' | 'en';

// 翻訳キーのブランド型
export type TranslationKey = string & { readonly __brand: unique symbol };

// 翻訳パラメータ型
export type TranslationParams = Record<string, string | number | boolean | Date>;

// 言語リソース構造型
export interface LocaleResource {
  [key: string]: string | LocaleResource;
}

// 翻訳オプション型
export interface TranslationOptions {
  defaultValue?: string;
  formatParams?: boolean;
  locale?: LocaleCode;
}
```

### 翻訳サービス型

**主要な翻訳サービス型:**
- TranslationService - 翻訳サービスのインターフェース
- TranslatorFactory - 翻訳関数を生成するファクトリ
- TranslateFn - 翻訳を行う関数の型
- LocaleState - 現在の言語状態を表す型
- LocaleContextType - 言語コンテキストの型

```typescript
// 翻訳サービスインターフェース
export interface TranslationService {
  translate(key: TranslationKey, params?: TranslationParams, options?: TranslationOptions): string;
  changeLocale(locale: LocaleCode): Promise<void>;
  getCurrentLocale(): LocaleCode;
  getAvailableLocales(): LocaleCode[];
}

// 翻訳関数型
export type TranslateFn = (key: TranslationKey, params?: TranslationParams, options?: TranslationOptions) => string;

// 言語状態型
export interface LocaleState {
  currentLocale: LocaleCode;
  defaultLocale: LocaleCode;
  availableLocales: LocaleCode[];
  isLoading: boolean;
}

// 言語コンテキスト型
export interface LocaleContextType extends LocaleState {
  setLocale: (locale: LocaleCode) => Promise<void>;
  t: TranslateFn;
}
```

### 多言語AIプロンプト型

多言語AIプロンプト型は、AIプロンプトテンプレートの国際化対応を実現するための型定義です。

**主要な多言語AIプロンプト型:**
- LocalizedPromptTemplate - 多言語化されたプロンプトテンプレート
- LocalizedPromptKey - 多言語プロンプトの識別キー
- LocalizedPromptParams - 多言語プロンプトのパラメータ
- PromptLocalizationService - プロンプト多言語化サービス
- LanguageModelSettings - 言語ごとのAIモデル設定

   ```typescript
// 多言語化されたプロンプトテンプレート型
export interface LocalizedPromptTemplate {
  key: LocalizedPromptKey;
  templates: Record<LocaleCode, string>;
  defaultLocale: LocaleCode;
  metadata: {
    description: string;
    category: string;
    version: string;
    lastUpdated: Date;
  };
  parameterDescriptions?: Record<string, string>;
}

// 多言語プロンプトの識別キー型
export type LocalizedPromptKey = string & { readonly __brand: unique symbol };

// 多言語プロンプトのパラメータ型
export type LocalizedPromptParams = Record<string, string | number | boolean | Date | Array<any>>;

// プロンプト多言語化サービスインターフェース
export interface PromptLocalizationService {
  getLocalizedPrompt(key: LocalizedPromptKey, locale?: LocaleCode): string;
  renderLocalizedPrompt(key: LocalizedPromptKey, params: LocalizedPromptParams, locale?: LocaleCode): string;
  registerPromptTemplate(template: LocalizedPromptTemplate): void;
  getAvailablePromptKeys(): LocalizedPromptKey[];
}

// 言語ごとのAIモデル設定型
export interface LanguageModelSettings {
  locale: LocaleCode;
  preferredModel: string;
  temperatureAdjustment?: number;
  maxTokensAdjustment?: number;
  systemPromptSuffix?: string;
  culturalContextNotes?: string;
}
```

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「多言語AIプロンプト型」セクションを参照してください。

## 歴史的事例分析関連型

歴史的事例分析機能に関連する型定義は、事例データの構造、分析アルゴリズム、評価結果の表現に使用されます。

### 事例データモデル型

**主要な事例データモデル型:**
- CaseStudyId - 事例を識別するID型
- CaseStudy - 事例データのエンティティ型
- CaseStudyCategory - 事例のカテゴリを表す列挙型
- CaseStudyOutcome - 事例の結果を表す列挙型
- CaseStudyScale - 事例の規模を表す列挙型
- CaseStudyDuration - 事例の期間を表す型
- CaseStudyFactor - 事例の要因を表す型

   ```typescript
// 事例ID型
export type CaseStudyId = string & { readonly __brand: unique symbol };

// 事例カテゴリ列挙型
export enum CaseStudyCategory {
  TECH_STARTUP = 'TECH_STARTUP',
  RETAIL_BUSINESS = 'RETAIL_BUSINESS',
  SERVICE_INDUSTRY = 'SERVICE_INDUSTRY',
  MANUFACTURING = 'MANUFACTURING',
  HEALTHCARE = 'HEALTHCARE',
  EDUCATION = 'EDUCATION',
  FINANCE = 'FINANCE',
  OTHER = 'OTHER'
}

// 事例結果列挙型
export enum CaseStudyOutcome {
  SUCCESS = 'SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  FAILURE = 'FAILURE',
  MIXED = 'MIXED',
  ONGOING = 'ONGOING'
}

// 事例規模列挙型
export enum CaseStudyScale {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE'
}

// 事例期間型
export interface CaseStudyDuration {
  startDate: Date;
  endDate?: Date;
  durationMonths: number;
}

// 事例要因型
export interface CaseStudyFactor {
     name: string;
  importance: number; // 1-10 
  description: string;
  isPrimary: boolean;
}

// 事例エンティティ型
export interface CaseStudy {
  id: CaseStudyId;
  title: string;
  category: CaseStudyCategory;
  outcome: CaseStudyOutcome;
  scale: CaseStudyScale;
  duration: CaseStudyDuration;
  description: string;
  situation: string;
  actions: string;
  results: string;
  factors: CaseStudyFactor[];
  tags: string[];
  embeddings?: number[]; // ベクトル埋め込み
  createdAt: Date;
  updatedAt: Date;
}
```

### 分析エンジン型

**主要な分析エンジン型:**
- RiskAssessment - リスク評価結果を表す型
- RiskFactor - リスク要因を表す型
- RiskLevel - リスク水準を表す列挙型
- SuccessProbability - 成功確率を表す型
- SimilarityScore - 類似度スコアを表す型
- ImprovementSuggestion - 改善提案を表す型

   ```typescript
// リスク水準列挙型
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// リスク要因型
export interface RiskFactor {
  name: string;
  description: string;
  level: RiskLevel;
  impact: number; // 1-10
  probability: number; // 0.0-1.0
  score: number; // impact * probability
  evidenceCaseIds: CaseStudyId[]; // 根拠となる事例IDs
}

// 成功確率型
export interface SuccessProbability {
  overall: number; // 0.0-1.0
  byCategory: Record<string, number>;
  confidenceScore: number; // 0.0-1.0
  evidenceCaseIds: CaseStudyId[]; // 根拠となる事例IDs
}

// 類似度スコア型
export interface SimilarityScore {
  caseId: CaseStudyId;
  score: number; // 0.0-1.0
  matchedFactors: string[];
  relevantPoints: string[];
}

// 改善提案型
export interface ImprovementSuggestion {
  id: string;
  title: string;
  description: string;
  targetRiskFactors: string[];
  expectedImpact: number; // 1-10
  implementationDifficulty: number; // 1-10
  priorityScore: number; // expectedImpact / implementationDifficulty
  sourceCaseIds: CaseStudyId[]; // 提案の根拠となる事例IDs
  aiGenerated: boolean;
}

// リスク評価結果型
export interface RiskAssessment {
  projectId: string;
  overallRiskScore: number; // 0-100
  riskFactors: RiskFactor[];
  successProbability: SuccessProbability;
  similarCases: SimilarityScore[];
  improvementSuggestions: ImprovementSuggestion[];
  analysisDate: Date;
  version: string;
}
```

### 分析API型

**主要な分析API型:**
- AnalyzeProjectRequest - プロジェクト分析リクエスト型
- RiskAssessmentResponse - リスク評価レスポンス型
- SimilarCasesRequest - 類似事例検索リクエスト型
- SimilarCasesResponse - 類似事例検索レスポンス型
- GenerateImprovementsRequest - 改善提案生成リクエスト型
- ImprovementSuggestionsResponse - 改善提案レスポンス型

```typescript
// プロジェクト分析リクエスト型
export interface AnalyzeProjectRequest {
  projectId: string;
  projectData: Record<string, any>;
  analysisOptions?: {
    includeSimilarCases: boolean;
    includeImprovements: boolean;
    detailLevel: 'basic' | 'detailed' | 'comprehensive';
  };
}

// リスク評価レスポンス型
export interface RiskAssessmentResponse {
  assessment: RiskAssessment;
  analysisTime: number; // 分析にかかった時間（ミリ秒）
  status: 'success' | 'partial' | 'error';
  message?: string;
}

// 類似事例検索リクエスト型
export interface SimilarCasesRequest {
  projectData: Record<string, any>;
  category?: CaseStudyCategory;
  outcomeFilter?: CaseStudyOutcome[];
  limit?: number;
  minSimilarityScore?: number; // 0.0-1.0
}

// 類似事例検索レスポンス型
export interface SimilarCasesResponse {
  cases: Array<{
    caseStudy: CaseStudy;
    similarityScore: SimilarityScore;
  }>;
  totalResults: number;
  status: 'success' | 'partial' | 'error';
  message?: string;
}
```

### 時系列分析関連型

時系列分析に関連する型定義は、時間経過に伴うパターンやトレンドを分析し、将来予測を行うための構造を提供します。

**主要な時系列分析関連型:**
- TimeSeriesData - 時系列データの基本構造
- TimeSeriesPoint - 時系列上の単一データポイント
- TimeSeriesDataset - 複数の時系列データセット
- TimeSeriesAnalysisOptions - 分析オプション設定
- TimeSeriesAnalysisResult - 分析結果
- TimeSeriesForecast - 予測結果
- TimeSeriesPattern - 検出されたパターン

```typescript
// 時系列データポイント型
export interface TimeSeriesPoint<T = number> {
  timestamp: Date;
  value: T;
  metadata?: Record<string, any>;
}

// 時系列データ型
export interface TimeSeriesData<T = number> {
  id: string;
  name: string;
  category: string;
  unit?: string;
  points: TimeSeriesPoint<T>[];
  startDate: Date;
  endDate: Date;
  resolution: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

// 時系列データセット型
export interface TimeSeriesDataset {
  id: string;
  name: string;
  description?: string;
  series: TimeSeriesData[];
  correlationMatrix?: number[][];
  metadata: Record<string, any>;
}

// 時系列分析オプション型
export interface TimeSeriesAnalysisOptions {
  method: 'moving_average' | 'exponential_smoothing' | 'arima' | 'prophet' | 'lstm';
  windowSize?: number;
  seasonality?: boolean;
  decompose?: boolean;
  outlierDetection?: boolean;
  confidenceInterval?: number;
  forecastHorizon?: number;
  forecastResolution?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  compareWithHistorical?: boolean;
  baselineSeriesId?: string;
}

// 時系列分析結果型
export interface TimeSeriesAnalysisResult {
  id: string;
  datasetId: string;
  method: string;
  executionTime: number;
  createdAt: Date;
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
    stdDev: number;
    trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
    seasonality: boolean;
    outliers: TimeSeriesPoint[];
    changePoints: TimeSeriesPoint[];
  };
  decomposition?: {
    trend: TimeSeriesData;
    seasonal: TimeSeriesData;
    residual: TimeSeriesData;
  };
  patterns: TimeSeriesPattern[];
  forecast?: TimeSeriesForecast;
}

// 時系列パターン型
export interface TimeSeriesPattern {
  id: string;
  type: 'trend' | 'cycle' | 'seasonality' | 'spike' | 'dip' | 'change_point';
  confidence: number;
  startDate: Date;
  endDate: Date;
  description: string;
  affectedMetrics: string[];
  potentialCauses?: string[];
  visualRange?: [number, number];
}

// 時系列予測型
export interface TimeSeriesForecast {
  id: string;
  baseSeriesId: string;
  horizon: number;
  resolution: 'day' | 'week' | 'month' | 'quarter' | 'year';
  points: TimeSeriesPoint[];
  upperBound?: TimeSeriesPoint[];
  lowerBound?: TimeSeriesPoint[];
  confidenceInterval: number;
  accuracy: {
    mape?: number;
    rmse?: number;
    mae?: number;
    r2?: number;
  };
  scenarios?: {
    optimistic: TimeSeriesPoint[];
    pessimistic: TimeSeriesPoint[];
    mostLikely: TimeSeriesPoint[];
  };
}

// 時系列分析サービスインターフェース
export interface TimeSeriesAnalysisService {
  analyzeTimeSeries(dataset: TimeSeriesDataset, options: TimeSeriesAnalysisOptions): Promise<TimeSeriesAnalysisResult>;
  forecast(series: TimeSeriesData, horizon: number, options?: Partial<TimeSeriesAnalysisOptions>): Promise<TimeSeriesForecast>;
  detectPatterns(series: TimeSeriesData, patternTypes?: string[]): Promise<TimeSeriesPattern[]>;
  compareTimeSeries(series1: TimeSeriesData, series2: TimeSeriesData): Promise<{
    correlation: number;
    similarities: TimeSeriesPattern[];
    differences: TimeSeriesPattern[];
  }>;
  getSeasonalityProfile(series: TimeSeriesData): Promise<{
    hasSeasonality: boolean;
    period: number;
    strength: number;
    peaks: Date[];
    troughs: Date[];
  }>;
}

// 時系列データリポジトリインターフェース
export interface TimeSeriesRepository {
  saveTimeSeries(data: TimeSeriesData): Promise<string>;
  getTimeSeriesById(id: string): Promise<TimeSeriesData | null>;
  getTimeSeriesByCategory(category: string): Promise<TimeSeriesData[]>;
  saveAnalysisResult(result: TimeSeriesAnalysisResult): Promise<string>;
  getAnalysisResultById(id: string): Promise<TimeSeriesAnalysisResult | null>;
  getTimeSeriesDataset(id: string): Promise<TimeSeriesDataset | null>;
  createDataset(name: string, series: TimeSeriesData[]): Promise<TimeSeriesDataset>;
}
```

これらの型定義により、歴史的事例からビジネスプランの時間的な成功・失敗パターンを分析し、将来的なリスクを予測するための機能を実装することができます。時系列分析は、特に市場動向、成長率、収益変動などの予測に役立ちます。

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「時系列分析関連型」セクションを参照してください。

### 分析エンジン関連型

// ... existing code ...

## 型定義の包括的リストの更新

上記の国際化（i18n）と歴史的事例分析関連の型を含め、プロジェクト全体で必要な型の包括的なリストを以下に更新しました。この階層構造は、プロジェクトのディレクトリ構造と型の依存関係を反映しています。

```
基本型
├── ID型
│   ├── UserId, ProjectId, ProgramId
│   ├── StepId, OutputId, AttachmentId
│   ├── ConversationId, MessageId
│   ├── CaseStudyId, TranslationKey, LocalizedPromptKey
│   └── その他のドメイン固有ID型
├── 共通型
│   ├── Timestamp, DateOnly, Email
│   ├── EntityBase, TimeStampFields
│   └── 共通ユーティリティ型（Money等）
└── 列挙型
    ├── UserRole, ProjectStatus, ProgramStatus
    ├── ConversationType, StepType, OutputFormat
    ├── LocaleCode, CaseStudyCategory, RiskLevel
    └── Permission, SubscriptionTier, AIErrorCode

ドメインモデル型
├── エンティティ
│   ├── User, Team, Role
│   ├── Program, Step, StepCondition
│   ├── Project, Output, OutputVersion
│   ├── Conversation, Message
│   ├── Attachment, Subscription
│   ├── CaseStudy, RiskAssessment
│   └── その他のエンティティ
└── 値オブジェクト
    ├── EmailAddress, Password
    ├── PercentageProgress, HexColor
    ├── LocaleResource, TranslationParams
    ├── RiskFactor, ImprovementSuggestion
    └── その他の値オブジェクト

国際化関連型
├── 言語リソース型
│   ├── LocaleCode, TranslationKey
│   ├── TranslationParams, LocaleResource
│   └── TranslationOptions
├── 翻訳サービス型
│   ├── TranslationService, TranslateFn
│   ├── LocaleState, LocaleContextType
│   └── TranslatorFactory
└── 多言語AIプロンプト型
    ├── LocalizedPromptTemplate, LocalizedPromptKey
    ├── LocalizedPromptParams, PromptLocalizationService
    └── LanguageModelSettings

歴史的事例分析型
├── 事例データモデル型
│   ├── CaseStudy, CaseStudyId
│   ├── CaseStudyCategory, CaseStudyOutcome
│   ├── CaseStudyFactor, CaseStudyDuration
│   └── CaseStudyScale
├── 分析エンジン型
│   ├── RiskAssessment, RiskFactor
│   ├── RiskLevel, SuccessProbability
│   ├── SimilarityScore, ImprovementSuggestion
│   └── 分析アルゴリズム関連型
├── 時系列分析型
│   ├── TimeSeriesData, TimeSeriesPoint
│   ├── TimeSeriesPattern, TimeSeriesPrediction
│   ├── TrendAnalysisResult, SeasonalAnalysisResult
│   └── 時系列予測関連型
└── 分析API型
    ├── AnalyzeProjectRequest, RiskAssessmentResponse
    ├── SimilarCasesRequest, SimilarCasesResponse
    ├── TimeSeriesAnalysisRequest, TimeSeriesPredictionResponse
    └── GenerateImprovementsRequest, ImprovementSuggestionsResponse

データ永続化型
└── ...（既存のデータ永続化型）

APIインターフェース型
└── ...（既存のAPIインターフェース型）

UIコンポーネント型
└── ...（既存のUIコンポーネント型）

外部サービス連携型
└── ...（既存の外部サービス連携型）
```

> **参照**: 各型の詳細な実装例については「code_examples/05_type_definitions_examples.md」を参照してください。 