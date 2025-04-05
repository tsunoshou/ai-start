# 共通型定義・DB型定義

最終更新日: 2025-04-05

## 本ドキュメントの目的と位置づけ

このドキュメントは、AiStartプロジェクトにおける型定義の公式リファレンスです。「02_architecture_design.md」で概説されている型システムの詳細な実装例と具体的な型定義パターンを集約しています。開発者は型定義に関する詳細な情報や具体的な実装例については、常にこのドキュメントを参照してください。

「02_architecture_design.md」はアーキテクチャ全体の設計と概念を説明し、本ドキュメントは型定義に特化した詳細な実装指針を提供するという役割分担になっています。このドキュメントで定義された型定義パターンは、プロジェクト全体で一貫して使用してください。**本ドキュメントは [04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) で定義された実装ルールに準拠します。**

> **注意**: 詳細なコード例や実装サンプルは「code_examples/05_type_definitions_examples.md」を参照してください。本ドキュメントでは、概念的な説明と型定義の指針のみを提供します。

## 型定義の基本方針

AiStartプロジェクトでは型安全性を最優先し、各レイヤーに適切な型定義を配置して、重複を避けつつ責務の明確な分離を実現します。Typescriptの型システム、**`neverthrow` ライブラリによる Result 型を用いたエラーハンドリング**、および **`tsyringe` による依存性注入** を活用して、ドメインの概念を明確に表現し、コンパイル時の型チェックによって多くのバグを未然に防ぎます。

### 型の階層構造

型定義は以下の階層構造に従って配置します：

```
【ドメイン層】
├── 基本型定義
│   ├── ID型（エンティティ名+Id、例: `UserId`, `ProjectId`）
│   ├── 共通ユーティリティ型（例: `Brand`）
│   └── 列挙型（Enum、例: `UserRole`, `ProgramStatus`）
└── ドメインモデル型
    ├── エンティティ（EntityBase継承、例: `User`, `Project`）
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
│   └── 列挙型（Enum、例: `ExportFormat`, `SupportedLanguage`）
└── 共通レスポンスラッパー型
    └── QueryObject/ReadModel 型

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

1. **ドメイン層**: ビジネスロジックの中心となる型定義。外部依存を持たない純粋なドメインモデル（ID型、主要な値オブジェクト、エンティティ、**ドメイン固有の Enum** など）
2. **アプリケーション層**: ユースケースで使用される入出力型とDTO
3. **インフラストラクチャ層**: 永続化や外部サービスとの連携に必要な型
4. **共有リソース層**: 複数のレイヤーで共通に使用されるユーティリティ型、**汎用的な Enum**、共通エラー型、レスポンスラッパーなど
5. **設定層**: アプリケーション設定や環境変数に関連する型定義
6. **プレゼンテーション層**: UI構築とAPI通信に必要な型

### 型の網羅性ガイドライン

AiStartプロジェクトでは、型の網羅性を確保するために以下のガイドラインを定めています。開発時には常にこのガイドラインに照らして型の充実度を評価し、必要に応じて追加・修正を行ってください。

#### 必須カバレッジ領域

以下の領域は、必ず型定義によるカバレッジを100%確保してください：

1. **データモデル**
   - すべてのエンティティとその属性
   - すべての値オブジェクト
   - すべての集約間の関係性

2. **API通信**
   - すべてのAPIリクエスト/レスポンス
   - HTTPヘッダーや認証トークンの型
   - エラーレスポンスの型

3. **ユーザー入力**
   - すべてのフォーム入力値
   - バリデーション結果型
   - ユーザーイベント型

4. **状態管理**
   - グローバル状態
   - ローカルコンポーネント状態
   - キャッシュ状態

5. **外部連携**
   - AI API入出力型
   - 外部サービス連携型
   - ファイル/メディア型

#### 網羅性チェックリスト

新機能開発時には、以下のチェックリストを使用して型の網羅性を確認してください：

- [ ] 関連するすべてのエンティティに型が定義されているか
- [ ] APIリクエスト/レスポンスの型が定義されているか
- [ ] UIコンポーネントのProps型が定義されているか
- [ ] ユーザー入力に関する型が定義されているか
- [ ] 状態管理に関する型が定義されているか
- [ ] エラー状態に関する型が定義されているか
- [ ] 外部サービス連携に関する型が定義されているか
- [ ] テスト用モックに関する型が定義されているか

#### 型網羅性の継続的改善

型の網羅性は継続的に改善する必要があります。以下の取り組みにより型のカバレッジを向上させてください：

1. **定期的な型監査**
   - 四半期ごとに型の監査を実施
   - `// @ts-ignore`や`any`型の使用状況を確認し削減
   - 型エラーの発生パターンを分析し、共通型を抽出

2. **型生成ツールの活用**
   - OpenAPI定義からのAPI型自動生成
   - データベーススキーマからの型自動生成（Drizzle）
   - Zodスキーマからの型推論

3. **モニタリングとフィードバック**
   - 型関連のバグ発生状況を追跡
   - 開発者からの型定義改善提案を収集
   - 型カバレッジ指標の定期計測

### 型定義の意図と使い分け

AiStartプロジェクトでは、様々な種類の型が存在します。それぞれの型は特定の意図を持って設計されており、適切な場面で使い分けることが重要です。ここでは主要な型カテゴリの意図と適切な使い分けについて説明します。

#### エンティティ型 vs DTO型

**エンティティ型**
- **意図**: ドメインの概念モデルを表現し、ビジネスルールを適用する基盤を提供する
- **特徴**: IDを持ち、ライフサイクルを通じて同一性が保たれる、ビジネスロジックを含む
- **使用場面**: ドメイン層でのビジネスロジック処理、永続化前のデータ表現

**DTO型**
- **意図**: レイヤー間のデータ転送に特化し、ドメインロジックを持たない単純なデータ構造
- **特徴**: 読み取り専用で不変、最小限の検証のみ、プレゼンテーション向けに最適化
- **使用場面**: API応答、レイヤー間のデータ交換、UI表示用データ

```typescript
// エンティティ例（ビジネスルールを含む）
interface User extends EntityBase {
  id: UserId;
  email: Email;
  role: UserRole;
  
  // ビジネスメソッド
  canAccessResource(resource: Resource): boolean;
  upgradeToAdmin(): void;
}

// DTO例（単純なデータ構造）
interface UserDTO {
  readonly id: string;
  readonly email: string;
  readonly role: string;
  readonly createdAt: string;
}
```

#### 値オブジェクト vs プリミティブ型

**値オブジェクト**
- **意図**: 概念的に単一の値を表現し、ドメイン固有のルールをカプセル化する
- **特徴**: 不変性を持ち、等価性は値に基づく、自己検証機能を持つ
- **使用場面**: 複雑なドメイン概念表現、ドメイン固有ルールの適用

**プリミティブ型（+型エイリアス）**
- **意図**: 単純なデータ型として使用し、コード内での明確な意図を示す
- **特徴**: 軽量、単純、型チェックのみを提供
- **使用場面**: 単純な値の表現、パフォーマンスクリティカルな処理

```typescript
// 値オブジェクト例
class EmailAddress {
  private readonly value: string;
  
  constructor(email: string) {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    this.value = email;
  }
  
  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  toString(): string {
    return this.value;
  }
  
  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }
}

// 型エイリアス例
type Email = string;
```

#### インターフェース vs タイプエイリアス

**インターフェース**
- **意図**: 実装すべき契約を定義し、拡張性と一貫性を確保する
- **特徴**: 宣言的マージがサポート、クラス実装の基盤、拡張可能
- **使用場面**: リポジトリやサービスの契約定義、継承関係のある型構造、将来の拡張がありうる型

**タイプエイリアス**
- **意図**: 型の別名付けや複合型の作成により、コードの可読性と再利用性を高める
- **特徴**: ユニオン型・インターセクション型の定義に最適、リテラル型との組み合わせが容易
- **使用場面**: 複合型の定義、関数型の定義、特定の条件を満たす型の抽出

```typescript
// インターフェース例
interface Repository<T extends EntityBase> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<boolean>;
}

// タイプエイリアス例
type Result<T> = 
  | { status: 'success'; data: T; }
  | { status: 'error'; error: Error; };

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
```

#### フロントエンド固有型

**Props型**
- **意図**: コンポーネント間のデータ・コールバック受け渡しを型安全に行う
- **使用場面**: すべてのReactコンポーネント

**状態型**
- **意図**: コンポーネントやアプリケーションの状態を表現し、状態遷移を型安全にする
- **使用場面**: useStateフック、Reducerの状態、グローバル状態

**コンテキスト型**
- **意図**: コンポーネントツリーを通じて提供される値の型を定義する
- **使用場面**: Reactコンテキスト、プロバイダーコンポーネント

```typescript
// Props型例
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

// 状態型例
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// コンテキスト型例
interface ThemeContext {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}
```

#### バックエンド固有型

**スキーマ型**
- **意図**: データベースの構造を型安全に定義し、ORM操作の型安全性を確保する
- **使用場面**: Drizzleスキーマ定義、マイグレーション

**リポジトリ返却型**
- **意図**: データアクセス層からの戻り値を明確に型付けし、エラーハンドリングを統一する
- **使用場面**: リポジトリメソッド、データアクセス関数

**API Handlers型**
- **意図**: Next.jsのAPIルートハンドラの型付けにより、リクエスト/レスポンスの安全性を確保する
- **使用場面**: API Routes、サーバーアクション

```typescript
// スキーマ型例
const usersSchema = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  role: varchar('role', { enum: ['user', 'admin'] }).notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// リポジトリ返却型例
type RepositoryResult<T> = 
  | { success: true; data: T; }
  | { success: false; error: RepositoryError; };

// API Handlers型例
type ApiHandler<T = any> = (
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse<T>>
) => Promise<void>;
```

#### ユーティリティ型と型変換

**ユーティリティ型**
- **意図**: 既存の型から新しい型を生成し、DRYの原則を守りつつ型安全性を確保する
- **使用場面**: 型の変換、部分的な型の抽出、条件付き型

**型ガード関数**
- **意図**: 実行時の型チェックと型の絞り込みを行い、型安全な分岐処理を可能にする
- **使用場面**: ユーザー入力の検証、外部データの型チェック、条件分岐

**マッパー型**
- **意図**: 異なるレイヤー間でのデータ変換を型安全に行う
- **使用場面**: エンティティ⇔DTO変換、DB結果⇔ドメインモデル変換

```typescript
// ユーティリティ型例
type Nullable<T> = T | null;
type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 型ガード関数例
function isUser(value: any): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    'role' in value
  );
}

// マッパー型例
interface EntityMapper<Entity, Dto> {
  toEntity(dto: Dto): Entity;
  toDto(entity: Entity): Dto;
}
```

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
- PasswordHash - パスワードハッシュを表す値オブジェクト
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

エラー型は、アプリケーション全体で一貫したエラーハンドリングを実現するための型定義です。**本プロジェクトでは `neverthrow` ライブラリの `Result<T, E>` 型を標準的なエラー処理方法として採用します。** これにより、成功と失敗のパスを型レベルで明確に分離します。

**エラーハンドリング基本方針:**
1.  **`Result<T, E>` の使用**: 関数やメソッドが失敗する可能性がある場合、戻り値の型として `Result` を使用します。 `T` は成功時の値の型、`E` は失敗時のエラーの型です。
2.  **カスタムエラー型の定義**: `E` として使用するエラー型は、`BaseError` を継承して定義します。エラーには一意の `code` (エラーコードを示す文字列リテラルユニオン型を推奨) と `message` を含めます。必要に応じてエラーの原因 (`cause`) も含めることができます。
3.  **エラーの伝播**: 下位レイヤーで発生したエラーは、必要に応じて上位レイヤーのエラー型にマッピングされ、`Result.err` として伝播されます。エラーマッピングは各レイヤーの境界で行います。
4.  **エラーの種類**: 主要なエラーカテゴリとして `DomainError`, `ApplicationError`, `InfrastructureError` を定義し、具体的なエラーはこれらを継承します。

**主要なエラー関連型:**
- `Result<T, E>` (`neverthrow` からインポート) - 関数の成功/失敗を表す基本型
- `BaseError` - 全カスタムエラーの基底インターフェース (`name`, `message`, `code`, `cause?` を含む)
- `DomainError` - ドメインロジック違反を表すエラー (`BaseError` を継承)
- `ApplicationError` - ユースケース実行時のエラー (`BaseError` を継承)
- `InfrastructureError` - DBアクセス、外部API呼び出し等のエラー (`BaseError` を継承)
- `ValidationError` - バリデーション失敗時のエラー (`ApplicationError` や `DomainError` を継承)
- `NotFoundError` - リソースが見つからない場合のエラー (`InfrastructureError` や `ApplicationError` を継承)
- `AuthenticationError`, `AuthorizationError` - 認証・認可エラー (`ApplicationError` を継承)
- `AIErrorCode` - AI関連エラーコードの列挙型 (`InfrastructureError` の `code` として使用)
- `AuthErrorCode` - 認証関連エラーコードの列挙型 (`AuthenticationError`/`AuthorizationError` の `code` として使用)
- `DataErrorCode` - データ関連エラーコードの列挙型 (`InfrastructureError` の `code` として使用)
- `AIServiceError` - AI機能のエラー情報を表す型 (`InfrastructureError` を継承)
- `ErrorResponse` - APIエラーレスポンスの標準フォーマット

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「共通エラー型」セクションを参照してください。 **`Result` 型の使用例やカスタムエラーの実装パターンも含まれます。**

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

DTO（Data Transfer Object）型は、異なるレイヤー間でデータを転送するために使用される型です。特にドメインモデルとAPIレスポンス/リクエスト間の変換、**および Next.js のサーバーコンポーネント (SC) とクライアントコンポーネント (CC) 間でのデータ受け渡し** に使用されます。

DTOの命名規則は「名詞+DTO」のパターンを使用します。

**DTOの設計原則:**
1.  必要な属性のみを含める（最小限の情報）
2.  ビジネスロジックを含めない
3.  **シリアライズ/デシリアライズが容易な単純なデータ構造を使用** (SC/CC間連携では特に重要。DateオブジェクトなどはISO 8601形式の文字列に変換する)
4.  ドメインモデルとは明確に区別する
5.  **読み取り専用 (`readonly`) を推奨** し、意図しない変更を防ぐ

> **参照**: 具体的な実装例については「code_examples/05_type_definitions_examples.md」の「DTO型の役割と設計原則」セクションを参照してください。 **SC/CC間連携用のDTO例も含まれます。**

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

## 主要機能の型定義

このセクションでは、AiStartプロジェクトの主要機能における型定義を詳細に説明します。

### チャット機能における型定義

チャット機能においては、メッセージの送受信、コンテキスト管理、AI応答の処理など多様な操作を安全かつ効率的に行うための型定義が必要です。

#### メッセージ関連型定義

```typescript
// メッセージ種別の列挙型
enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

// 基本メッセージ型
interface BaseMessage {
  id: MessageId;
  role: MessageRole;
  content: string;
  createdAt: Date;
}

// ユーザーメッセージ固有の型
interface UserMessage extends BaseMessage {
  role: MessageRole.USER;
  metadata?: {
    clientId?: string;
    userAgent?: string;
  };
}

// アシスタントメッセージ固有の型
interface AssistantMessage extends BaseMessage {
  role: MessageRole.ASSISTANT;
  metadata: {
    model: string;
    temperature?: number;
    inferenceEffort?: 'low' | 'medium' | 'high';
    tokenUsage?: {
      prompt: number;
      completion: number;
      total: number;
    };
  };
}

// システムメッセージ固有の型
interface SystemMessage extends BaseMessage {
  role: MessageRole.SYSTEM;
  metadata?: {
    purpose: 'initialization' | 'context' | 'instruction';
    priority: number;
  };
}

// メッセージユニオン型
type Message = UserMessage | AssistantMessage | SystemMessage;
```

#### 会話関連型定義

```typescript
// 会話種別の列挙型
enum ConversationType {
  INITIAL = 'initial',
  CONTINUATION = 'continuation',
  CHECK = 'check',
  CREATION = 'creation'
}

// 会話コンテキスト型
interface ConversationContext {
  id: ConversationId;
  projectId: ProjectId;
  stepId: StepId;
  type: ConversationType;
  messages: Message[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastActive: Date;
    title?: string;
    summary?: string;
  };
}

// コンテキスト圧縮設定型
interface ContextCompressionConfig {
  maxMessages: number;
  maxTokens: number;
  retentionStrategy: 'removeOldest' | 'summarize' | 'hybrid';
  keepSystemMessages: boolean;
}
```

#### チャットAPI関連型定義

```typescript
// チャットリクエスト型
interface ChatRequest {
  conversationId?: ConversationId;
  message: string;
  projectId: ProjectId;
  stepId: StepId;
  type: ConversationType;
  inferenceEffort?: 'low' | 'medium' | 'high';
}

// チャットレスポンス型
interface ChatResponse {
  message: AssistantMessage;
  conversation: {
    id: ConversationId;
    messageCount: number;
    isComplete: boolean;
  };
  actionItems?: {
    type: 'suggestion' | 'task' | 'resource';
    content: string;
  }[];
}
```

### ステップ管理の型定義

ステップ管理は、プログラムの進行を追跡し、条件付きアクセスを管理するための重要な機能です。

#### ステップ基本型定義

```typescript
// ステップ種別の列挙型
enum StepType {
  CONTENT = 'content',
  TASK = 'task',
  CHECKPOINT = 'checkpoint',
  ASSESSMENT = 'assessment'
}

// ステップ完了条件の列挙型
enum CompletionConditionType {
  MANUAL = 'manual',
  CONTENT_VIEWED = 'content_viewed',
  DELIVERABLE_CREATED = 'deliverable_created',
  CHAT_COMPLETED = 'chat_completed',
  COMBINED = 'combined',
  TIME_SPENT = 'time_spent',
  ASSESSMENT_PASSED = 'assessment_passed'
}

// 基本ステップ型
interface Step {
  id: StepId;
  programId: ProgramId;
  type: StepType;
  title: string;
  description: string;
  order: number;
  isRequired: boolean;
  estimatedDuration: number; // 分単位
  prerequisites: StepId[];
  completionConditions: StepCompletionCondition[];
  content: {
    instructions?: string;
    resources?: Resource[];
    videoIds?: VideoId[];
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    version: number;
    tags?: string[];
  };
}
```

#### ステップ完了条件型定義

```typescript
// ステップ完了条件のベース型
interface BaseCompletionCondition {
  type: CompletionConditionType;
  description: string;
}

// 手動完了条件
interface ManualCompletionCondition extends BaseCompletionCondition {
  type: CompletionConditionType.MANUAL;
}

// コンテンツ視聴完了条件
interface ContentViewedCompletionCondition extends BaseCompletionCondition {
  type: CompletionConditionType.CONTENT_VIEWED;
  contentIds: string[];
  minimumViewPercentage: number; // 0-100
}

// 成果物作成完了条件
interface DeliverableCreatedCompletionCondition extends BaseCompletionCondition {
  type: CompletionConditionType.DELIVERABLE_CREATED;
  requiredFields: string[];
  minimumContentLength?: number;
}

// チャット完了条件
interface ChatCompletedCompletionCondition extends BaseCompletionCondition {
  type: CompletionConditionType.CHAT_COMPLETED;
  minimumMessageCount?: number;
  requiredTopics?: string[];
}

// 複合完了条件
interface CombinedCompletionCondition extends BaseCompletionCondition {
  type: CompletionConditionType.COMBINED;
  conditions: BaseCompletionCondition[];
  logicalOperator: 'AND' | 'OR';
}

// 完了条件のユニオン型
type StepCompletionCondition =
  | ManualCompletionCondition
  | ContentViewedCompletionCondition
  | DeliverableCreatedCompletionCondition
  | ChatCompletedCompletionCondition
  | CombinedCompletionCondition;
```

#### ステップ進捗型定義

```typescript
// 進捗状態の列挙型
enum ProgressStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  LOCKED = 'locked'
}

// ユーザーステップ進捗の型
interface StepProgress {
  userId: UserId;
  stepId: StepId;
  programId: ProgramId;
  projectId: ProjectId;
  status: ProgressStatus;
  startedAt?: Date;
  completedAt?: Date;
  lastActiveAt: Date;
  completedConditions: {
    conditionType: CompletionConditionType;
    completedAt: Date;
  }[];
  metadata: {
    timeSpent: number; // 秒単位
    visitCount: number;
    notes?: string;
  };
}
```

### プロンプト管理の型定義

プロンプト管理は、AI対話のテンプレートを効率的に管理するための型定義を提供します。

#### プロンプトテンプレート型定義

```typescript
// プロンプトテンプレート型
interface PromptTemplate {
  id: PromptTemplateId;
  name: string;
  description: string;
  templateText: string;
  variables: PromptVariable[];
  defaultModel: string;
  defaultParameters: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
    inferenceEffort?: 'low' | 'medium' | 'high';
  };
  category: 'chat' | 'creation' | 'check' | 'system';
  conversationType: ConversationType;
  stepTypes: StepType[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: UserId;
    updatedBy: UserId;
    version: number;
    isActive: boolean;
  };
}

// プロンプト変数型
interface PromptVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
  };
}
```

#### プロンプトバージョン管理型定義

```typescript
// プロンプトバージョン型
interface PromptVersion {
  id: PromptVersionId;
  promptTemplateId: PromptTemplateId;
  version: number;
  templateText: string;
  variables: PromptVariable[];
  changelog: string;
  createdAt: Date;
  createdBy: UserId;
  isActive: boolean;
}

// プロンプトA/Bテスト型
interface PromptABTest {
  id: PromptABTestId;
  name: string;
  description: string;
  promptAId: PromptVersionId;
  promptBId: PromptVersionId;
  distribution: { // A:Bの比率（例: 50:50）
    promptA: number;
    promptB: number;
  };
  metrics: {
    primaryMetric: 'responseQuality' | 'completionRate' | 'userSatisfaction';
    secondaryMetrics: string[];
  };
  startDate: Date;
  endDate?: Date;
  status: 'draft' | 'active' | 'completed' | 'archived';
  results?: {
    promptA: {
      sampleSize: number;
      metrics: Record<string, number>;
    };
    promptB: {
      sampleSize: number;
      metrics: Record<string, number>;
    };
    winner?: 'A' | 'B' | 'tie';
    confidenceLevel?: number;
  };
}
```

### ビデオコンテンツ管理の型定義

ビデオコンテンツ管理は、学習リソースとしてのビデオを効率的に管理するための型定義を提供します。

#### ビデオ基本型定義

```typescript
// ビデオプロバイダーの列挙型
enum VideoProvider {
  YOUTUBE = 'youtube',
  VIMEO = 'vimeo',
  INTERNAL = 'internal',
  OTHER = 'other'
}

// ビデオ基本型
interface Video {
  id: VideoId;
  title: string;
  description: string;
  duration: number; // 秒単位
  provider: VideoProvider;
  providerId: string; // YouTube ID、Vimeo IDなど
  url: string;
  thumbnailUrl: string;
  tags: string[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    uploadedBy?: UserId;
    language: string;
    transcriptAvailable: boolean;
    captions?: {
      language: string;
      url: string;
    }[];
    quality: {
      resolution: string;
      bitrate?: number;
    };
  };
}
```

#### ビデオ視聴進捗型定義

```typescript
// ビデオ視聴進捗型
interface VideoProgress {
  id: string;
  userId: UserId;
  videoId: VideoId;
  projectId?: ProjectId;
  stepId?: StepId;
  watchedSeconds: number;
  totalSeconds: number;
  percentage: number; // 0-100
  lastPosition: number; // 最後に視聴していた位置（秒）
  completed: boolean;
  watchHistory: {
    timestamp: Date;
    position: number;
    duration: number; // この視聴セッションでの視聴時間
  }[];
  firstWatchedAt: Date;
  lastWatchedAt: Date;
  metadata: {
    device?: string;
    playbackSpeed?: number;
    viewCount: number; // 視聴開始回数
  };
}
```

#### ビデオプレイリスト型定義

```typescript
// ビデオプレイリスト型
interface VideoPlaylist {
  id: VideoPlaylistId;
  title: string;
  description: string;
  videos: {
    videoId: VideoId;
    order: number;
    isRequired: boolean;
    notes?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: UserId;
  isPublic: boolean;
  programIds?: ProgramId[]; // このプレイリストが関連付けられているプログラム
}
```

// ... existing code ...

// 値オブジェクト例（UserName）
class UserName {
  private readonly value: string;

  constructor(name: string) {
    // ここでは簡易的なバリデーションのみ記載。
    // 実際のコードではZodなどを使用してより詳細なバリデーションを行う。
    if (!name || name.length > 50) { 
      throw new Error('Invalid user name');
    }
    this.value = name;
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserName): boolean {
    return this.value === other.value;
  }
}

// 型エイリアス例
type Email = string;