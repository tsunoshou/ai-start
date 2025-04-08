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
    -   成功時: `200 OK`, `201 Created`, `204 No Content`
    -   エラー時: 標準化されたエラーレスポンス形式（[05_type_definitions.md](/docs/restructuring/05_type_definitions.md) 参照）を使用し、適切なHTTPステータスコード（4xx, 5xx）を返す。 `Result` 型のエラー情報を適切に変換する。

4.  **HATEOAS (Hypermedia as the Engine of Application State) の適用**: レスポンスに関連リソースへのリンクを含めることで、APIの自己記述性と発見可能性を高める（必要に応じて）。

5.  **バージョニング**: 将来的な変更に備え、APIバージョニング戦略を検討（初期段階ではv1を想定）。URIパスにバージョンを含める (`/api/v1/...`)。

6.  **冪等性 (Idempotency)**: GET, PUT, DELETEメソッドは冪等性を保証する。POSTは冪等性を保証しない。PATCHは条件付きで冪等。

## 主要な実装パターン

### 依存性注入 (Dependency Injection) (`tsyringe` 利用)

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md) および [04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) で定義された通り、`tsyringe` を用いて依存性注入を実装します。

1.  **コンテナ設定**:
    -   アプリケーションのエントリーポイント（例: `app/api/.../route.ts` やカスタムサーバー）でDIコンテナを初期化し、必要な依存関係を登録します。
    -   環境設定 (`config/`) や外部サービス接続クライアント (`infrastructure/`) などを登録します。

```typescript
    // 例: infrastructure/di/container.config.ts
    import { container } from 'tsyringe';
    import { PrismaClient } from '@prisma/client'; // 仮のDBクライアント
    import { OpenAIClient } from '@/infrastructure/ai/providers/openai';
    import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
    import { ProjectRepository } from '@/infrastructure/database/repositories/ProjectRepository';
    import { IAiService } from '@/application/services/IAiService';
    import { AiService } from '@/infrastructure/ai/AiService';

    // --- シングルトンインスタンスの登録 ---
    container.register<PrismaClient>(PrismaClient, { useValue: new PrismaClient() });
    container.register<OpenAIClient>(OpenAIClient, {
      useValue: new OpenAIClient(process.env.OPENAI_API_KEY!),
    });

    // --- インターフェースと実装の紐付け (トークン使用) ---
    // リポジトリなど、実装が変わりうるものはトークンを使うことが多い
    container.register<IProjectRepository>('IProjectRepository', {
      useClass: ProjectRepository,
    });
    container.register<IAiService>('IAiService', { useClass: AiService });

    export { container };
    ```

2.  **クラスへの適用**:
    -   注入可能にするクラスには `@injectable()` デコレータを付与します。
    -   依存性を注入する箇所（コンストラクタインジェクション推奨）では `@inject(トークン)` デコレータを使用します。

```typescript
    // 例: application/usecases/project/CreateProjectUsecase.ts
    import { inject, injectable } from 'tsyringe';
    import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
    import { Project } from '@/domain/models/entities/Project';
    import { Result, ok, err } from 'neverthrow';
    import { ApplicationError } from '@/shared/errors/ApplicationError';

@injectable()
    export class CreateProjectUsecase {
  constructor(
        @inject('IProjectRepository') private projectRepository: IProjectRepository
      ) {}

      async execute(userId: string, name: string): Promise<Result<Project, ApplicationError>> {
        try {
          const project = Project.create(userId, name); // ドメインロジックで生成
          const saveResult = await this.projectRepository.save(project);
          if (saveResult.isErr()) {
            // リポジトリからのエラーをラップして返す
            return err(new ApplicationError('Failed to save project', { cause: saveResult.error }));
          }
          return ok(saveResult.value);
        } catch (error) {
          // ドメイン層での予期せぬエラーなど
          return err(new ApplicationError('Unexpected error creating project', { cause: error }));
        }
  }
}
```

3.  **スコープ管理**:
    -   `@singleton()`: アプリケーション全体で単一のインスタンス。DBクライアントや設定オブジェクトなどに使用。
    -   `@scoped(Lifecycle.ResolutionScoped)`: 依存関係が解決されるたびに新しいインスタンス（デフォルト）。
    -   `@scoped(Lifecycle.ContainerScoped)`: コンテナごとに単一のインスタンス。
    -   **リクエストスコープ**: Next.js の API Routes や Server Actions ごとにインスタンスを生成したい場合（例: リクエスト固有のユーザー情報、トランザクション管理）、`tsyringe` の子コンテナ (`container.createChildContainer()`) をリクエスト処理の開始時に生成し、終了時に破棄するパターンを検討します。これにより、リクエスト固有の依存性（例: 認証済みユーザー情報オブジェクト）を安全に注入できます。

4.  **API Routes / Server Actions での使用**:
    -   各ハンドラー関数の冒頭でDIコンテナから必要なユースケースやサービスを取得します。

   ```typescript
    // 例: app/api/projects/route.ts
    import { container } from '@/infrastructure/di/container.config';
    import { CreateProjectUsecase } from '@/application/usecases/project/CreateProjectUsecase';
    import { NextResponse } from 'next/server';
import { z } from 'zod';
    import { Result } from 'neverthrow';
    import { handleApiError } from '@/presentation/utils/handleApiError'; // エラーハンドリング用ユーティリティ

    const createProjectSchema = z.object({
      userId: z.string(),
      name: z.string().min(1),
    });

    export async function POST(request: Request) {
      const body = await request.json();
      const validation = createProjectSchema.safeParse(body);

      if (!validation.success) {
      return NextResponse.json(
          { error: 'Invalid input', details: validation.error.errors },
          { status: 400 }
        );
      }

      const { userId, name } = validation.data;

      // ★ DIコンテナからユースケースを取得
      const createProjectUsecase = container.resolve(CreateProjectUsecase);

      const result: Result<any, any> = await createProjectUsecase.execute(userId, name);

      return result.match(
        (project) => NextResponse.json(project, { status: 201 }),
        (error) => handleApiError(error) // ★ 標準エラーハンドラーで処理
      );
    }
    ```

### リポジトリの実装とエラーハンドリング

リポジトリインターフェースは `domain/repositories` に、その実装は `infrastructure/database/repositories` に配置され、`BaseRepository` クラスを通じて共通操作が提供されます。

各リポジトリメソッドの標準動作として以下が定義されています：

1. **`findById` / `findByXXX` メソッド**: 
   - エンティティが見つからない場合は `ok(null)` を返します。これは「見つからない」ことは正常系として扱い、呼び出し側でnullチェックを行うことを意味します。
   - 技術的エラー（DB接続失敗など）の場合のみ `err(new InfrastructureError(...))` を返します。

2. **`delete` メソッド**:
   - 冪等性を保証するため、対象エンティティが存在しない場合でも **成功 (`ok(undefined)`)** として扱います。
   - これにより、同一IDに対する複数回の削除操作が安全に行えます。
   - 技術的エラー（DB接続失敗など）の場合のみ `err(new InfrastructureError(...))` を返します。

3. **`save` メソッド（作成/更新）**:
   - ユニーク制約違反（例: 既存のメールアドレスで新規ユーザー作成）の場合：
     - `AppError(ErrorCode.ConflictError, ...)` を返します。
     - エラーは `withMetadata()` メソッドを使用し、競合したフィールド名など、詳細情報を含めます。
   - 技術的エラー（DB接続失敗など）の場合は `err(new InfrastructureError(...))` を返します。

これらの挙動は `BaseRepository` クラスで標準化されており、子クラスでオーバーライドしない限り一貫して適用されます。

#### エラーコンテキスト情報の追加

`AppError` クラスは、エラーデバッグに役立つコンテキスト情報（メタデータ）を追加するための便利なメソッドを提供します：

```typescript
// エンティティ関連エラーにコンテキストを追加する例
throw new AppError(ErrorCode.NotFound, 'User not found')
  .withEntityContext('user', userId, 'find');

// カスタムメタデータの追加例
throw new AppError(ErrorCode.ValidationError, 'Invalid input')
  .withMetadata({ 
    field: 'email', 
    value: inputEmail,
    validationRule: 'email-format'
  });
```

ロギング時にこれらのメタデータを含めることで、エラーの原因分析が容易になります。

### ロギングの実装とベストプラクティス

アプリケーション全体で一貫したロギングを実現するために、`LoggerInterface` を中心としたロギング機構を採用しています。このインターフェースはDIコンテナを通じて注入され、各クラスで一貫したロギング方法を提供します。

##### ロガーの構造

1. **インターフェース定義**:
   ```typescript
   // @/shared/logger/logger.interface.ts
   export interface LoggerInterface {
     info(data: LogData | string): void;
     warn(data: LogData | string): void;
     error(data: LogData | string, error?: unknown): void;
     debug(data: LogData | string): void;
   }
   
   export interface LogData {
     message: string;
     [key: string]: unknown; // 任意の構造化データ
   }
   ```

2. **DI設定**:
   - `LoggerToken` シンボルを使用してDIコンテナに登録
   - デフォルト実装として `ConsoleLogger` クラスを提供
   ```typescript
   // config/container.config.ts
   container.register<LoggerInterface>(LoggerToken, {
     useClass: ConsoleLogger,
   });
   ```

3. **ロガーのインジェクション**:
   ```typescript
   @injectable()
   export class SomeService {
     constructor(
       @inject(LoggerToken) private readonly logger: LoggerInterface
     ) {}
     
     someMethod() {
       this.logger.info({
         message: '操作が成功しました',
         operation: 'someMethod',
         additionalData: 'データ'
       });
     }
   }
   ```

##### ロギングのガイドライン

1. **直接 `console.*` を使用しない**：
   - コード内で直接 `console.log`, `console.error` などを使用せず、必ず `LoggerInterface` 経由でログを出力します。
   - 旧式の `/infrastructure/utils/logger.ts` ユーティリティも非推奨であり、代わりにDIコンテナから注入された `LoggerInterface` を使用してください。
   - これにより、環境に応じたログレベルのフィルタリングや、構造化ログの一貫した形式が保証されます。

2. **クラス作成時に `LoggerInterface` をインジェクトする**:
   - サービス、リポジトリ、ユースケースなどのクラスを作成する際は、常にコンストラクタで `LoggerInterface` をインジェクトします。
   - 特にエラー処理やデータアクセスを行うクラスでは、ロガーは必須の依存関係です。

3. **構造化ログを優先し、標準フォーマットに従う**：
   - 単純な文字列より、構造化オブジェクトを使ったログを優先します。
   - すべてのログは以下の標準フォーマットに従います：
   
   ```typescript
   interface StandardLogFormat {
     // 必須フィールド
     message: string;           // ログの主要なメッセージ
     operation: string;         // 実行中の操作 (メソッド名やイベント名)
     
     // 状況に応じて推奨されるフィールド
     entityType?: string;       // 操作対象のエンティティタイプ (User, Project など)
     entityId?: string;         // 操作対象のID (userIdなど)
     traceId?: string;          // 分散トレーシングID (複数のサービスやリクエストをまたぐ場合)
     duration?: number;         // 操作にかかった時間 (ミリ秒)
     requestId?: string;        // HTTPリクエストID
     
     // その他のコンテキスト情報
     [key: string]: unknown;    // 操作に関連するその他の有用な情報
   }
   ```
   
   ログ出力例：
   ```typescript
   // 基本的な使用例
   this.logger.info({
     message: 'ユーザーを作成しました',
     operation: 'createUser',
     entityType: 'User',
     entityId: user.id.value,
     email: user.email.value    // コンテキスト固有の追加情報
   });
   
   // エラーログの例
   this.logger.error({
     message: 'ユーザー作成に失敗しました',
     operation: 'createUser',
     entityType: 'User',
     email: input.email,
     errorCode: ErrorCode.ValidationError
   }, error); // エラーオブジェクトを第2引数に渡す
   
   // パフォーマンスログの例
   this.logger.info({
     message: 'データベース操作が完了しました',
     operation: 'findUsers',
     entityType: 'User',
     duration: elapsedTimeMs,
     count: users.length,
     filters: JSON.stringify(queryFilters)
   });
   ```
   
   注意事項：
   - 個人を特定できる情報（PII）はログに含めないでください（パスワード、トークンなど）
   - 大きなオブジェクトを完全にログに記録することは避け、必要な情報のみを抽出してください
   - エラーログでは、必ずエラーオブジェクトを第2引数として渡し、スタックトレースを保持してください

4. **適切なログレベルの使用**：
   以下に各ログレベルの詳細な定義と使用ガイドラインを示します：
   
   - **info**:
     - システムの正常な動作状態を表すログ
     - ユーザーやその他のエンティティの作成・更新・削除など、重要なビジネスイベント
     - API呼び出しの開始と完了
     - ユーザー認証やセッション関連イベント
     - バッチ処理やスケジュールタスクの開始と完了
     - 例：`"ユーザーが作成されました"`, `"バッチ処理が完了しました (100件処理)"`
   
   - **warn**:
     - 潜在的な問題や異常だが、アプリケーションは依然として機能している状態
     - 非推奨APIやメソッドの使用
     - パフォーマンス問題（遅いクエリ、高いCPU使用率など）
     - ビジネスルール違反（重複リクエスト、特定の制限に近づいた場合など）
     - 自動リトライが発生した場合
     - 例：`"クエリ実行に5秒以上かかりました"`, `"非推奨のAPIエンドポイントが呼び出されました"`
   
   - **error**:
     - アプリケーションやシステムコンポーネントが正常に機能できない状態
     - 例外やエラー（特に未処理や予期しないもの）
     - サードパーティサービスやデータベースへの接続失敗
     - データ整合性違反
     - ビジネスクリティカルな操作の失敗
     - 例：`"データベース接続に失敗しました"`, `"ユーザー作成中に例外が発生しました"`
   
   - **debug**:
     - 詳細なシステム動作情報（開発環境やトラブルシューティング時のみ有効）
     - 詳細な変数値やオブジェクトの状態
     - メソッドの入力/出力値
     - 内部処理のフロー
     - パフォーマンス測定の詳細
     - 例：`"ユーザーリポジトリ呼び出し - 入力パラメータ: {...}"`, `"処理時間: 45ms"`

5. **一貫したコンテキスト情報**：
   - エンティティ操作には `entityType`, `entityId`, `operation` などの情報を含めます。
   - ユーザー関連操作には `userId` を含めます（個人情報は含めない）。
   - API関連では `endpoint`, `method`, `statusCode` などを含めます。

6. **エラーログには詳細情報を含める**：
   - `logger.error()` の第2引数にエラーオブジェクトを渡し、スタックトレースを保持します。
   - `AppError` のメタデータを活用して、エラーの詳細情報をログに含めます。
   ```typescript
   try {
     // 何らかの操作
   } catch (error) {
     this.logger.error({
       message: 'ユーザー作成中にエラーが発生しました',
       userId: request.email,
       operation: 'createUser'
     }, error); // エラーオブジェクトを第2引数に渡す
     
     throw new AppError(ErrorCode.InternalServerError, 'ユーザー作成中にエラーが発生しました', {
       cause: error instanceof Error ? error : undefined
     });
   }
   ```

7. **ヘルパー関数を使用する場合もロガーを渡す**:
   - ユーティリティやヘルパー関数を作成する場合は、パラメータとして `logger` を受け取るようにします。
   ```typescript
   export async function someHelper(data: SomeData, logger: LoggerInterface): Promise<Result<void, Error>> {
     try {
       // 実装
       logger.info({
         message: 'ヘルパー関数が成功しました',
         operation: 'someHelper'
       });
       return ok(undefined);
     } catch (error) {
       logger.error({
         message: 'ヘルパー関数でエラーが発生しました',
         operation: 'someHelper'
       }, error);
       return err(error);
     }
   }
   ```

#### 実装例（ユースケースクラス）

```typescript
@injectable()
export class CreateUserUsecase {
  constructor(
    @inject(UserRepositoryToken)
    private readonly userRepository: UserRepositoryInterface,
    @inject(LoggerToken)
    private readonly logger: LoggerInterface
  ) {}

  async execute(input: CreateUserInput): Promise<Result<UserDTO, AppError>> {
    // Email検証
    const emailResult = Email.create(input.email);
    if (emailResult.isErr()) {
      this.logger.warn({
        message: `Invalid email format: ${input.email}`,
        email: input.email,
        operation: 'createUser'
      });
      
      return err(
        new AppError(ErrorCode.ValidationError, `Invalid email format: ${emailResult.error.message}`)
      );
    }
    
    // ユーザー作成ロジック
    
    try {
      // 新しいユーザーの保存
      const saveResult = await this.userRepository.save(newUser);
      if (saveResult.isErr()) {
        this.logger.error({
          message: `Failed to save new user: ${input.email}`,
          email: input.email,
          operation: 'createUser'
        }, saveResult.error);
        
        return err(
          new AppError(ErrorCode.DatabaseError, 'Failed to create user account', {
            cause: saveResult.error,
          })
        );
      }
      
      this.logger.info({
        message: `User created successfully: ${input.email}`,
        userId: newUser.id.value,
        email: input.email,
        operation: 'createUser'
      });
      
      // 成功
      return ok(UserMapper.toDTO(newUser));
    } catch (error) {
      this.logger.error({
        message: 'Unexpected error during user creation',
        email: input.email,
        operation: 'createUser'
      }, error);
      
      return err(
        new AppError(ErrorCode.InternalServerError, 'An unexpected error occurred', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }
}
```

#### 実装例（リポジトリクラス）

```typescript
@injectable()
export class UserRepository implements UserRepositoryInterface {
  constructor(
    @inject('Database') private readonly db: NodePgDatabase,
    @inject(LoggerToken) private readonly logger: LoggerInterface
  ) {}

  async findById(id: UserId): Promise<Result<User | null, InfrastructureError>> {
    try {
      this.logger.debug({
        message: 'ユーザー検索を実行します',
        userId: id.value,
        operation: 'findById'
      });
      
      // DB操作
      
      if (!user) {
        this.logger.info({
          message: 'ユーザーが見つかりませんでした',
          userId: id.value,
          operation: 'findById'
        });
        return ok(null);
      }
      
      return ok(user);
    } catch (error) {
      this.logger.error({
        message: 'ユーザー検索に失敗しました',
        userId: id.value,
        operation: 'findById'
      }, error);
      
      return err(
        new InfrastructureError(`Failed to find user by ID: ${id.value}`, {
          cause: error instanceof Error ? error : undefined
        })
      );
    }
  }
}
```

### エラーハンドリング (`neverthrow` 利用)

[04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) および [05_type_definitions.md](/docs/restructuring/05_type_definitions.md) で定義されたエラーハンドリング方針に基づき、`neverthrow` の `Result` 型を全面的に採用します。

1.  **関数の戻り値**:
    -   失敗する可能性のある操作（DBアクセス、外部API呼び出し、ビジネスルール検証など）を行う関数は、原則として `Promise<Result<T, E>>` または `Result<T, E>` を返します。
    -   `T` は成功時の値の型、`E` は失敗時のエラー型（`BaseError` のサブクラス）です。

2.  **エラーの生成**:
    -   各レイヤーで発生したエラーは、適切なエラー型（`DomainError`, `ApplicationError`, `InfrastructureError`）のインスタンスとして生成し、`err()` でラップして返します。
    -   エラーの原因（`cause`）を可能な限り含め、スタックトレースを保持します。

3.  **エラーの伝播と処理**:
    -   呼び出し元（例: ユースケース層）は、リポジトリやサービスから返された `Result` を受け取り、`match` メソッドや `map`, `mapErr`, `asyncMap` などを使って適切に処理します。
    -   UI層に返す前に、エラーは標準化されたエラーレスポンス形式に変換されます。

```typescript
    // 例: infrastructure/database/repositories/ProjectRepository.ts
    // (注: 以下の例は BaseRepository + ヘルパー関数利用のパターンを反映するように修正)
    import { Result, ok, err } from 'neverthrow';
    import { Project } from '@/domain/models/entities/Project'; // 仮のパス
    import { ProjectId } from '@/domain/models/value-objects/ProjectId'; // 仮のパス
    import { IProjectRepository } from '@/domain/repositories/IProjectRepository'; // 仮のパス
    import { PrismaClient } from '@prisma/client'; // Prismaの代わりにDrizzle想定だが例として残す
    import { InfrastructureError } from '@/shared/errors/InfrastructureError';
    import { inject, injectable } from 'tsyringe';
    import { BaseRepository } from './base.repository'; // BaseRepository を継承
    import { projects } from '../schema/projects.schema'; // 仮のスキーマパス
    import { findRecordById, saveRecord, deleteRecordById } from '../helpers/crud.helpers'; // ヘルパー関数をインポート
    import { PgColumn } from 'drizzle-orm/pg-core';

    // 仮のDB型
    type ProjectDbSelect = typeof projects.$inferSelect;
    type ProjectDbInsert = typeof projects.$inferInsert;

    @injectable()
    export class ProjectRepository
      extends BaseRepository<ProjectId, Project, ProjectDbSelect, ProjectDbInsert, typeof projects>
      implements IProjectRepository
    {
      // スキーマとIDカラムを定義 (BaseRepository の抽象プロパティ実装)
      protected readonly schema = projects;
      protected readonly idColumn: PgColumn = projects.id;

      constructor(@inject('Database') db: NodePgDatabase) { // Drizzle DB想定
        super(db);
      }

      // マッピングメソッド (BaseRepository の抽象メソッド実装)
      protected _toDomain(record: ProjectDbSelect): Project {
          // DBレコードからドメインエンティティへのマッピングロジック
          // Value Object の生成などを含む
          // 例: return Project.reconstruct({...});
          throw new Error('Method not implemented.'); // 要実装
      }
      protected _toPersistence(entity: Project): ProjectDbInsert {
          // ドメインエンティティからDBレコード形式へのマッピングロジック
          // Value Object からプリミティブ値への変換などを含む
          // 例: return { id: entity.id.value, ... };
          throw new Error('Method not implemented.'); // 要実装
      }

      // findById (BaseRepository の抽象メソッド実装、ヘルパー利用)
      async findById(id: ProjectId): Promise<Result<Project | null, InfrastructureError>> {
        const findResult = await findRecordById<ProjectDbSelect>(this.db, this.schema, this.idColumn, id.value);
        if (findResult.isErr()) {
            return err(new InfrastructureError(`Failed to find project by id: ${id.value}`, { cause: findResult.error }));
        }
        const record = findResult.value;
        if (!record) return ok(null);
        try {
            return ok(this._toDomain(record));
        } catch (mappingError) {
            return err(new InfrastructureError(`Mapping failed for project ${id.value}`, { cause: mappingError }));
        }
      }

      // save (BaseRepository の抽象メソッド実装、ヘルパー利用)
      async save(project: Project): Promise<Result<void, InfrastructureError>> {
          try {
            const persistenceData = this._toPersistence(project);
            const saveResult = await saveRecord(this.db, this.schema, this.idColumn, persistenceData);
            if (saveResult.isErr()) {
                return err(new InfrastructureError(`Failed to save project: ${project.id.value}`, { cause: saveResult.error }));
            }
            return ok(undefined);
          } catch (mappingError) {
             return err(new InfrastructureError(`Failed to prepare project data for saving: ${project.id.value}`, { cause: mappingError }));
          }
      }

       // delete (BaseRepository の抽象メソッド実装、ヘルパー利用)
       async delete(id: ProjectId): Promise<Result<void, InfrastructureError>> {
            const deleteResult = await deleteRecordById(this.db, this.schema, this.idColumn, id.value);
            if (deleteResult.isErr()) {
                return err(new InfrastructureError(`Failed to delete project ${id.value}`, { cause: deleteResult.error }));
            }
            if (deleteResult.value === 0) {
                return err(new InfrastructureError(`[NOT_FOUND] Project with id ${id.value} not found for deletion.`));
            }
            return ok(undefined);
       }

       // ... 他の Project 固有のリポジトリメソッド (findByUserId など) ...
    }
    ```

4.  **プレゼンテーション層での処理**:
    -   API Routes や Server Actions のハンドラーは、ユースケースから返された `Result` を受け取ります。
    -   `match` メソッドを使用して成功時と失敗時のレスポンスを分岐させます。
    -   失敗時には、エラーオブジェクト (`ApplicationError`, `InfrastructureError` など) の情報をもとに、ユーザーフレンドリーなメッセージと適切なHTTPステータスコードを持つ標準エラーレスポンスを生成します ([`handleApiError`](#apiエラーハンドリングユーティリティ) ユーティリティなどを利用)。

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