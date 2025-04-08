# サーバー実装

最終更新日: 2025-04-03

## 本ドキュメントの目的

このドキュメントは、AiStartプロジェクトにおけるサーバーサイドアプリケーションの実装詳細について記述します。関連ドキュメントとの役割の違いは以下のとおりです：

- **01_requirements_definition.md**：「何を」実現するのか（What）
- **02_architecture_design.md**：「どのように」実現するのか（How - アーキテクチャレベル）
- **04_implementation_rules.md**：「どのように書くか」（Write - 実装レベル規約）
- **07_server_implementation.md**：「どのように実装されているか」（Implement - サーバー具体例）

02で定義されたアーキテクチャ設計に基づき、04で定められた実装ルールに従って、具体的なサーバーサイドの実装パターン、API設計、主要コンポーネントの構造などを説明します。

## サーバーアプリケーションの構造

サーバーアプリケーションは、[02_architecture_design.md](/docs/restructuring/02_architecture_design.md) で定義されたDDD風ヘキサゴナルアーキテクチャに基づき、以下の主要な層（レイヤー）で構成されます。

app/ # Next.js App Router (プレゼンテーション層の一部)
├── (auth)/
├── (dashboard)/
├── api/ # API Routes (プレゼンテーション層)
└── [...locale]/
domain/ # ドメイン層
├── models/
├── services/
├── repositories/ # インターフェース
└── events/
application/ # アプリケーション層
├── usecases/
└── dtos/
infrastructure/ # インフラストラクチャ層
├── database/
│ ├── schema/
│ ├── migrations/
│ └── repositories/ # 実装
├── ai/
├── mappers/
├── auth/
└── external-services/


各層の責務と依存関係は `02_architecture_design.md` の定義に従います。依存関係は常に内側（ドメイン層）に向かいます。

## API設計原則

APIエンドポイントの設計においては、以下の原則に従います。

1.  **リソース指向**: URIはリソース（名詞）を表し、HTTPメソッド（GET, POST, PUT, PATCH, DELETE）が操作（動詞）を表す。
    -   例: `GET /api/projects`, `POST /api/projects`, `GET /api/projects/{projectId}`

2.  **階層構造の適切な表現**: リソース間の親子関係や所属関係をURIパスで表現する。
    -   例: `GET /api/projects/{projectId}/steps`

3.  **一貫性のあるレスポンス形式**:
    -   成功時: `200 OK`, `201 Created`, `204 No Content` など。**`shared/utils/api.utils.ts` の `apiSuccess` が生成する `{ success: true, data: ... }` 形式を標準とします。**
    -   エラー時: 標準化されたエラーレスポンス形式（[05_type_definitions.md](/docs/05_type_definitions.md) 参照）を使用し、適切なHTTPステータスコード（4xx, 5xx）を返す。 **`shared/utils/api.utils.ts` の `apiError` が生成する `{ success: false, error: { code, message, details? } }` 形式を標準とし、`handleApiError` ユーティリティによって `AppError` や `ZodError` から自動生成されます。** `AppResult` 型のエラー情報を適切に変換する。

4.  **HATEOAS (Hypermedia as the Engine of Application State) の適用**: レスポンスに関連リソースへのリンクを含めることで、APIの自己記述性と発見可能性を高める（必要に応じて）。

5.  **バージョニング**: 将来的な変更に備え、APIバージョニング戦略を検討（初期段階ではv1を想定）。URIパスにバージョンを含める (`/api/v1/...`)。

6.  **冪等性 (Idempotency)**: GET, PUT, DELETEメソッドは冪等性を保証する。POSTは冪等性を保証しない。PATCHは条件付きで冪等。

## 主要な実装パターン

### 依存性注入 (Dependency Injection) (`tsyringe` 利用)

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md) および [04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) で定義された通り、`tsyringe` を用いて依存性注入を実装します。

1.  **コンテナ設定**:
    -   **`config/container.config.ts`** でDIコンテナ (`tsyringe` の `container`) を設定し、必要な依存関係を登録します。
    -   データベース接続 (`drizzle` インスタンス）、ロガー (`LoggerInterface`)、リポジトリ (`UserRepositoryInterface`)、ユースケース (`CreateUserUsecase` など）を登録します。

    ```typescript
    // 例: config/container.config.ts
    import 'reflect-metadata';
    import { drizzle } from 'drizzle-orm/node-postgres';
    import { Pool } from 'pg';
    import { container } from 'tsyringe';
    import { CreateUserUsecase } from '@/application/usecases/user/create-user.usecase';
    import { ENV } from '@/config/environment';
    import {
      UserRepositoryInterface,
      UserRepositoryToken,
    } from '@/domain/repositories/user.repository.interface';
    import { UserRepository } from '@/infrastructure/database/repositories/user.repository';
    import { ConsoleLogger } from '@/shared/logger/console.logger';
    import { LoggerInterface } from '@/shared/logger/logger.interface';
    import { LoggerToken } from '@/shared/logger/logger.token';
    // ... 他のユースケースやリポジトリのインポート ...

    // --- データベース接続 (Singleton) ---
    const pool = new Pool({ connectionString: ENV.DATABASE_URL });
    const db = drizzle(pool);
    container.register<typeof db>('Database', { useValue: db });

    // --- Logger ---
    container.register<LoggerInterface>(LoggerToken, {
      useClass: ConsoleLogger,
    });

    // --- リポジトリ (トークンを使用) ---
    container.register<UserRepositoryInterface>(UserRepositoryToken, {
      useClass: UserRepository,
    });
    // ... 他のリポジトリ登録 ...

    // --- ユースケース (具象クラスを直接登録) ---
    container.register(CreateUserUsecase, { useClass: CreateUserUsecase });
    // ... 他のユースケース登録 ...

    export default container;
    ```

2.  **クラスへの適用**:
    -   注入可能にするクラスには `@injectable()` デコレータを付与します。
    -   依存性を注入する箇所（コンストラクタインジェクション推奨）では `@inject(トークン)` または `@inject(クラス名)` デコレータを使用します。

    ```typescript
    // 例: application/usecases/user/create-user.usecase.ts
    import { inject, injectable } from 'tsyringe';
    import { ok, err } from 'neverthrow';
    import { UserDTO } from '@/application/dtos/user.dto';
    import {
      UserRepositoryInterface,
      UserRepositoryToken,
    } from '@/domain/repositories/user.repository.interface';
    import { User } from '@/domain/models/user/user.entity';
    import { UserName } from '@/domain/models/user/user-name.vo';
    import { Email } from '@/shared/value-objects/email.vo';
    import { PasswordHash } from '@/shared/value-objects/password-hash.vo';
    import { hashPassword } from '@/shared/utils/security/password.utils';
    import { AppResult } from '@/shared/types/common.types';
    import { AppError } from '@/shared/errors/app.error';
    import { ErrorCode } from '@/shared/errors/error-code.enum';
    import { LoggerInterface } from '@/shared/logger/logger.interface';
    import { LoggerToken } from '@/shared/logger/logger.token';
    import { UserMapper } from '@/infrastructure/mappers/user.mapper';

    // ... CreateUserInput 型定義 ...

@injectable()
    export class CreateUserUsecase {
      constructor(
        @inject(UserRepositoryToken) private readonly userRepository: UserRepositoryInterface,
        @inject(LoggerToken) private readonly logger: LoggerInterface
      ) {}

      async execute(input: CreateUserInput): Promise<AppResult<UserDTO>> {
        // 1. Input Validation & Value Object Creation (例: UserName, Email)
        // ... zod/VO を使ったバリデーション ...
        // エラー時は err(new AppError(ErrorCode.ValidationError, ...)) を返す

        // 2. Password Hashing
        const hashedPasswordResult = await hashPassword(input.passwordPlainText, this.logger);
        if (hashedPasswordResult.isErr()) {
          this.logger.error(...);
          return err(new AppError(ErrorCode.PasswordHashingFailed, ..., { cause: hashedPasswordResult.error }));
        }
        const passwordHashVoResult = PasswordHash.create(hashedPasswordResult.value);
        // ... passwordHashVoResult のエラーハンドリング ...

        // 3. Domain Entity Creation
        const userCreateResult = User.create({ name: nameVo, email: emailVo, passwordHash: passwordHashVo });
        if (userCreateResult.isErr()) {
          this.logger.error(...);
          return err(new AppError(ErrorCode.DomainRuleViolation, ..., { cause: userCreateResult.error }));
        }
        const userEntity = userCreateResult.value;

        // 4. Repository Interaction (save)
        const saveResult = await this.userRepository.save(userEntity);
        if (saveResult.isErr()) {
          this.logger.error(...);
          // エラーは既に AppError か InfrastructureError なので、そのまま返すか、必要に応じてラップ
          return err(saveResult.error);
        }

        this.logger.info({
          message: 'User created successfully',
          operation: 'createUser',
          userId: userEntity.id.value,
        });

        // 5. Output Mapping (to DTO)
        const output = UserMapper.toDTO(userEntity);

        return ok(output);
      }
    }
    ```

3.  **スコープ管理**:
    -   `@singleton()`: アプリケーション全体で単一のインスタンス。DBクライアントや設定オブジェクトなどに使用。
    -   `@scoped(Lifecycle.ResolutionScoped)`: 依存関係が解決されるたびに新しいインスタンス（デフォルト）。
    -   `@scoped(Lifecycle.ContainerScoped)`: コンテナごとに単一のインスタンス。
    -   **リクエストスコープ**: Next.js の API Routes や Server Actions ごとにインスタンスを生成したい場合（例: リクエスト固有のユーザー情報、トランザクション管理）、`tsyringe` の子コンテナ (`container.createChildContainer()`) をリクエスト処理の開始時に生成し、終了時に破棄するパターンを検討します。これにより、リクエスト固有の依存性（例: 認証済みユーザー情報オブジェクト）を安全に注入できます。

4.  **API Routes / Server Actions での使用**:
    -   各ハンドラー関数でDIコンテナから必要なユースケースを取得します。
    -   **`shared/utils/api.utils.ts` の `processApiRequest` を使用することで、リクエスト処理、バリデーション、ハンドラー実行、レスポンス生成を簡潔に記述できます。**

   ```typescript
    // 例: app/api/users/route.ts
    import 'reflect-metadata';
    import { NextRequest } from 'next/server';
    import { z } from 'zod';
    import { CreateUserUsecase } from '@/application/usecases/user/create-user.usecase';
    import container from '@/config/container.config';
    import { processApiRequest } from '@/shared/utils/api.utils'; // ★ インポート

    // Zod スキーマで入力データを定義・検証
    const createUserSchema = z.object({
      name: z.string().min(1, 'Name is required').max(50),
      email: z.string().email('Invalid email format'),
      passwordPlainText: z.string().min(8, 'Password must be at least 8 characters'),
    });

    export async function POST(request: NextRequest) {
      // ★ processApiRequest を使用して処理を委譲
      return processApiRequest(request, {
        bodySchema: createUserSchema, // Zod スキーマでボディを検証
        successStatus: 201, // 成功時のステータスコード
        handler: async (createUserDto) => {
          // ★ DI コンテナからユースケースを取得
          const createUserUsecase = container.resolve(CreateUserUsecase);
          // ★ ユースケースを実行 (createUserDto は検証済みのデータ)
          const result = await createUserUsecase.execute(createUserDto);

          // ★ AppResult のエラーをスローすると processApiRequest が handleApiError で処理
          if (result.isErr()) {
            throw result.error;
          }

          // ★ 成功時のデータを返す
          return result.value;
        },
      });
    }
    ```

### リポジトリの実装とエラーハンドリング

リポジトリインターフェースは `domain/repositories` に、その実装は `infrastructure/database/repositories` に配置され、**`infrastructure/database/repositories/base.repository.ts` の `BaseRepository` クラスを継承することで、共通のCRUD操作が提供されます。**

各リポジトリメソッドの標準動作として以下が定義されています（`BaseRepository` により保証）：

1. **`findById` / `findByEmail` 等の検索メソッド**: 
   - **戻り値**: `Promise<AppResult<TDomain | null>>`
   - エンティティが見つからない場合は `ok(null)` を返します。
   - DB接続エラーなどの技術的エラーの場合は `err(InfrastructureError)` を返します。
   - マッピングエラー（DBレコードからドメインエンティティへの変換失敗）の場合も `err(InfrastructureError)` を返します。

2. **`delete` メソッド**:
   - **戻り値**: `Promise<AppResult<void>>`
   - 冪等性を保証するため、対象エンティティが存在しない場合でも **成功 (`ok(undefined)`)** として扱います。
   - DB接続エラーなどの技術的エラーの場合は `err(InfrastructureError)` を返します。

3. **`save` メソッド（作成/更新）**:
   - **戻り値**: `Promise<AppResult<void>>`
   - ユニーク制約違反（例: 既存のメールアドレスで新規ユーザー作成）の場合：
     - **`err(AppError)` を返し、エラーコードは `ErrorCode.ConflictError` が設定されます。**
     - `BaseRepository` 内で、DBエラー（特定の `error.code`）を検知し、`ConflictError` に変換します。
   - マッピングエラー（ドメインエンティティからDBレコード形式への変換失敗）の場合は `err(InfrastructureError)` を返します。
   - DB接続エラーなどの技術的エラーの場合は `err(InfrastructureError)` を返します。

#### エラーコンテキスト情報の追加

`AppError` クラスとそのサブクラス (`InfrastructureError`, `ValidationError`) は、エラーデバッグに役立つコンテキスト情報（メタデータ）を追加するためのメソッドを提供します。

```typescript
import { AppError, InfrastructureError, ValidationError, ErrorCode } from '@/shared/errors';

// 例1: リポジトリでの InfrastructureError
return err(
  new InfrastructureError(
    ErrorCode.DatabaseError,
    `Failed to find user by email ${email.value}`,
    { cause: dbError }
  ).withMetadata({ operation: 'findByEmail', email: email.value })
);

// 例2: ユースケースでの ValidationError
return err(
  new ValidationError('Invalid user name format', {
    cause: nameResult.error, // ZodError など
    value: input.name,
  }).withEntityContext('user', input.userId ?? 'unknown', 'updateProfile')
);

// 例3: 既存のエラーにコンテキストを追加
if (saveResult.isErr()) {
  return err(saveResult.error.withMetadata({ step: 'saveUser' }));
}
```

ロガー (`LoggerInterface`) は、エラーオブジェクトを第2引数に受け取った場合、自動的に `cause` や `metadata` をログに出力するように実装されています (例: `ConsoleLogger`)。

### ロギングの実装とベストプラクティス

アプリケーション全体で一貫したロギングを実現するために、**`shared/logger/logger.interface.ts` で定義された `LoggerInterface`** を中心としたロギング機構を採用しています。**`shared/logger/logger.token.ts` の `LoggerToken`** を使用して、具体的なロガー実装（例: `shared/logger/console.logger.ts` の `ConsoleLogger`）がDIコンテナを通じて注入されます。

##### ロガーの構造

1.  **インターフェース定義 (`LoggerInterface`)**: `info`, `warn`, `error`, `debug` の各メソッドを定義します。`error` メソッドはエラーオブジェクト (`unknown`) を第二引数として受け取ることができます。

2.  **DI設定**: `config/container.config.ts` で `LoggerToken` に対して具体的なロガー実装（例: `ConsoleLogger`）を登録します。

3.  **利用**: 各クラス（Usecase, Repository, Service など）のコンストラクタで `LoggerInterface` を `@inject(LoggerToken)` で注入し、ログ出力に使用します。

    ```typescript
    import { inject, injectable } from 'tsyringe';
    import { LoggerInterface, LoggerToken } from '@/shared/logger';

@injectable()
    export class MyService {
      constructor(@inject(LoggerToken) private readonly logger: LoggerInterface) {}

      doSomething(input: string) {
        this.logger.info({ message: 'Starting doSomething', input });
        try {
          // ... 処理 ...
          this.logger.debug({ message: 'Intermediate step successful', data: ... });
          // ...
        } catch (error) {
          this.logger.error({ message: 'Failed to doSomething', input }, error);
          // ... エラーハンドリング ...
        }
      }
    }
    ```

##### ログレベルの使い分け

-   **`debug`**: 開発中の詳細なトレース情報。本番環境では通常出力しない。
-   **`info`**: 通常の操作ログ、リクエストの開始/終了、重要な状態変化など。
-   **`warn`**: 予期しないが、即座にエラーではない状況。軽微な設定ミス、非推奨APIの使用、リトライ可能な一時的なエラーなど。
-   **`error`**: 処理の失敗、例外のキャッチ、外部サービスの接続不可など、対応が必要な問題。

##### 構造化ログ

可能な限り **構造化ログ** (`LogData` オブジェクト形式) を使用します。これにより、ログの解析や集計が容易になります。

```typescript
// 悪い例
this.logger.error('Failed to process user ' + userId + ' due to: ' + error.message);

// 良い例 (構造化ログ)
this.logger.error({
  message: 'Failed to process user',
  userId: userId,
  operation: 'processUserData'
}, error);
```

ロガーの実装（例: `ConsoleLogger`）は、エラーオブジェクトが渡された場合、その `message`, `stack`, `cause`, `metadata` などの詳細情報もログに含めるようにします。

## APIエンドポイント一覧

プロジェクトで提供される主要なAPIエンドポイントの構造を示します。詳細なリクエスト/レスポンス形式は、関連する型定義や実装を参照してください。

### 一般ユーザー向けAPI (/api/v1 想定)

このプレフィックス下のAPIは、認証された一般ユーザー (`User` ロール) が基本的な操作を行うために使用します。
**中間ロール (例: `Editor`) のアクセス**: 特定の操作 (例: コンテンツ編集) については、`Editor` ロールもこのプレフィックス下のAPIを利用する場合があります。その場合、アクセス権限は後述の**ミドルウェア層**でロールに基づいて厳格にチェックされます。

├── auth/ # 認証関連 (公開アクセス可能)
│ ├── google/callback
│ ├── github/callback
│ ├── signout
│ └── session
├── projects/ # プロジェクト管理 (原則 User ロール, 一部 Editor/Admin も GET 可能など)
│ ├── GET / # 自身のプロジェクト一覧取得 (ReadModel利用)
│ ├── POST / # プロジェクト新規作成
│ ├── GET /{projectId} # プロジェクト詳細取得 (ReadModel/DTO)
│ ├── PATCH /{projectId} # プロジェクト更新
│ ├── DELETE /{projectId} # プロジェクト削除
│ └── GET /{projectId}/steps # 特定プロジェクトのステップ一覧
├── steps/ # ステップ実行関連 (原則 User ロール)
│ ├── GET /{stepId} # ステップ詳細取得
│ ├── PATCH /{stepId} # ステップ更新 (進捗、ユーザー入力など)
│ └── POST /{stepId}/complete # ステップ完了
├── conversations/ # AI会話履歴 (原則 User ロール)
│ ├── POST / # 新規会話開始 or メッセージ追加
│ ├── GET /{conversationId} # 会話履歴取得
│ └── GET /project/{projectId} # 特定プロジェクトの会話一覧
├── ai/ # AIサービス連携 (原則 User ロール)
│ └── chat # チャットメッセージ送信・応答取得 (ステップ内、相談室など)
├── outputs/ # 成果物関連 (原則 User ロール)
│ ├── GET /project/{projectId} # 特定プロジェクトの成果物一覧
│ ├── GET /{outputId} # 成果物詳細取得
│ └── POST /{outputId}/export # 成果物エクスポート
├── subscriptions/ # 自身のサブスクリプション管理 (原則 User ロール)
│ ├── GET / # 現在のプラン情報取得
│ ├── POST /checkout # プラン変更・新規契約チェックアウト (Stripe連携)
│ ├── POST /portal # カスタマーポータル (Stripe連携)
│ └── GET /plans # 利用可能なプラン一覧取得
└── users/ # 自身のユーザー情報 (原則 User ロール)
├── GET /me # 自身のユーザー情報取得
└── PATCH /me # ユーザー情報更新

### 管理者向けAPI (/api/admin/v1 想定)

このプレフィックス下のAPIは、**`Admin` ロールを持つユーザー専用**です。システム全体の管理操作に使用されます。ミドルウェアで `Admin` ロールが強制されます。

├── users/ # ユーザー管理
│ ├── GET / # ユーザー一覧取得 (検索・フィルタリング・ページネーション対応)
│ ├── GET /{userId} # 特定ユーザー詳細取得
│ ├── PATCH /{userId}/role # ユーザーロール変更
│ └── PATCH /{userId}/status # ユーザーアカウント状態変更 (有効/無効)
├── programs/ # プログラム管理
│ ├── GET / # プログラム一覧取得 (検索・フィルタリング対応)
│ ├── POST / # プログラム新規作成
│ ├── GET /{programId} # プログラム詳細取得
│ ├── PUT /{programId} # プログラム更新
│ ├── DELETE /{programId} # プログラム削除
│ └── PATCH /{programId}/publish # プログラム公開/非公開設定
├── steps/ # ステップ管理
│ ├── GET /program/{programId} # 特定プログラムのステップ一覧取得
│ ├── POST /program/{programId} # ステップ新規作成
│ ├── GET /{stepId} # ステップ詳細取得
│ ├── PUT /{stepId} # ステップ更新
│ ├── DELETE /{stepId} # ステップ削除
│ └── POST /reorder # ステップ順序変更
├── prompts/ # プロンプト管理
│ ├── GET / # プロンプト一覧取得
│ ├── POST / # プロンプト新規作成
│ ├── GET /{promptId} # プロンプト詳細取得 (バージョン含む)
│ ├── PUT /{promptId} # プロンプト更新
│ ├── DELETE /{promptId} # プロンプト削除
│ └── GET /{promptId}/versions # 特定プロンプトのバージョン履歴
├── videos/ # ビデオ管理
│ ├── GET / # ビデオ一覧取得
│ ├── POST / # ビデオ新規アップロード/登録
│ ├── GET /{videoId} # ビデオ詳細取得
│ ├── PUT /{videoId} # ビデオ情報更新
│ └── DELETE /{videoId} # ビデオ削除
├── subscription-plans/ # サブスクリプションプラン管理
│ ├── GET / # プラン一覧取得
│ ├── POST / # プラン新規作成
│ ├── GET /{planId} # プラン詳細取得
│ ├── PUT /{planId} # プラン更新
│ └── DELETE /{planId} # プラン削除
└── dashboard/ # 管理ダッシュボード用データ
└── GET /summary # 主要指標のサマリー取得

## ユーティリティAPI

開発や運用を支援するためのユーティリティAPIを提供します。

-   `GET /api/health`: サーバーのヘルスチェック用エンドポイント。DB接続なども確認。
-   `GET /api/docs`: API仕様ドキュメント（Swagger/OpenAPI）へのアクセス（開発環境のみ）。

## 認証・認可ミドルウェア

Next.js のミドルウェア (`middleware.ts`) またはそれに準ずる仕組み (例: 各APIルート/ルートグループに適用するラッパー関数) を使用して、API Routes やページへのアクセス制御を一元的に行います。

1.  **セッション検証**: リクエストに含まれるセッショントークン（JWT）を検証し、有効なユーザーセッションが存在するか確認します。
2.  **パスとロールに基づいた認可**: リクエストされたパス (例: `/api/v1/projects`, `/api/admin/users`) と HTTP メソッド (GET, POST, PATCH など) に基づき、**要求されるロール**を定義します。
    *   `/api/admin/**` へのアクセスは `Admin` ロールのみに制限します。
    *   `/api/v1/**` へのアクセスは、操作内容に応じて必要なロール (例: `User`, `Editor`, `Admin` のいずれか、または `Editor` 以上など) をチェックします。例えば、`PATCH /api/v1/articles/{id}` は `Editor` または `Admin` ロールが必要、といったルールを適用します。
    *   リクエスト元のユーザーが要求されるロールを持っていない場合は、403 Forbidden エラーを返却します。
3.  **リソース所有権チェックの考慮**: 必要に応じて、ミドルウェア層またはユースケース層でリソースの所有権チェック (リクエストユーザーが対象リソースを操作する権限を持つか) も行います。
4.  **ページアクセス制御**: 認証が必要なページ (`/dashboard`, `/admin` など) への未認証アクセスはログインページへリダイレクトします。特定のロールが必要なページ (`/admin` は `Admin` ロールのみ) へのアクセスも制御します。
5.  **RLS用情報**: 検証済みユーザーIDやロール情報をリクエストコンテキストに追加し、後続の処理（特にRLS）で利用可能にします。

**重要**: 認可ロジックは可能な限りこのミドルウェア層で完結させ、APIハンドラ（Route HandlerやServer Actionの本体）内部での複雑なロールに基づく条件分岐を最小限に抑えることで、セキュリティと保守性を高めます。

## まとめ

本ドキュメントでは、AiStartプロジェクトのサーバーサイド実装に関する主要なパターンと構造を説明しました。DDD風ヘキサゴナルアーキテクチャ、DI、Result型によるエラーハンドリング、QueryObject/ReadModel、SC/CC連携ルールなどを適用することで、保守性、テスト容易性、拡張性の高いサーバーアプリケーションを目指します。具体的な実装は、[04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) の規約に従い、関連するコード例を参照してください。