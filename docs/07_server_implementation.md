# サーバー側の実装

最終更新日: 2025-03-26

## 本ドキュメントの目的

このドキュメントは、AiStartプロジェクトのサーバー側実装に関する具体的な設計と実装方針を定義しています。関連ドキュメントとの役割の違いは以下のとおりです：

- **01_requirements_definition.md**：「何を」実現するのか（What）
- **02_architecture_design.md**：「どのように」実現するのか（How）
- **03_prototype_development.md**：プロトタイプでの検証事項（Verify）
- **04_implementation_rules.md**：「どのように書くか」（Write）
- **05_type_definitions.md**：「どのような型を定義するか」（Type）
- **06_utility_functions.md**：「どのようなユーティリティ関数を使うか」（Utilize）
- **07_server_implementation.md**：「サーバー側をどう実装するか」（Server）

## サーバーコンポーネントの構造

### サーバーアプリケーションの階層構造

AiStartのサーバー側実装は、02_architecture_design.mdで定義された階層構造に基づき、以下の層から構成されます：

1. **ドメイン層**：ビジネスルールとエンティティを含む中心的な層
2. **アプリケーション層**：ユースケースとDTOを実装するビジネスロジック層
3. **インフラストラクチャ層**：外部サービス、DB、AIプロバイダーとの連携
4. **プレゼンテーション層**：API Routes、APIエンドポイントの実装

各層は明確な責務を持ち、内側の層は外側の層に依存しないように設計されています。依存関係は02_architecture_design.mdの「依存性逆転の原則」に従い、インターフェースを通じて実現します。

### ディレクトリ構造

02_architecture_design.mdで定義されたディレクトリ構造に厳密に準拠します：

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # 認証関連ルート (グループ)
│   ├── (dashboard)/          # ダッシュボード関連ルート (グループ)
│   ├── api/                  # API Routes
│   │   ├── auth/             # 認証関連API
│   │   ├── v1/               # APIバージョン1
│   │   │   ├── users/        # ユーザー関連API
│   │   │   ├── projects/     # プロジェクト関連API
│   │   │   └── ...           # その他のリソースAPI
│   │   └── webhooks/         # Webhook受信用エンドポイント
│   └── [...locale]/          # 国際化ルート
│
├── domain/                   # ドメイン層
│   ├── models/               # ドメインモデル
│   │   ├── entities/         # エンティティ
│   │   └── value-objects/    # 値オブジェクト
│   ├── services/             # ドメインサービス
│   ├── repositories/         # リポジトリインターフェース
│   └── events/               # ドメインイベント
│
├── application/              # アプリケーション層
│   ├── usecases/             # ユースケース
│   │   ├── user/             # ユーザー関連ユースケース
│   │   ├── project/          # プロジェクト関連ユースケース
│   │   ├── program/          # プログラム関連ユースケース
│   │   └── ...               # その他のユースケース
│   └── dtos/                 # データ転送オブジェクト
│
├── infrastructure/           # インフラストラクチャ層
│   ├── database/             # データベース関連
│   │   ├── schema/           # Drizzle Schema
│   │   ├── migrations/       # DBマイグレーション
│   │   └── repositories/     # リポジトリ実装
│   ├── ai/                   # AI関連
│   │   ├── providers/        # 各AIプロバイダーの実装
│   │   ├── adapters/         # AIアダプター
│   │   └── prompt-templates/ # プロンプトテンプレート
│   ├── mappers/              # データマッパー
│   ├── auth/                 # 認証・認可
│   │   ├── strategies/       # 認証戦略
│   │   ├── providers/        # 認証プロバイダー連携
│   │   └── guards/           # 認可ガード
│   ├── external-services/    # 外部サービス連携
│   ├── websockets/           # WebSocket関連
│   │   ├── handlers/         # WebSocketハンドラ
│   │   └── events/           # WebSocketイベント定義
│   └── jobs/                 # バックグラウンドジョブ
│       ├── definitions/      # ジョブ定義
│       ├── handlers/         # ジョブハンドラ
│       └── scheduler.ts      # ジョブスケジューラ
│
├── presentation/             # プレゼンテーション層
│   ├── components/           # Reactコンポーネント
│   ├── hooks/                # Reactフック
│   ├── providers/            # コンテキストプロバイダー
│   └── utils/                # プレゼンテーション層のユーティリティ
│
├── shared/                   # 共有リソース
│   ├── types/                # 共通型定義
│   ├── utils/                # 共通ユーティリティ関数
│   │   ├── validation.ts     # バリデーション
│   │   ├── error.ts          # エラー処理
│   │   └── helpers.ts        # ヘルパー関数
│   ├── constants/            # 定数
│   └── errors/               # エラー定義
│
├── config/                   # アプリケーション設定
│   ├── environment.ts        # 環境変数定義
│   ├── constants.ts          # 定数定義
│   └── logger.ts             # ロガー設定
│
├── i18n/                     # 国際化リソース
│   ├── locales/              # 言語リソース
│   ├── config.ts             # i18n設定
│   └── types/                # i18n関連型定義
│
└── tests/                    # テスト
    ├── unit/                 # 単体テスト
    ├── integration/          # 統合テスト
    └── e2e/                  # E2Eテスト
```

この構造は、02_architecture_design.mdで定義された「クリーンアーキテクチャ」「ドメイン駆動設計」「モジュール分割」の原則に厳密に従っています。また、04_implementation_rules.mdで定義された命名規則を遵守しています。

## APIレイヤー設計

### API設計方針

AiStartプロジェクトでは、01_requirements_definition.mdに基づき、RESTful APIをメインのAPI形式として採用します。クライアントサイドのシングルページアプリケーション（SPA）と効率的に連携するために、以下の設計原則に従います：

1. **リソース指向設計**：APIエンドポイントはリソース（名詞）を表し、HTTPメソッドで操作を示す
2. **階層構造の適切な表現**：リソース間の関係を直感的なURLパス構造で表現
3. **一貫したレスポンス形式**：成功・エラー時のレスポンス形式を統一
4. **JSON形式の標準化**：すべてのリクエスト/レスポンスでJSONを使用
5. **HATEOAS原則の適用**：API応答にリソース間の関連リンクを含める

### エンドポイント構造

エンドポイントは04_implementation_rules.mdに定義された命名規則に従い、以下の構造で設計します：

```
/api/v1/[リソース名]                     # リソースのコレクション
/api/v1/[リソース名]/:id                 # 特定のリソース
/api/v1/[親リソース名]/:id/[子リソース名]    # 親リソースに関連する子リソース
```

#### 主要なエンドポイント一覧

| エンドポイント                             | HTTPメソッド | 説明                                | 権限                          |
| ------------------------------------------ | ------------ | ----------------------------------- | ----------------------------- |
| `/api/auth/login`                          | POST         | ユーザーログイン                    | Public                        |
| `/api/auth/logout`                         | POST         | ログアウト処理                      | User                          |
| `/api/auth/refresh`                        | POST         | トークンリフレッシュ                | User                          |
| `/api/auth/register`                       | POST         | ユーザー登録（ユーザー作成と認証）  | Public                        |
| `/api/auth/verify-email`                   | POST         | メール検証                          | Public                        |
| `/api/auth/reset-password`                 | POST         | パスワードリセット                  | Public                        |
| `/api/auth/mfa/setup`                      | POST         | 多要素認証の設定                    | User                          |
| `/api/auth/mfa/verify`                     | POST         | 多要素認証の検証                    | User                          |
| `/api/v1/users`                            | GET          | ユーザー一覧取得                    | Admin                         |
| `/api/v1/users`                            | POST         | ユーザー登録                        | Public                        |
| `/api/v1/users/:id`                        | GET          | ユーザー詳細取得                    | User(自身)/Admin              |
| `/api/v1/users/:id`                        | PUT          | ユーザー情報更新                    | User(自身)/Admin              |
| `/api/v1/users/:id`                        | DELETE       | ユーザー削除                        | User(自身)/Admin              |
| `/api/v1/settings`                         | GET          | ユーザー設定取得                    | User                          |
| `/api/v1/settings`                         | PUT          | ユーザー設定更新                    | User                          |
| `/api/v1/projects`                         | GET          | プロジェクト一覧取得                | User                          |
| `/api/v1/projects`                         | POST         | プロジェクト作成                    | User                          |
| `/api/v1/projects/:id`                     | GET          | プロジェクト詳細取得                | Project.member                |
| `/api/v1/projects/:id`                     | PUT          | プロジェクト更新                    | Project.owner/editor          |
| `/api/v1/projects/:id`                     | DELETE       | プロジェクト削除                    | Project.owner                 |
| `/api/v1/projects/:id/members`             | GET          | プロジェクトメンバー一覧            | Project.member                |
| `/api/v1/projects/:id/members`             | POST         | メンバー追加                        | Project.owner                 |
| `/api/v1/programs`                         | GET          | プログラム一覧取得                  | User                          |
| `/api/v1/programs`                         | POST         | プログラム作成                      | Editor/Admin                  |
| `/api/v1/programs/:id`                     | GET          | プログラム詳細取得                  | User                          |
| `/api/v1/programs/:id`                     | PUT          | プログラム情報更新                  | Editor/Admin                  |
| `/api/v1/programs/:id`                     | DELETE       | プログラム削除                      | Admin                         |
| `/api/v1/programs/:id/reviews`             | GET          | プログラムレビュー取得              | User                          |
| `/api/v1/programs/:id/reviews`             | POST         | プログラムレビュー投稿              | User                          |
| `/api/v1/programs/:id/steps`               | GET          | ステップ一覧取得                    | User                          |
| `/api/v1/steps`                            | POST         | ステップ作成                        | Editor/Admin                  |
| `/api/v1/steps/:id`                        | GET          | ステップ詳細取得                    | User                          |
| `/api/v1/steps/:id`                        | PUT          | ステップ更新                        | Editor/Admin                  |
| `/api/v1/steps/:id`                        | DELETE       | ステップ削除                        | Editor/Admin                  |
| `/api/v1/steps/:id/complete`               | POST         | ステップ完了マーク                  | User                          |
| `/api/v1/steps/:id/video-content`          | GET          | ステップ補助ビデオコンテンツ取得    | User                          |
| `/api/v1/steps/:id/conversations`          | GET          | 会話履歴取得                        | Step.participant              |
| `/api/v1/steps/:id/attachments`            | GET          | ステップ添付ファイル一覧            | Step.participant              |
| `/api/v1/steps/:id/attachments`            | POST         | ステップ添付ファイル追加            | Step.participant              |
| `/api/v1/conversations/:id/messages`       | GET          | メッセージ一覧取得                  | Conversation.participant      |
| `/api/v1/conversations/:id/messages`       | POST         | メッセージ送信                      | Conversation.participant      |
| `/api/v1/outputs`                          | GET          | 成果物一覧取得                      | User                          |
| `/api/v1/outputs/:id`                      | GET          | 成果物詳細取得                      | Output.owner/Project.member   |
| `/api/v1/outputs/:id`                      | PUT          | 成果物更新                          | Output.owner                  |
| `/api/v1/outputs/:id/versions`             | GET          | 成果物バージョン履歴                | Output.owner/Project.member   |
| `/api/v1/outputs/:id/export`               | POST         | 成果物エクスポート（PDF/Word/HTML） | Output.owner/Project.member   |
| `/api/v1/outputs/templates`                | GET          | 成果物テンプレート一覧              | User                          |
| `/api/v1/outputs/consolidate`              | POST         | 複数成果物の統合                    | Project.owner/editor          |
| `/api/v1/files`                            | POST         | ファイルアップロード                | User                          |
| `/api/v1/files/:id`                        | GET          | ファイルダウンロード                | File.owner/関連Project.member |
| `/api/v1/files/:id`                        | DELETE       | ファイル削除                        | File.owner/Project.owner      |
| `/api/v1/projects/:id/attachments`         | GET          | プロジェクト添付ファイル一覧        | Project.member                |
| `/api/v1/projects/:id/attachments`         | POST         | プロジェクト添付ファイル追加        | Project.editor/owner          |
| `/api/v1/attachments/:id/analyze`          | POST         | 添付ファイル内容の分析・要約        | Attachment.owner              |
| `/api/v1/search`                           | GET          | 全文検索API                         | User                          |
| `/api/v1/notifications`                    | GET          | 通知一覧取得                        | User                          |
| `/api/v1/notifications/:id/read`           | POST         | 通知既読設定                        | User                          |
| `/api/v1/analytics/usage`                  | GET          | 使用状況統計                        | User/Admin                    |
| `/api/v1/analytics/projects/:id`           | GET          | プロジェクト統計                    | Project.owner/Admin           |
| `/api/v1/webhooks/register`                | POST         | Webhook登録                         | Admin                         |
| `/api/v1/invitations`                      | POST         | プロジェクト招待作成                | Project.owner                 |
| `/api/v1/invitations/:id/accept`           | POST         | 招待受け入れ                        | User                          |
| `/api/v1/prompts`                          | GET          | プロンプトテンプレート一覧          | Editor/Admin                  |
| `/api/v1/prompts`                          | POST         | プロンプトテンプレート作成          | Editor/Admin                  |
| `/api/v1/prompts/:id`                      | GET          | プロンプトテンプレート取得          | Editor/Admin                  |
| `/api/v1/prompts/:id`                      | PUT          | プロンプトテンプレート更新          | Editor/Admin                  |
| `/api/v1/prompts/:id/versions`             | GET          | プロンプトバージョン履歴取得        | Editor/Admin                  |
| `/api/v1/prompts/test`                     | POST         | プロンプトテスト実行                | Editor/Admin                  |
| `/api/v1/ai/completions`                   | POST         | AI補完リクエスト                    | User                          |
| `/api/v1/ai/embeddings`                    | POST         | 埋め込みベクトル生成                | User                          |
| `/api/v1/ai/freeform-chat`                 | POST         | フリーフォームAI対話                | User                          |
| `/api/v1/ai/freeform-chat/:id/history`     | GET          | フリーフォーム対話履歴取得          | User                          |
| `/api/v1/subscriptions`                    | GET          | サブスクリプション情報取得          | User                          |
| `/api/v1/subscriptions/plans`              | GET          | 利用可能なプラン一覧取得            | Public                        |
| `/api/v1/subscriptions/checkout`           | POST         | サブスクリプション支払い処理        | User                          |
| `/api/v1/subscriptions/cancel`             | POST         | サブスクリプション解約              | User                          |
| `/api/v1/subscriptions/invoices`           | GET          | 請求書履歴取得                      | User                          |
| `/api/v1/risk-assessment`                  | POST         | ビジネスプランのリスク評価          | User                          |
| `/api/v1/risk-assessment/factors`          | GET          | リスク要因一覧取得                  | User                          |
| `/api/v1/risk-assessment/:id/improvements` | GET          | 改善提案取得                        | User                          |
| `/api/v1/case-studies`                     | GET          | 歴史的事例一覧取得                  | User                          |
| `/api/v1/case-studies/:id`                 | GET          | 特定事例の詳細取得                  | User                          |
| `/api/v1/translations`                     | GET          | 翻訳リソース一覧取得                | User                          |
| `/api/v1/translations/:lang`               | GET          | 特定言語の翻訳取得                  | User                          |
| `/api/v1/translations/:lang/:key`          | GET/PUT      | 特定キーの翻訳取得/更新             | User/Admin                    |

### ユーティリティAPIエンドポイント

以下のエンドポイントは、システム管理や開発者の利便性向上のために提供されます：

#### 1. システムステータスエンドポイント

| エンドポイント         | HTTPメソッド | 説明                                                   | 必要な権限 |
| ---------------------- | ------------ | ------------------------------------------------------ | ---------- |
| `/api/health`          | GET          | サービスのヘルスチェック                               | Public     |
| `/api/health/detailed` | GET          | 詳細なヘルスステータス（DB、キャッシュ、外部サービス） | Admin      |
| `/api/status`          | GET          | システム全体のステータス情報                           | Admin      |

#### 2. API情報とドキュメント

| エンドポイント      | HTTPメソッド | 説明                                      | 必要な権限 |
| ------------------- | ------------ | ----------------------------------------- | ---------- |
| `/api`              | GET          | APIバージョン情報と利用可能なリソース一覧 | Public     |
| `/api/v1`           | GET          | v1 APIの詳細情報と機能一覧                | Public     |
| `/api/v1/docs`      | GET          | OpenAPI形式のAPI仕様書                    | Public     |
| `/api/v1/changelog` | GET          | APIの変更履歴                             | Public     |

#### 3. バッチ処理用エンドポイント

| エンドポイント           | HTTPメソッド | 説明                       | 必要な権限         |
| ------------------------ | ------------ | -------------------------- | ------------------ |
| `/api/v1/batch`          | POST         | 複数操作の一括実行         | 各操作に必要な権限 |
| `/api/v1/projects/batch` | POST         | 複数プロジェクトの一括操作 | Project.owner      |
| `/api/v1/users/batch`    | POST         | 複数ユーザーの一括操作     | Admin              |
| `/api/v1/outputs/batch`  | POST         | 複数成果物の一括処理       | Output.owner       |

### バッチ処理の仕様

バッチ処理リクエストの形式：

```json
{
  "operations": [
    {
      "method": "POST|PUT|DELETE",
      "path": "/api/v1/resource/:id",
      "body": { /* リクエストボディ */ }
    },
    // 複数の操作を指定
  ],
  "options": {
    "stopOnError": true|false,
    "returnResponses": true|false
  }
}
```

バッチ処理レスポンスの形式：

```json
{
  "results": [
    {
      "status": 200,
      "path": "/api/v1/resource/:id",
      "data": {
        /* レスポンスデータ */
      }
    }
    // 各操作の結果
  ],
  "meta": {
    "totalOperations": 5,
    "successCount": 4,
    "errorCount": 1
  }
}
```

#### 標準クエリパラメータ

すべての一覧取得APIでは、以下の標準クエリパラメータをサポートします：

| パラメータ | 型     | 説明                                          | デフォルト  |
| ---------- | ------ | --------------------------------------------- | ----------- |
| `page`     | number | ページ番号（1始まり）                         | 1           |
| `limit`    | number | 1ページあたりの件数                           | 20          |
| `sort`     | string | ソートフィールド（プレフィックス `-` で降順） | `createdAt` |
| `fields`   | string | 取得フィールドの指定（カンマ区切り）          | すべて      |
| `filter`   | object | フィルタリング条件（JSON形式）                | なし        |
| `search`   | string | 全文検索キーワード                            | なし        |

例: `/api/v1/projects?page=2&limit=10&sort=-updatedAt&fields=id,name,description&filter={"status":"active"}`

#### レスポンス形式

一覧取得APIの標準レスポンス形式：

```json
{
  "data": [
    {
      /* リソースオブジェクト */
    },
    {
      /* リソースオブジェクト */
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 50,
    "totalPages": 3
  },
  "links": {
    "self": "/api/v1/resources?page=1&limit=20",
    "first": "/api/v1/resources?page=1&limit=20",
    "prev": null,
    "next": "/api/v1/resources?page=2&limit=20",
    "last": "/api/v1/resources?page=3&limit=20"
  }
}
```

個別リソース取得APIの標準レスポンス形式：

```json
{
  "data": {
    /* リソースオブジェクト */
  },
  "links": {
    "self": "/api/v1/resources/123",
    "related": {
      "subresources": "/api/v1/resources/123/subresources"
    }
  }
}
```

### バージョニング戦略

APIバージョニングは、02_architecture_design.mdで定義された以下の方針に従います：

1. **URLパスベースのバージョニング**：`/api/v1/`、`/api/v2/`のような形式
2. **後方互換性の維持**：新バージョンリリース後も旧バージョンを一定期間サポート
   - 廃止予定のAPIには `X-Deprecation-Date` ヘッダーで廃止日を明示
   - 廃止の最低90日前に通知
3. **マイナーバージョン対応**：追加のみの変更はX-API-Versionヘッダーで制御
   - 例: `X-API-Version: 1.2` でv1.2の機能を有効化
4. **変更ログの維持**：各バージョン間の変更を明示的に文書化
   - `/api/changelog.json` でプログラム的に取得可能
5. **廃止通知プロセス**：APIバージョン廃止の事前通知期間と移行ガイド提供
   - API Deprecation Planを公開
   - 移行スクリプト提供（可能な場合）

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「APIバージョニング」セクションを参照してください。

## 認証・認可実装

### 認証方式

認証システムは、01_requirements_definition.mdで定義された要件に基づき、Auth.jsを活用した多要素認証システムを実装します：

1. **JWTベースの認証**：

   - アクセストークン（短期: 15分）とリフレッシュトークン（長期: 7日）の2トークン方式
   - トークンの署名にはRS256アルゴリズムを使用（非対称暗号）
   - トークンには以下の情報を含む：
     - `sub`: ユーザーID
     - `roles`: 権限情報の配列
     - `tenantId`: テナントID（マルチテナント対応）
     - `exp`: 有効期限
     - `jti`: 一意のトークンID（無効化用）

2. **Auth.jsとの統合**：

   - Auth.jsによるセッション管理と認証プロバイダー連携
   - カスタムコールバックによるJWTトークン発行・検証
   - `/api/auth/*` エンドポイントを使用した標準的な認証フロー

3. **認証プロバイダー**：

   - メール/パスワード認証（MFA対応）
   - OAuth2プロバイダー
     - Google (OpenID Connect)
     - GitHub
     - Microsoft (Azure AD)
     - Apple ID (Webのみ)
   - 必要に応じてSAML連携（エンタープライズ向け）

4. **多要素認証（MFA）**：
   - TOTPベースの認証アプリケーション対応（Google Authenticator等）
   - SMSワンタイムパスワード
   - Emailワンタイムパスワード
   - WebAuthn/FIDO2対応（生体認証/セキュリティキー）

### 認可方式

認可システムは、02_architecture_design.mdに定義されたセキュリティ設計に基づき、以下の方式を実装します：

1. **ロールベースアクセス制御（RBAC）**：

   - 基本ロール
     - `Guest`: 認証不要の公開リソースへのアクセスのみ
     - `User`: 基本的なリソース作成と自身のリソースへのアクセス
     - `Editor`: コンテンツ作成・編集が可能
     - `Admin`: ほぼすべてのリソースへの管理権限
     - `SuperAdmin`: システム全体の管理権限
   - リソースタイプごとの操作権限マトリクス（05_type_definitions.mdの「権限型」に基づく）
   - ユーザーへの複数ロール割り当てサポート

2. **リソースレベルの権限**：

   - プロジェクト、プログラムレベルでのアクセス制御
   - リソース固有の権限
     - `owner`: 所有者（すべての権限）
     - `editor`: 編集者（読み取り/更新）
     - `viewer`: 閲覧者（読み取りのみ）
   - アクセス制御リスト（ACL）による詳細な権限管理

3. **Row Level Security (RLS)の活用**：
   - PostgreSQLのRLS機能を活用した行レベルのアクセス制御
   - DB接続時のセッションパラメータ設定
     ```sql
     SET LOCAL app.current_user_id = 'user_id';
     SET LOCAL app.tenant_id = 'tenant_id';
     SET LOCAL app.user_roles = 'role1,role2';
     ```
   - テナント分離とユーザー権限に基づくデータフィルタリング
   - 各テーブルに対する具体的なRLSポリシー例（05_type_definitions.mdのスキーマ定義に連動）

### セキュリティ対策

04_implementation_rules.mdで定義されたセキュリティ実装基準に基づき、以下の対策を実装します：

1. **CSRF対策**：

   - Cookie設定
     - `SameSite=Lax`（デフォルト）
     - `Secure`フラグ（HTTPS環境のみ）
     - `HttpOnly`フラグ（JavaScript非アクセス）
   - Double Submit Cookie対策
     - リクエストヘッダーとCookieの値比較
   - リクエストソース検証
     - `Origin`/`Referer`ヘッダーの検証

2. **レート制限**：

   - トークンバケットアルゴリズムによるレート制限
     - グローバル制限: 1000リクエスト/時間/IP
     - 認証エンドポイント: 10リクエスト/分/IP
     - 一般API: 100リクエスト/分/ユーザー
   - IP/ユーザーごとの制限設定
   - エンドポイント別の制限値設定
   - Redisを使用した分散環境対応

3. **セキュアヘッダー**：

   - Content-Security-Policy (CSP)
     ```
     default-src 'self';
     script-src 'self' https://trusted-cdn.com;
     style-src 'self' https://trusted-cdn.com;
     img-src 'self' https://trusted-cdn.com data:;
     connect-src 'self' https://api.example.com;
     ```
   - HTTP Strict Transport Security (HSTS)
     ```
     Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
     ```
   - その他のセキュリティヘッダー
     ```
     X-Frame-Options: DENY
     X-XSS-Protection: 1; mode=block
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
     Permissions-Policy: geolocation=(), camera=(), microphone=()
     ```

4. **入力検証とサニタイゼーション**：
   - 06_utility_functions.mdで定義されたバリデーション関数の活用
   - Zodスキーマによる厳格な型チェックと検証
   - HTMLコンテンツの適切なサニタイズ
   - SQLインジェクション対策（パラメータ化クエリの使用）

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「セキュリティ対策」セクションを参照してください。

## ビジネスロジック

### アーキテクチャパターン

02_architecture_design.mdに定義されたアーキテクチャ設計に基づき、以下のパターンを採用します：

1. **レイヤードアーキテクチャ**：

   - 明確に分離された責務を持つ層構造
   - 上位層から下位層への依存方向の一貫性
   - インターフェースを通じた層間の疎結合

2. **ドメイン駆動設計（DDD）の部分適用**：

   - 明確に定義されたドメインモデル
   - 豊かな挙動を持つエンティティ
   - 値オブジェクトによる不変性の確保
   - ドメインサービスによるエンティティ横断処理

3. **CQRS原則の適用**：
   - 読み取り操作（Query）と書き込み操作（Command）の分離
   - 複雑な読み取りクエリの最適化
   - データ更新操作の一貫性確保

#### CQRS実装パターン

02_architecture_design.mdで定義されたCQRS原則に基づき、以下のパターンで実装します：

1. **コマンド処理**：

   - 明示的なコマンドオブジェクトの定義
     ```typescript
     interface CreateProjectCommand {
       type: 'CREATE_PROJECT';
       payload: {
         name: string;
         description: string;
         ownerId: string;
         // その他のプロジェクト作成に必要なデータ
       };
       metadata: CommandMetadata;
     }
     ```
   - コマンドハンドラーによる処理と検証
     ```typescript
     class CreateProjectCommandHandler implements CommandHandler<CreateProjectCommand> {
       constructor(
         private projectRepository: IProjectRepository,
         private userRepository: IUserRepository
         // 必要な依存関係
       ) {}

       async handle(command: CreateProjectCommand): Promise<Result<Project>> {
         // バリデーション
         // ビジネスルールの適用
         // データ永続化
         // イベント発行
       }
     }
     ```
   - トランザクション境界の明確な定義
   - ドメインイベントの発行

2. **クエリ処理**：

   - 専用の読み取りモデルの定義
     ```typescript
     interface ProjectSummaryReadModel {
       id: string;
       name: string;
       description: string;
       ownerName: string;
       memberCount: number;
       lastActivityAt: Date;
       // 表示に最適化されたデータ構造
     }
     ```
   - 効率的なクエリの実装
     ```typescript
     class GetProjectSummariesQueryHandler implements QueryHandler<GetProjectSummariesQuery> {
       constructor(
         private readDatabase: ReadDatabase
         // 必要な依存関係
       ) {}

       async handle(query: GetProjectSummariesQuery): Promise<Result<ProjectSummaryReadModel[]>> {
         // 専用のインデックスやビューを活用した高速クエリ
         // 結合済みのデータ取得
         // キャッシュの活用
       }
     }
     ```
   - 読み取り専用データストアの利用
   - キャッシュ戦略の統合

3. **イベントソーシング（必要に応じて）**：

   - イベントストアの実装
   - イベントの時系列記録
   - ドメイン状態の再構築
   - スナップショット戦略

4. **読み書きモデルの同期**：

   - イベント購読による読み取りモデル更新
   - 最終的整合性の実現
   - バックグラウンドプロセスによる同期
   - 整合性監視と修復メカニズム

5. **パフォーマンス最適化**：
   - 読み取りモデルの非正規化
   - 集計値の事前計算
   - クエリ専用インデックスの活用
   - キャッシュ戦略の最適化

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「CQRS実装」セクションを参照してください。

### ドメインサービス

ドメインサービスは、05_type_definitions.mdで定義されたドメインモデルに基づき、以下の実装方針で作成します：

1. **サービスの責務**：

   - 単一エンティティの枠を超える処理
   - エンティティ間の調整と連携
   - ビジネスルールの適用と検証

2. **サービス分類**：

   - ユーザードメインサービス：ユーザー管理、認証・認可
   - プロジェクトドメインサービス：プロジェクト管理、共同作業
   - プログラムドメインサービス：学習プログラム、ステップ管理
   - AIドメインサービス：AIモデル連携、プロンプト管理

3. **実装パターン**：
   - 純粋な関数としてのサービスメソッド
   - 明示的な依存性注入
   - トランザクション境界の明確化
   - イベント発行による副作用の分離

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「ドメインサービス」セクションを参照してください。

### ドメインイベントの実装

02_architecture_design.mdで定義されたイベント駆動アーキテクチャに基づき、ドメインイベントを以下の方針で実装します：

1. **イベント定義**：

   - ドメインごとのイベント分類
     ```typescript
     interface ProjectCreatedEvent {
       type: 'PROJECT_CREATED';
       payload: {
         projectId: string;
         name: string;
         ownerId: string;
         createdAt: Date;
         // その他の関連データ
       };
       metadata: EventMetadata;
     }
     ```
   - イベントのバージョニング
   - イベントスキーマの明示的な定義

2. **イベント発行**：

   - ドメインロジック内からのイベント発行
     ```typescript
     class ProjectService {
       constructor(
         private projectRepository: IProjectRepository,
         private eventBus: IEventBus
         // その他の依存関係
       ) {}

       async createProject(command: CreateProjectCommand): Promise<Result<Project>> {
         // プロジェクト作成ロジック

         // イベント発行
         await this.eventBus.publish(
           new ProjectCreatedEvent({
             projectId: project.id,
             name: project.name,
             ownerId: project.ownerId,
             createdAt: new Date(),
             // その他の関連データ
           })
         );

         return Result.ok(project);
       }
     }
     ```
   - トランザクションとイベント発行の整合性確保
   - 冪等性保証のためのイベントID付与

3. **イベント購読**：

   - イベントハンドラーの登録
     ```typescript
     class NotificationService implements EventHandler<ProjectCreatedEvent> {
       constructor(
         private notificationRepository: INotificationRepository
         // その他の依存関係
       ) {}

       async handle(event: ProjectCreatedEvent): Promise<void> {
         // プロジェクト作成通知の処理
         await this.notificationRepository.create({
           userId: event.payload.ownerId,
           type: 'PROJECT_CREATED',
           title: `プロジェクト「${event.payload.name}」が作成されました`,
           // その他の通知データ
         });
       }
     }
     ```
   - 複数ハンドラーによるイベント処理
   - 非同期処理とバックグラウンド実行
   - エラー処理と再試行ロジック

4. **イベントストリーム管理**：

   - イベントの永続化と履歴保持
   - イベントの時系列整列
   - イベントフィルタリングと集約
   - ストリーム分割と結合

5. **イベントソーシング（特定ドメイン向け）**：

   - イベントからの状態再構築
   - スナップショット戦略
   - 履歴データの分析と監査
   - 時点指定のデータ復元

6. **非同期処理の連鎖**：
   - イベント間の依存関係管理
   - プロセスマネージャーによる複雑なワークフロー
   - 長時間実行プロセスの状態追跡
   - 分散トランザクションの調整

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「ドメインイベント」セクションを参照してください。

### ユースケース実装

ユースケースの実装は、01_requirements_definition.mdで定義された機能要件に基づき、以下の方針で行います：

1. **ユースケースごとのサービスメソッド**：

   - 明確な命名規則（動詞 + 名詞）による意図の明示
   - 単一責任の原則に基づいた処理の分離
   - 明示的な入力パラメータと戻り値型

2. **バリデーション統合**：

   - 06_utility_functions.mdで定義されたバリデーション関数の活用
   - 入力データの前処理とドメイン型への変換
   - ビジネスルールの適用と違反チェック

3. **エラー処理**：
   - 明示的なエラー型の定義と返却
   - ユースケース固有のエラー条件の明確化
   - トランザクション境界内での整合性確保

## データアクセス層

### データアクセスパターン

データアクセス層は、02_architecture_design.mdで定義されたデータアクセス戦略に基づき、以下のパターンで実装します：

1. **リポジトリパターン**：

   - ドメインモデルとデータストアの分離
   - データアクセス操作の抽象化
   - トランザクション管理の一元化

2. **リポジトリの責務**：

   - エンティティの永続化（CRUD操作）
   - 検索条件に基づくエンティティの取得
   - データの集計と変換

3. **実装方針**：
   - エンティティタイプごとの専用リポジトリ
   - インターフェースによる実装の抽象化
   - データストアの詳細隠蔽

### ORM/クエリビルダ

05_type_definitions.mdで定義されたデータベーススキーマに基づき、以下のORM/クエリビルダ実装を行います：

1. **Drizzle ORM採用**：

   - 型安全なSQLクエリビルダー
   - PostgreSQL固有機能の活用
   - マイグレーション管理の自動化

2. **クエリ構築パターン**：

   - 条件付きクエリの組み立て
   - JOIN操作の型安全な実装
   - ページネーションの標準実装

3. **パフォーマンス最適化**：
   - 必要なカラムのみの選択
   - インデックスを活用したクエリ
   - バッチ処理によるN+1問題の回避

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「Drizzle ORM実装」セクションを参照してください。

### トランザクション管理

トランザクション管理は、データの整合性を確保するために以下の方針で実装します：

1. **トランザクション境界**：

   - サービスレイヤーでのトランザクション開始・終了
   - 必要に応じたトランザクション伝搬
   - ネストトランザクションのサポート

2. **エラー処理**：

   - トランザクション内でのエラー発生時の自動ロールバック
   - 部分的なエラーからの回復戦略
   - デッドロック検出と再試行ロジック

3. **分散トランザクション**：
   - 複数のデータソースを跨ぐ操作の整合性確保
   - 補償トランザクションによる整合性回復
   - イベント駆動による最終的整合性の実現

## エラーハンドリング

### エラー種別

エラー処理は、06_utility_functions.mdで定義されたエラー型定義に基づき、以下のカテゴリに分類します：

1. **システムエラー**：

   - インフラストラクチャの問題
   - 外部サービス連携の失敗
   - 予期せぬ例外

2. **ドメインエラー**：

   - ビジネスルール違反
   - 権限不足
   - リソース競合

3. **バリデーションエラー**：

   - 入力データの形式不正
   - 必須項目の欠落
   - データ制約違反

4. **認証・認可エラー**：
   - 未認証アクセス
   - 権限不足
   - トークン無効/期限切れ

### エラーレスポンス

APIエラーレスポンスは、04_implementation_rules.mdで定義されたフォーマットに従い、以下の標準形式で返却します：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読める形のメッセージ",
    "details": [
      // オプショナルな詳細情報
    ],
    "requestId": "トレース用ID"
  }
}
```

HTTPステータスコードは以下のように使い分けます：

1. **400 Bad Request**：クライアント入力の問題
2. **401 Unauthorized**：認証の問題
3. **403 Forbidden**：認可の問題
4. **404 Not Found**：リソースが存在しない
5. **409 Conflict**：リソース競合
6. **422 Unprocessable Entity**：ビジネスルール違反
7. **500 Internal Server Error**：サーバー内部エラー

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「エラーレスポンス」セクションを参照してください。

### トラブルシュート

エラーのトラブルシューティングを容易にするため、以下の方針を実装します：

1. **詳細なログ記録**：

   - エラーの発生コンテキスト（リクエスト情報、ユーザー情報など）
   - スタックトレースの保存
   - 関連する内部状態の記録

2. **一意のリクエストID**：

   - すべてのリクエストに一意のIDを割り当て
   - ログとエラーレスポンスでの一貫したID参照
   - 分散システム間でのトレース連携

3. **段階的なエラー情報開示**：
   - 開発環境での詳細エラー情報提供
   - 本番環境での安全なエラーメッセージ
   - 管理者向け詳細ログアクセス機能

## パフォーマンス・キャッシュ

### キャッシュ戦略

02_architecture_design.mdで定義されたパフォーマンス要件に基づき、以下のキャッシュ戦略を実装します：

1. **マルチレイヤーキャッシュ**：

   - ブラウザキャッシュ：静的リソース
   - CDNキャッシュ：公開コンテンツ
   - アプリケーションキャッシュ：動的データ
   - データベースキャッシュ：クエリ結果

2. **キャッシュ粒度**：

   - エンティティレベルキャッシュ
   - クエリ結果キャッシュ
   - ビュー/集計データキャッシュ

3. **キャッシュ無効化**：
   - 更新時の明示的な無効化
   - 依存関係に基づく連鎖無効化
   - TTLベースの自動期限切れ

### レイヤーキャッシュ

アプリケーションの各レイヤーにおけるキャッシュ実装方針は以下のとおりです：

1. **データアクセスレイヤー**：

   - 頻繁に参照されるエンティティのキャッシュ
   - クエリ結果セットのキャッシュ
   - リレーション解決結果のキャッシュ

2. **サービスレイヤー**：

   - 計算結果のメモ化
   - ビジネスルール評価結果のキャッシュ
   - 外部サービス呼び出し結果のキャッシュ

3. **APIレイヤー**：
   - レスポンスキャッシュ
   - 認可結果のキャッシュ
   - レート制限カウンターのキャッシュ

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「レイヤーキャッシュ」セクションを参照してください。

### 外部キャッシュ

Redisを使用した外部キャッシュは、06_utility_functions.mdで定義されたキャッシュユーティリティを用いて以下の方針で実装します：

1. **Redis活用ケース**：

   - セッションストア
   - レート制限カウンター
   - 分散ロック
   - 一時データストア
   - パブリッシュ/サブスクライブメッセージング

2. **データ構造の最適化**：

   - 効率的なシリアライズ形式
   - Redisデータ型（Hash, Set, Sorted Set等）の活用
   - メモリ使用量の最適化

3. **障害対策**：
   - 接続エラーのグレースフルな処理
   - フォールバックメカニズム
   - キャッシュウォーミング戦略

## 非同期処理・バックグラウンド処理

### メッセージキュー

01_requirements_definition.mdで定義された非同期処理要件に基づき、以下のメッセージキュー実装を行います：

1. **キューの実装**：

   - Redis Streams/Lists によるキュー実装
   - 優先度キューのサポート
   - Dead Letter Queue（DLQ）の実装

2. **メッセージ形式**：

   - JSON形式のメッセージペイロード
   - メタデータ（送信時刻、送信者情報など）
   - 冪等性キーの付与

3. **発行/購読パターン**：
   - トピックベースのメッセージングモデル
   - イベントソーシングとの連携
   - フィルタリングとルーティング

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「メッセージキュー」セクションを参照してください。

### バックグラウンドジョブ

バックグラウンドジョブの実装は、02_architecture_design.mdで定義されたジョブ処理アーキテクチャに基づき、以下の方針で行います：

1. **ジョブ管理システム**：

   - ジョブの定義と登録
   - ジョブのスケジューリングと実行
   - ジョブの進捗追跡
   - ジョブの結果管理

2. **ジョブタイプ**：

   - 一回限りのジョブ
   - 定期実行ジョブ
   - トリガーベースのジョブ
   - 長時間実行ジョブ

3. **エラー処理**：
   - リトライポリシーの設定
   - 失敗ジョブの隔離
   - エラー通知メカニズム

### スケジューリング

スケジュール実行ジョブは、以下のパターンで実装します：

1. **CRON式定義**：

   - 標準CRON形式による実行スケジュール定義
   - タイムゾーン対応
   - 日付制約の設定（開始日、終了日）

2. **実行制御**：

   - 同時実行の制御（ロック機構）
   - リソース使用量の制限
   - 実行順序の依存関係定義

3. **監視と報告**：
   - 実行履歴の記録
   - 異常検知と通知
   - パフォーマンス統計の収集

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「スケジュールジョブ」セクションを参照してください。

### WebSocketの実装

リアルタイム通信とイベント駆動型の機能を実現するため、WebSocketは以下の方針で実装します：

1. **接続管理と認証**：

   - JWTトークンを使用したWebSocket接続認証
   - セッション情報の検証とユーザー関連付け
   - 接続タイムアウトと自動再接続の処理
   - 接続状態の監視と統計収集

2. **メッセージ形式とプロトコル**：

   ```json
   {
     "type": "EVENT_TYPE",
     "payload": {
       /* イベント固有のデータ */
     },
     "meta": {
       "timestamp": "ISO日時",
       "requestId": "リクエストID",
       "sender": "送信元識別子"
     }
   }
   ```

3. **イベントタイプ**：

   - `connection` - 接続管理関連イベント
   - `notification` - ユーザー通知イベント
   - `activity` - アクティビティストリームイベント
   - `data` - データ変更イベント
   - `presence` - プレゼンス状態イベント
   - `error` - エラーイベント

4. **WebSocketセキュリティ**：

   - 認証情報の定期的な再検証
   - メッセージの入力検証とサニタイゼーション
   - レート制限の適用
   - 悪意ある接続の検出と遮断

5. **スケーラビリティと分散環境対応**：

   - Redis Pub/Subを活用した複数インスタンス間の同期
   - 接続数に応じた動的スケーリング
   - 負荷分散と冗長性確保
   - クラスター化された接続管理

6. **クライアント状態管理**：
   - 接続ユーザーのプレゼンス追跡
   - 購読チャネルの管理
   - クライアント機能のプログレッシブエンハンスメント
   - 接続品質モニタリングとフォールバック戦略

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「WebSocket実装」セクションを参照してください。

## ロギング・モニタリング

### ログ戦略

06_utility_functions.mdで定義されたロギングユーティリティを活用し、以下のログ戦略を実装します：

1. **ログレベル**：

   - ERROR：回復不能な問題
   - WARN：潜在的な問題
   - INFO：重要な処理の開始・完了
   - DEBUG：開発用の詳細情報
   - TRACE：最も詳細な診断情報

2. **ログフォーマット**：

   - JSON形式の構造化ログ
   - タイムスタンプ（ISO 8601形式）
   - サービス名、コンポーネント名
   - リクエストID、セッションID
   - ユーザーコンテキスト（匿名化）

3. **出力先**：
   - 開発環境：コンソール
   - テスト/本番環境：ファイル + 集中ログ管理システム
   - 重大エラー：アラート通知システム

### メトリクス収集

システムパフォーマンスのモニタリングのため、以下のメトリクスを収集します：

1. **アプリケーションメトリクス**：

   - APIリクエスト数と応答時間
   - エラー発生率
   - アクティブユーザー数
   - 同時接続数

2. **リソースメトリクス**：

   - CPU/メモリ使用率
   - ディスクI/O
   - ネットワークトラフィック
   - データベース接続数

3. **ビジネスメトリクス**：
   - ユーザー登録数
   - プロジェクト作成数
   - AI API呼び出し数
   - コンバージョン率

### アラート設定

システム異常の早期検知のため、以下のアラート設定を実装します：

1. **アラート条件**：

   - エラー率閾値超過
   - 応答時間閾値超過
   - リソース使用率閾値超過
   - 重要サービスの死活監視

2. **通知チャネル**：

   - Eメール
   - Slack
   - SMSまたはモバイルプッシュ通知
   - オンコール管理システム連携

3. **アラートポリシー**：
   - 重大度に応じた通知先設定
   - 時間帯に応じた通知先調整
   - アラート集約と重複排除
   - エスカレーションポリシー

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「アラート設定」セクションを参照してください。

## APIドキュメント

### ドキュメント生成

APIドキュメントは、以下の方針で生成・管理します：

1. **OpenAPI仕様採用**：

   - OpenAPI 3.0形式による仕様定義
   - リクエスト/レスポンスの型定義
   - エラーコードと説明の文書化
   - 認証方式の明示

2. **自動生成プロセス**：

   - Zodスキーマからの自動変換
   - 実装コードからの型情報抽出
   - JsDocコメントからの説明文抽出
   - CI/CDパイプラインでの自動更新

3. **インタラクティブドキュメント**：
   - Swagger UIによる閲覧・検索
   - リクエスト試行機能の提供
   - サンプルコードの自動生成
   - カスタムスタイリングとブランディング

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「APIドキュメント生成」セクションを参照してください。

### ドキュメント管理

APIドキュメントの管理は、以下の方針で行います：

1. **バージョン管理**：

   - APIバージョンごとのドキュメント管理
   - 変更履歴の明示
   - 非推奨APIの明示

2. **アクセス制御**：

   - 公開APIと内部APIの分離
   - 認証付きドキュメントアクセス
   - 役割に応じた表示内容の調整

3. **更新プロセス**：
   - コード変更と同期した自動更新
   - レビュープロセスの統合
   - 変更通知メカニズム

### クライアント生成

APIクライアントの自動生成は、以下の方針で実装します：

1. **クライアント種別**：

   - TypeScript/JavaScriptクライアント
   - React Hooksベースのクライアント
   - モバイルアプリ用クライアント（必要に応じて）

2. **生成プロセス**：

   - OpenAPI仕様からの自動生成
   - 型安全性の確保
   - エラーハンドリングの統合
   - 認証情報の適切な管理

3. **配布方式**：
   - NPMパッケージとしての公開
   - バージョン管理とセマンティックバージョニング
   - 変更履歴の文書化

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「APIクライアント生成」セクションを参照してください。

## 多言語対応（国際化）

01_requirements_definition.mdで定義された多言語対応要件に基づき、以下の実装方針で国際化機能を提供します：

### 翻訳リソース管理

翻訳リソースは、以下の方針で管理します：

1. **リソースの構造化**：

   - 04_implementation_rules.mdで定義された翻訳キーの命名規則に従ったJSON構造
   - 言語ごとのリソースファイル分離
   - 動的な翻訳読み込みと遅延ロード

2. **翻訳管理API**：

   ```
   /api/v1/translations              # 翻訳リソース一覧取得
   /api/v1/translations/:lang        # 特定言語の翻訳取得
   /api/v1/translations/:lang/:key   # 特定キーの翻訳取得/更新
   ```

3. **翻訳キャッシュ**：
   - サーバーサイドキャッシュによるパフォーマンス最適化
   - バージョン管理によるキャッシュ制御
   - 言語ごとのキャッシュ分離

### 多言語コンテンツ管理

ユーザー生成コンテンツの多言語対応は、以下のパターンで実装します：

1. **翻訳キー管理**：

   - 静的コンテンツへの翻訳キー割り当て
   - 翻訳キーの階層化による管理効率向上
   - 欠落翻訳の自動検出と通知

2. **翻訳ワークフロー自動化**：

   - 新規翻訳キーの自動抽出
   - 翻訳更新時の差分管理
   - 翻訳ステータスの追跡

3. **言語ごとのコンテンツバージョン**：

   - 言語ごとのコンテンツ管理
   - バージョン履歴の保持
   - 言語間の同期状態追跡

4. **未翻訳コンテンツのフォールバック**：

   - 翻訳が存在しない場合のデフォルト言語表示
   - 部分的翻訳の組み合わせ
   - 自動翻訳サービスとの連携（オプション）

5. **動的コンテンツの翻訳管理**：
   - ユーザー生成コンテンツの翻訳状態管理
   - オンデマンド翻訳リクエスト
   - 翻訳メタデータの保存

### 言語検出と選択

ユーザーの言語設定と自動検出は、以下の方針で実装します：

1. **Accept-Language処理**：

   - リクエストヘッダーからの言語優先順位取得
   - 言語タグの解析と正規化
   - サポート言語との照合

2. **ユーザー言語設定**：

   - ユーザープロファイルへの言語設定保存
   - UI/UXでの言語選択支援
   - 認証済みユーザーの言語設定の永続化

3. **コンテンツベース言語検出**：

   - 入力テキストからの言語推定
   - 自然言語処理による言語識別
   - 混合言語コンテンツの処理

4. **地域IPに基づくデフォルト言語**：

   - ジオロケーションデータに基づく初期言語提案
   - リージョン設定との連携
   - プライバシー考慮のオプトアウト機能

5. **UI言語と通知言語の分離**：
   - インターフェース言語と通知言語の独立設定
   - コンテンツタイプごとの言語設定
   - ドメイン/サブドメインごとの言語設定

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「多言語対応」セクションを参照してください。

## サーバーサイドテスト戦略

04_implementation_rules.mdで定義されたテスト実装パターンに基づき、サーバーサイドのテストを以下の方針で実装します：

### ユニットテスト

ユニットテストは、個々のコンポーネントを分離してテストします：

1. **テスト対象**：

   - ドメインサービス
   - ユースケース
   - バリデーションロジック
   - ユーティリティ関数
   - ヘルパークラス

2. **テストパターン**：

   - 入力値テスト（正常系/異常系）
   - 境界値テスト
   - モックを使用した依存性分離
   - 例外発生テスト

3. **実装例**：

   ```typescript
   // ユーザーサービスのユニットテスト
   describe('UserService', () => {
     let userService: UserService;
     let mockUserRepository: MockUserRepository;

     beforeEach(() => {
       mockUserRepository = new MockUserRepository();
       userService = new UserService(mockUserRepository);
     });

     it('should create a user with valid data', async () => {
       // テスト実装
     });

     it('should throw validation error for invalid email', async () => {
       // テスト実装
     });

     it('should not create user with duplicate email', async () => {
       // テスト実装
     });
   });
   ```

4. **テストカバレッジ目標**：
   - ドメインサービス: 100%
   - ユースケース: 100%
   - ユーティリティ: 100%
   - エンティティ/値オブジェクト: 95%以上

### 統合テスト

統合テストは、複数のコンポーネントの連携をテストします：

1. **テスト対象**：

   - APIエンドポイント
   - リポジトリ実装
   - サービス間連携
   - トランザクション処理

2. **テスト環境**：

   - テスト用データベース（実DBまたはインメモリDB）
   - モック外部サービス
   - テスト用設定

3. **実装例**：

   ```typescript
   // プロジェクト作成APIの統合テスト
   describe('Project API', () => {
     let app: Express;
     let testDb: TestDatabase;

     beforeAll(async () => {
       testDb = await setupTestDatabase();
       app = createTestApp(testDb);
     });

     afterAll(async () => {
       await teardownTestDatabase(testDb);
     });

     it('should create a project via API', async () => {
       // テスト実装
     });

     it('should retrieve project list with pagination', async () => {
       // テスト実装
     });
   });
   ```

4. **テストデータ管理**：
   - テスト前の既知状態へのリセット
   - シード値によるデータ初期化
   - テスト間の分離保証

### E2Eテスト

エンドツーエンドテストは、実際のユーザーフローを模したテストを実施します：

1. **テスト対象**：

   - 完全なユーザーフロー
   - 認証/認可フロー
   - 複雑なビジネスプロセス

2. **テスト環境**：

   - 本番に近い構成のテスト環境
   - 実際のDB接続
   - モック外部サービス

3. **テストシナリオ例**：

   - ユーザー登録～プロジェクト作成～メンバー招待～共同編集
   - パスワードリセットフロー
   - プログラム作成～ステップ実行～成果物生成

4. **ツールとフレームワーク**：
   - Jest + Supertest
   - Playwright/Puppeteer（UI連携テスト）
   - CI/CDパイプライン統合

### パフォーマンステスト

パフォーマンステストは、システムの非機能要件を検証します：

1. **テスト対象**：

   - API応答時間
   - 同時接続処理能力
   - データベースクエリパフォーマンス
   - メモリ使用効率

2. **テスト手法**：

   - 負荷テスト（徐々に負荷を上げる）
   - ストレステスト（耐久限界の検証）
   - スパイクテスト（急激な負荷変動）
   - 長時間実行テスト

3. **測定指標**：
   - 応答時間（平均、95パーセンタイル、最大）
   - スループット（RPS）
   - エラー率
   - リソース使用率

### テスト自動化と継続的実行

テストの自動化と継続的実行の仕組みを構築します：

1. **CI/CD統合**：

   - プッシュ/PRごとのユニットテスト実行
   - マージ前の統合テスト実行
   - 夜間ビルドでのE2Eテスト実行
   - スケジュールされたパフォーマンステスト

2. **テストレポート**：

   - テスト結果の自動収集
   - カバレッジレポート生成
   - 時系列パフォーマンス追跡
   - 障害分析ダッシュボード

3. **テスト品質管理**：
   - テストコード品質の確保
   - テスト重複の排除
   - 脆弱なテストの特定と改善
   - テストメンテナンスの効率化

> **参照**: 具体的な実装例については「code_examples/07_server_implementation_examples.md」の「サーバーサイドテスト」セクションを参照してください。
