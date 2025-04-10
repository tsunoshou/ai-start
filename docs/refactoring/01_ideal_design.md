# 1. 設計書：Core SaaS Framework 理想構成の設計

## 🎯 目的

この設計書は、単一のSaaSアプリケーションから、**再利用可能なSaaS製造マシン**への進化を実現するための理想的な構造を定義します。この設計により、複数のSaaSプロジェクトで再利用可能なコンポーネントを効率的に作成・管理できるようになります。

## 📋 前提条件

- **ドメイン駆動設計（DDD）と Clean Architecture の採用**
  - ドメイン中心の設計
  - レイヤー間の明確な責任分離
  - 依存関係の方向の制御（内側に依存）

- **TypeScript による型安全性の確保**
  - 厳格な型定義によるバグの防止
  - 高い保守性と拡張性の提供

- **Next.js によるフロントエンド**
  - App Router の活用
  - Server Components と Client Components の適切な使い分け

- **ORM**: Drizzle ORM
- **データベース**: PostgreSQL
- **認証**: Supabase Auth
- **テスト**: Vitest (Unit/Integration), Playwright (E2E)

## 🏗️ 全体アーキテクチャ

**モノレポアプローチ**（Turborepo または pnpm workspaces による実装）を採用します。

### モノレポのメリット

- **コード共有の容易さ**：共通コンポーネントやロジックを複数アプリケーションで再利用
- **一貫性の維持**：設計原則、コーディング規約、テスト戦略の統一
- **独立したデプロイ**：個別のパッケージやアプリケーションを独立してデプロイ可能
- **将来のマイクロサービス化への準備**：モジュール間の境界と依存関係の明確化

## 📂 ディレクトリ構造 (理想形)

```
/
├── apps/                    # アプリケーション
│   ├── saas-app/            # メインSaaSアプリケーション
│   │   ├── app/             # Next.js App Router
│   │   ├── public/          # 静的ファイル
│   │   ├── tests/           # アプリケーション固有テスト
│   │   │   └── e2e/         # E2Eテスト
│   │   │       └── __tests__/
│   │   │           └── user-login.e2e.test.ts
│   │   └── package.json     # アプリ固有の依存関係
│   └── admin/               # 管理者向けアプリケーション（将来的に）
│
├── packages/                # 再利用可能なパッケージ
│   ├── shared/              # 共通ユーティリティ・ベース定義
│   │   ├── base/            # 基本クラス・インターフェース (entity.base.ts, repository.base.interface.ts)
│   │   ├── errors/          # エラー定義 (app.error.ts)
│   │   ├── result/          # Result型 (result.ts)
│   │   ├── types/           # 共通型定義 (common.types.ts)
│   │   ├── utils/           # ユーティリティ関数 (id.utils.ts)
│   │   └── value-objects/   # 共通値オブジェクト (id.vo.ts)
│   │
│   ├── infrastructure/      # インフラストラクチャコンポーネント
│   │   ├── database/        # DBクライアント (Drizzle), スキーマ
│   │   ├── auth/            # 認証サービス (Supabase連携)
│   │   └── logger/          # ロギング
│   │
│   ├── ui/                  # UI コンポーネント
│   │   ├── components/      # 再利用可能なUIコンポーネント (button.tsx)
│   │   ├── hooks/           # カスタムフック (use-toast.ts)
│   │   └── providers/       # コンテキストプロバイダー (theme-provider.tsx)
│   │
│   ├── user/                # ユーザードメインパッケージ
│   │   ├── domain/          # ドメイン層 (詳細は下記)
│   │   ├── application/     # アプリケーション層 (詳細は下記)
│   │   └── infrastructure/  # インフラストラクチャ層 (詳細は下記)
│   │
│   └── [domain-name]/       # その他のドメインパッケージ
│       └── ...              # userと同様の構造
│
├── pnpm-workspace.yaml      # workspaceの設定
├── tsconfig.base.json       # 共通TypeScript設定
└── turbo.json               # Turborepo設定 (または類似ツール)
```

## 📦 ドメインパッケージの内部構造 (例: user)

各ドメインパッケージは以下の構造を持ちます：

```
packages/user/
├── domain/                  # ドメイン層
│   ├── entities/            # エンティティ
│   │   ├── __tests__/
│   │   │   └── user.entity.unit.test.ts
│   │   └── user.entity.ts
│   │
│   ├── value-objects/       # 値オブジェクト
│   │   ├── __tests__/
│   │   │   └── email.vo.unit.test.ts
│   │   ├── user-id.vo.ts
│   │   └── email.vo.ts
│   │
│   ├── enums/               # 列挙型
│   │   ├── __tests__/
│   │   │   └── user-status.enum.unit.test.ts
│   │   └── user-status.enum.ts
│   │
│   ├── repositories/        # リポジトリインターフェース
│   │   └── user.repository.interface.ts
│   │
│   └── services/            # ドメインサービス (該当する場合)
│       ├── __tests__/
│       │   └── authentication.service.unit.test.ts
│       └── authentication.service.ts
│
├── application/             # アプリケーション層
│   ├── usecases/            # ユースケース
│   │   ├── __tests__/
│   │   │   ├── create-user.usecase.unit.test.ts
│   │   │   └── create-user.usecase.integration.test.ts
│   │   ├── create-user.usecase.ts
│   │   └── authenticate-user.usecase.ts
│   │
│   └── dtos/                # データ転送オブジェクト
│       ├── user.dto.ts
│       └── authentication.dto.ts
│
├── infrastructure/          # インフラストラクチャ層
│   ├── repositories/        # リポジトリ実装
│   │   ├── __tests__/
│   │   │   └── user.repository.integration.test.ts
│   │   └── user.repository.ts  # Drizzleによる実装
│   │
│   └── mappers/             # マッパー
│       ├── __tests__/
│       │   └── user.mapper.unit.test.ts
│       └── user.mapper.ts
│
└── README.md                 # パッケージ固有の説明
```

## 🔄 パッケージの依存関係

依存方向は以下の原則に従います：

1. **内側への依存**: 外側のレイヤーは内側のレイヤーに依存可能、その逆は不可
   - Infrastructure → Application → Domain

2. **ドメイン間の依存**: 必要な場合のみドメイン間の依存を許可
   - たとえば `@core/subscription` が `@core/user` に依存するケース（ID参照など）

3. **共通パッケージへの依存**: すべてのパッケージは共通パッケージに依存可能
   - すべてのパッケージ → `@core/shared`

## 🔍 他のドキュメントへの参照

- 実装手順の詳細は [移行計画書](./02_migration_plan.md) を参照
- ドメイン実装の詳細は [ベースドメイン実装指示書](./03_base_domain_guide.md) と [Userドメイン実装指示書](./04_user_domain_guide.md) を参照
- 将来的な拡張計画については [将来展開計画書](./05_future_expansion_plan.md) を参照 