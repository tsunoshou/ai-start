# プロジェクトセットアップ概要

最終更新日: 2025-03-31

## 目的

このドキュメントは、AiStartプロジェクトの立ち上げから現在までに行われた主要なセットアップ内容、使用されている技術スタック、およびそのバージョンをまとめたものです。プロジェクトの全体像を把握するための参照資料として使用します。

## 主要技術スタックとバージョン

以下は、プロジェクトで使用されている主要な技術要素と、`package.json` または実行環境から確認されたバージョンです。

*   **Node.js**: `v23.7.0` (*注: `docs/01_requirements_definition.md` では v22 LTS 指定*)
*   **Next.js**: `^14.1.3`
*   **React**: `^18.2.0`
*   **TypeScript**: `^5.3.3`
*   **Tailwind CSS**: `^3.4.1`
*   **Auth.js (Core)**: `^0.38.0`
*   **Auth.js (NextAuth v5 Beta)**: `^5.0.0-beta.3`
*   **Drizzle ORM**: `^0.41.0`
*   **Drizzle Kit**: `^0.30.6` (*`devDependencies`*)
*   **PostgreSQL Driver (`pg`)**: `^8.14.1`
*   **node-pg-migrate**: `^7.9.1` (*`devDependencies`*)
*   **ESLint**: `^8.57.0` (*`devDependencies`*)
*   **Prettier**: `^3.2.5` (*`devDependencies`*)
*   **TanStack Query (React Query)**: `^5.28.2`
*   **shadcn/ui**: (バージョン管理なし、CLIで導入)
*   **Lucide React**: `^0.359.0`
*   **Husky**: `^9.1.7` (*`devDependencies`*)
*   **lint-staged**: `^15.5.0` (*`devDependencies`*)
*   **Database**: PostgreSQL (Supabase 提供)
*   **Supabase JS Client**: `^2.44.2`
*   **Supabase Auth Helpers**: `^0.9.0`

## セットアップリスト

1.  **プロジェクト初期化 & 基本設定**:
    *   **Next.js (v14.1.3, React 18.2.0)** プロジェクト (`ai-start`) を **TypeScript (v5.3.3)** で作成。
    *   Git リポジトリを初期化。
    *   `package.json` にプロジェクト情報、スクリプト、依存関係を定義 (現バージョン: `0.2.0`)。
    *   `tsconfig.json` で TypeScript コンパイラオプションを設定 (strict モード有効)。
    *   **Node.js (v23.7.0)** を開発環境として使用 (要件定義との差異あり)。

2.  **コード品質 & フォーマット**:
    *   **ESLint (v8.57.0)** と **Prettier (v3.2.5)** を導入し、設定ファイル (`.eslintrc.json`, `.prettierrc.js`, `.prettierignore`) でルールを構成。
    *   **Husky (v9.1.7)** と **lint-staged (v15.5.0)** を設定し、コミット前の自動チェックを実装。

3.  **UI 開発**:
    *   **Tailwind CSS (v3.4.1)** を導入し、設定ファイル (`tailwind.config.ts`, `postcss.config.js`) を構成。
    *   **shadcn/ui** を導入・設定 (`components.json`) し、UI コンポーネントの基盤を構築。
    *   **Lucide React (v0.359.0)** アイコンライブラリを導入。

4.  **クライアントサイド状態管理**:
    *   **TanStack Query (React Query v5.28.2)** を導入し、データフェッチングとキャッシュ管理を設定。

5.  **認証**:
    *   **Auth.js (Core v0.38.0, next-auth v5.0.0-beta.3)** を導入し、認証基盤を設定 (`/lib/auth.ts` 等)。
    *   **Supabase Auth Helpers (v0.9.0)** も依存関係に追加済み。

6.  **データベース & ORM**:
    *   データベースとして **PostgreSQL** (Supabase 提供) を選択。
    *   **Supabase JS Client (v2.44.2)** を導入。
    *   **Drizzle ORM (v0.41.0)** と **Drizzle Kit (v0.30.6)** を導入。
    *   データベーススキーマ定義 (`/infrastructure/database/schema/`) と Drizzle 設定ファイル (`drizzle.config.ts`) を作成。
    *   PostgreSQL ドライバー **`pg` (v8.14.1)** を導入。

7.  **データベースマイグレーション**:
    *   **`node-pg-migrate` (v7.9.1)** を導入。
    *   マイグレーション実行用 npm スクリプト (`db:migrate`) を `package.json` に追加。
    *   マイグレーションファイルを管理するディレクトリ (`/infrastructure/database/migrations/`) を作成し、初期ファイルを追加。

8.  **CI/CD (GitHub Actions)**:
    *   データベースマイグレーション用 GitHub Actions ワークフロー (`.github/workflows/database-migration.yml`) を作成・設定。
    *   トリガー条件（ブランチ、パス）を設定。
    *   Node.js セットアップ、依存関係インストール、マイグレーション実行 (`npm run db:migrate`) のステップを定義。
    *   **CI/CD 用**のデータベース接続情報 (`DATABASE_URL`) は、**GitHub Environments の Secrets** として環境ごとに設定し、ワークフローから参照。
        *   GitHub Environment 名 (例: `Production`, `Staging`, `Preview`) は、Vercel 環境 (Production, Staging, Preview) および対応するブランチ (`main`, `release/*`, `development`) と連動して設定。

9.  **バージョン管理 & ブランチ戦略**:
    *   基本的な Git ブランチ戦略を定義・運用。
    *   上記設定変更をコミットし、`development` ブランチへ統合。
    *   `package.json` のバージョンを **`0.2.0`** に更新。

10. **ドキュメンテーション**:
    *   `docs/` ディレクトリを作成し、プロジェクトの目的、要件、アーキテクチャ、実装ルールなどを定義する Markdown ドキュメント群 (`01_requirements_definition.md`, `02_architecture_design.md`, etc.) を作成・整備。

11. **ホスティング (Vercel)**:
    *   Next.js アプリケーションのホスティングプラットフォームとして Vercel を使用。
    *   GitHub リポジトリ (`tsunoshou/ai-start`) と連携済み。
    *   **ドメイン設定** (お名前.com で管理):
        *   ルートドメイン: `ai-start.net`
        *   ネームサーバー: お名前.com のネームサーバーを使用。
        *   DNS レコード設定:
            *   ルート (`@`): `A` レコード, TTL `3600`, 値 `76.76.21.21` (Vercel 指定 IP)
            *   サブドメイン (`www`, `staging`, `dev`): `CNAME` レコード, TTL `3600`, 値 `cname.vercel-dns.com.` (Vercel 指定 CNAME)
    *   **ブランチと環境・ドメインの対応**:
        *   `main` ブランチ -> Vercel **Production** 環境 -> `ai-start.net` (および `www.ai-start.net`)
        *   `release/*` ブランチ -> Vercel **Staging** 環境 (カスタムドメイン) -> `staging.ai-start.net`
        *   `development` ブランチ -> Vercel **Preview** 環境 (カスタムドメイン) -> `dev.ai-start.net`
        *   その他 Feature ブランチ -> Vercel **Preview** 環境 (自動生成 URL)
    *   **ビルド設定**: Vercel の標準 Next.js ビルドプリセットを使用。
    *   **その他**: 必要に応じてリダイレクト、ヘッダー等の設定を `vercel.json` または Vercel ダッシュボードで構成。

12. **バックエンドサービス (Supabase)**:
    *   PostgreSQL データベース、認証、ストレージなどのバックエンドサービスを提供。
    *   **環境ごとの Supabase プロジェクト設定**:
        *   `main` ブランチ用 (Production): `ai_start_prod`
        *   `release/*` ブランチ用 (Staging): `ai_start_staging`
        *   `development` ブランチ用 (Development/Preview): `ai_start_dev`
    *   **環境変数**: Vercel 環境変数として設定 (詳細は上記参照)。
    *   **認証**: Supabase Auth を利用 (プロバイダー設定等はプロジェクト進行に合わせて実装)。
    *   **データベース**: PostgreSQL を Drizzle ORM 経由で利用。Row Level Security (RLS) ポリシーは `infrastructure/database/rls/` 等で管理・適用想定 (詳細は `docs/04_implementation_rules.md` 参照)。
    *   **ストレージ**: Supabase Storage を利用 (具体的なバケット設定等はプロジェクト進行に合わせて実装)。

13. **テスト**:
    *   **フレームワーク**: Jest を導入 (`jest.config.js`, `jest.setup.js` で設定)。
    *   **ライブラリ**: React Testing Library を使用。
    *   **カバレッジ**: ユニットテスト、統合テスト、E2E テストを実装予定 (詳細は `docs/09_testing_implementation.md` 参照)。

14. **ローカル開発環境**:
    *   **Supabase CLI**: ローカルでのマイグレーション管理、型生成、DB 操作に使用。
    *   **環境変数**: `.env.local` ファイルにローカル Supabase プロジェクトの接続情報などを設定。
    *   **起動コマンド**: `npm run dev` で開発サーバーを起動。
    *   (詳細は `docs/01_requirements_definition.md` の「環境分離戦略」参照)

15. **国際化 (i18n)**:
    *   **ライブラリ**: `next-intl` を導入。
    *   **設定**: 言語リソース (`/messages`), 設定ファイル (`i18n.ts`) 等を構成。
    *   (実装ルール詳細は `docs/04_implementation_rules.md` 参照)

16. **依存性注入 (DI)**:
    *   **ライブラリ**: `tsyringe` を導入。
    *   **設定**: リフレクションメタデータ (`reflect-metadata`) を利用。
    *   (具体的な利用パターンは `docs/01_requirements_definition.md` および実装コード参照)

---

*このドキュメントは、プロジェクトの進行に合わせて適宜更新する必要があります。* 