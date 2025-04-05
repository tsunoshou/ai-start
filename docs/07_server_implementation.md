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

### エラーハンドリング (`neverthrow` 利用)

[04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) および [05_type_definitions.md](/docs/restructuring/05_type_definitions.md) で定義されたエラーハンドリング方針に基づき、`neverthrow` の `Result` 型を全面的に採用します。

1.  **関数の戻り値**:
    -   失敗する可能性のある操作（DBアクセス、外部API呼び出し、ビジネスルール検証など）を行う関数は、原則として `Promise<Result<T, E>>` または `Result<T, E>` を返します。
    -   `T` は成功時の値の型、`E` は失敗時のエラー型（`BaseError` のサブクラス）です。

2.  **エラーの生成**:
    -   各レイヤーで発生したエラーは、適切なエラー型（`DomainError`, `ApplicationError`, `InfrastructureError`）のインスタンスとして生成し、`err()` でラップして返します。
    -   エラーの原因（`cause`）を可能な限り含め、スタックトレースを保持します。

```typescript
    // 例: infrastructure/database/repositories/ProjectRepository.ts
    import { Result, ok, err } from 'neverthrow';
    import { Project } from '@/domain/models/entities/Project';
    import { IProjectRepository } from '@/domain/repositories/IProjectRepository';
    import { PrismaClient } from '@prisma/client'; // 仮
    import { InfrastructureError } from '@/shared/errors/InfrastructureError';
    import { inject, injectable } from 'tsyringe';

    @injectable()
    export class ProjectRepository implements IProjectRepository {
      constructor(@inject(PrismaClient) private prisma: PrismaClient) {}

      async findById(id: string): Promise<Result<Project | null, InfrastructureError>> {
        try {
          const data = await this.prisma.project.findUnique({ where: { id } });
          if (!data) {
            return ok(null);
          }
          // Mapperを使って Prisma データ -> ドメインモデル に変換 (Mapperは別途定義)
          // const project = ProjectMapper.toDomain(data);
          const project = new Project(data.id, data.userId, data.name, new Date(data.createdAt)); // 仮実装
          return ok(project);
        } catch (error) {
          return err(new InfrastructureError(`Failed to find project by id: ${id}`, { cause: error }));
        }
      }

      async save(project: Project): Promise<Result<Project, InfrastructureError>> {
        try {
          const data = {
             id: project.id,
             userId: project.userId,
             name: project.name,
             createdAt: project.createdAt,
             // ... 他の永続化データ (Mapper経由が望ましい)
          };
          const savedData = await this.prisma.project.upsert({
             where: { id: project.id },
             update: data,
             create: data,
          });
          // const savedProject = ProjectMapper.toDomain(savedData);
          const savedProject = new Project(savedData.id, savedData.userId, savedData.name, new Date(savedData.createdAt)); // 仮実装
          return ok(savedProject);
        } catch (error) {
          return err(new InfrastructureError(`Failed to save project: ${project.id}`, { cause: error }));
        }
      }
       // ... 他のリポジトリメソッド
    }
    ```

3.  **エラーの伝播と処理**:
    -   呼び出し元の関数は、`Result` オブジェクトの `isOk()`, `isErr()` で成功/失敗を判定します。
    -   `match(okFn, errFn)` や `map(okFn)`, `mapErr(errFn)` を使って結果を処理・変換します。
    -   アプリケーション層（ユースケース）では、下位レイヤー（インフラ層）からの `InfrastructureError` を受け取り、必要に応じて `ApplicationError` にマッピングして返すことがあります。
    -   プレゼンテーション層（API Routes）では、最終的に `Result` を受け取り、成功時はデータを、失敗時は `handleApiError` ユーティリティなどを使って適切なHTTPレスポンスに変換します。

```typescript
    // 例: presentation/utils/handleApiError.ts
    import { NextResponse } from 'next/server';
    import { BaseError } from '@/shared/errors/BaseError';
    import { DomainError } from '@/shared/errors/DomainError';
    import { ApplicationError } from '@/shared/errors/ApplicationError';
    import { InfrastructureError } from '@/shared/errors/InfrastructureError';
    import { ValidationError } from '@/shared/errors/ValidationError';
    import pino from 'pino'; // 例: ロガー

    const logger = pino();

    export function handleApiError(error: BaseError): NextResponse {
      logger.error({ err: error, stack: error.stack }, error.message); // エラーログ出力

      let statusCode = 500;
      let responseBody: { error: string; code?: string; details?: any } = {
        error: 'Internal Server Error',
      };

      if (error instanceof ValidationError) {
        statusCode = 400; // Bad Request
        responseBody = {
          error: 'Validation Failed',
          code: error.code,
          details: error.details || error.message,
        };
      } else if (error instanceof DomainError) {
        statusCode = 400; // Bad Request or 4xx depending on context
        responseBody = { error: error.message, code: error.code };
      } else if (error instanceof ApplicationError) {
        // ApplicationErrorはより汎用的。causeによって判断が必要な場合も
        statusCode = 500; // Or specific based on error code
        responseBody = { error: error.message, code: error.code };
      } else if (error instanceof InfrastructureError) {
        statusCode = 503; // Service Unavailable or 500
        responseBody = { error: 'Service Error', code: error.code };
      }
       // 他のエラータイプ（認証エラーなど）もここに追加

      return NextResponse.json(responseBody, { status: statusCode });
    }
    ```

### QueryObject / ReadModel

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md) および [05_type_definitions.md](/docs/restructuring/05_type_definitions.md) で定義された通り、読み取り専用のデータ取得にはQueryObjectパターンやReadModelを使用します。

1.  **目的**: 書き込み操作とは独立した、UI表示やレポート生成に最適化されたデータ構造を取得する。CQRS (Command Query Responsibility Segregation) の原則に基づきます。
2.  **実装場所**: 主に `infrastructure/database/` 配下に実装します。
    -   `read-models/`: ReadModelのデータ構造定義と、それを生成するクエリロジックを配置。
    -   `repositories/`: ReadModelを取得するための専用メソッドをリポジトリインターフェースに追加し、実装を提供する場合もあります。
3.  **技術**:
    -   Drizzle ORM の `select()` やビューを利用して、必要なカラムのみを結合・取得する効率的なクエリを構築します。
    -   複雑な集計や読み取り専用のデータ変換ロジックをカプセル化します。
4.  **データフロー**:
    -   プレゼンテーション層 (例: サーバーコンポーネント) → アプリケーション層 (ユースケース、または専用のQueryService) → インフラストラクチャ層 (ReadModelクエリ実行) → データベース
    -   取得されたReadModelは、ドメインモデルへのマッピングを経由せず、直接DTOとしてプレゼンテーション層に返されることが多いです。
5.  **例 (概念)**:

```typescript
    // infrastructure/database/read-models/ProjectDashboardReadModel.ts
    import { db } from '@/infrastructure/database/db'; // Drizzle instance
    import { projects, users, steps } from '@/infrastructure/database/schema';
    import { eq, count } from 'drizzle-orm';

    export type ProjectDashboardItem = {
      projectId: string;
      projectName: string;
      ownerName: string;
      stepCount: number;
      lastUpdatedAt: Date;
    };

    export async function getProjectDashboardItems(userId: string): Promise<ProjectDashboardItem[]> {
       // Drizzleを使って複数テーブルを結合し、必要な情報だけを取得
       const results = await db.select({
           projectId: projects.id,
           projectName: projects.name,
           ownerName: users.name,
           stepCount: count(steps.id),
           lastUpdatedAt: projects.updatedAt, // 例
         })
         .from(projects)
         .leftJoin(users, eq(projects.userId, users.id))
         .leftJoin(steps, eq(projects.id, steps.projectId)) // プロジェクトIDでステップを結合
         .where(eq(projects.userId, userId)) // 特定ユーザーのプロジェクト
         .groupBy(projects.id, users.name)
         .orderBy(projects.updatedAt); // 例: 更新日時順

       // Drizzleの結果を ProjectDashboardItem 型に整形して返す
       return results.map(r => ({
           ...r,
           lastUpdatedAt: new Date(r.lastUpdatedAt), // 日付型に変換など
       }));
    }

    // application/queryservices/ProjectQueryService.ts (ユースケースとは別のサービスクラス)
    import { getProjectDashboardItems, ProjectDashboardItem } from '@/infrastructure/database/read-models/ProjectDashboardReadModel';
    import { Result, ok, err } from 'neverthrow';
    import { ApplicationError } from '@/shared/errors/ApplicationError';
    import { injectable } from 'tsyringe';

    @injectable()
    export class ProjectQueryService {
        async getDashboard(userId: string): Promise<Result<ProjectDashboardItem[], ApplicationError>> {
            try {
                const items = await getProjectDashboardItems(userId);
                return ok(items);
    } catch (error) {
                return err(new ApplicationError('Failed to fetch project dashboard', { cause: error }));
            }
        }
    }

    // presentation/components/ProjectDashboard.server.tsx (サーバーコンポーネント)
    import { container } from '@/infrastructure/di/container.config';
    import { ProjectQueryService } from '@/application/queryservices/ProjectQueryService';
    // ... 他のインポート

    async function ProjectDashboard({ userId }: { userId: string }) {
      const projectQueryService = container.resolve(ProjectQueryService);
      const result = await projectQueryService.getDashboard(userId);

      if (result.isErr()) {
        // エラーハンドリング (UI)
        return <div>Error loading dashboard: {result.error.message}</div>;
      }

      const dashboardItems = result.value;

      return (
        <div>
          <h1>Project Dashboard</h1>
          <ul>
            {dashboardItems.map(item => (
              <li key={item.projectId}>
                {item.projectName} by {item.ownerName} ({item.stepCount} steps) - Last updated: {item.lastUpdatedAt.toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      );
    }
    ```

### サーバーコンポーネント (SC) / クライアントコンポーネント (CC) 連携

Next.js App RouterにおけるSCとCCの連携では、データの受け渡しに関するルールを遵守します。

1.  **データ転送の基本**:
    -   SCからCCへデータを渡す場合、**シリアライズ可能 (Serializable)** なデータのみを `props` として渡す必要があります。
    -   シリアライズ可能とは、JSONに変換できるデータ型を指します（例: `string`, `number`, `boolean`, `null`, `Array`, Plain Object）。
    -   `Date`, `Map`, `Set`, `BigInt`, 関数、クラスインスタンスなどは直接渡せません。

2.  **推奨されるデータ形式**:
    -   **DTO (Data Transfer Object)**: サーバーサイドで取得したデータを、プレーンなオブジェクト構造を持つDTOに変換してからCCに渡します。型定義は [05_type_definitions.md](/docs/restructuring/05_type_definitions.md) を参照。
    -   **QueryObject/ReadModel**: 上記で説明したReadModelは、通常シリアライズ可能なプレーンオブジェクトとして設計されるため、そのままCCに渡すのに適しています。

3.  **非シリアライズ可能データの扱い**:
    -   `Date` オブジェクト: 文字列 (ISO 8601形式) または数値 (タイムスタンプ) に変換してから渡します。CC側で必要に応じて `new Date()` で復元します。
    -   複雑なオブジェクト/クラスインスタンス: 必要なプロパティのみを抽出し、プレーンオブジェクトに変換します。CC側でインスタンスが必要な場合は、渡されたデータから再構築します。

4.  **TanStack Query (`initialData`)**:
    -   サーバーコンポーネントでデータをフェッチし、それをクライアントコンポーネントのTanStack Queryの `initialData` として渡す場合も、データはシリアライズ可能である必要があります。
    -   SCで `Result` 型を処理し、成功時の値 (DTO/ReadModel) を抽出して `initialData` に渡します。エラー情報は別途 `props` で渡すか、クライアント側で再フェッチ時にハンドリングします。

```typescript
    // presentation/components/ProjectDetails.server.tsx
    import { ProjectQueryService } from '@/application/queryservices/ProjectQueryService';
    import ProjectDetailsClient from './ProjectDetailsClient.client'; // クライアントコンポーネント
    import { container } from '@/infrastructure/di/container.config';
    import { QueryClient } from '@tanstack/react-query';
    import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

    async function ProjectDetailsServer({ projectId }: { projectId: string }) {
      const queryClient = new QueryClient();
      const projectQueryService = container.resolve(ProjectQueryService);
      const queryKey = ['project', projectId];

      // サーバーサイドでデータフェッチし、QueryClientにキャッシュ
      await queryClient.prefetchQuery({
         queryKey: queryKey,
         queryFn: async () => {
           const result = await projectQueryService.getProjectDetails(projectId); // ReadModel or DTOを返す関数
           if (result.isErr()) {
             // prefetchQuery内でエラーを投げるとHydrationでエラーになることが多い
             // null や空配列を返すなどして、クライアント側でエラー状態をハンドルさせる方が安全な場合がある
             console.error("Prefetch failed:", result.error);
             return null; // または適切なデフォルト値
           }
           // ★ シリアライズ可能なデータ (ReadModel/DTO) を返す
           return result.value;
         }
      });

      // dehydratedState はシリアライズ可能な形式になっている
      const dehydratedState = dehydrate(queryClient);

      return (
        // HydrationBoundaryでクライアントに状態を引き継ぐ
        <HydrationBoundary state={dehydratedState}>
          <ProjectDetailsClient projectId={projectId} />
        </HydrationBoundary>
      );
    }

    // presentation/components/ProjectDetailsClient.client.tsx
    'use client';
    import { useQuery } from '@tanstack/react-query';
    import { getProjectDetailsClient } // クライアントから呼び出すAPI関数 (React Query用)

    function ProjectDetailsClient({ projectId }: { projectId: string }) {
      const queryKey = ['project', projectId];

      // initialDataはHydrationBoundaryから提供される
      const { data: project, isLoading, error } = useQuery({
        queryKey: queryKey,
        queryFn: () => getProjectDetailsClient(projectId), // クライアント用のフェッチ関数
        // staleTime など、キャッシュ戦略を設定
      });

      if (isLoading) return <div>Loading...</div>;
      if (error) return <div>Error: {error.message}</div>;
      if (!project) return <div>Project not found.</div>; // サーバーフェッチ失敗時の考慮

      return (
        <div>
          <h1>{project.projectName}</h1>
          {/* ...プロジェクト詳細表示... */}
        </div>
      );
    }
    ```

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