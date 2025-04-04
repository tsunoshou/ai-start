# プロジェクトセットアップ概要

最終更新日: 2024-04-05

## 目的

このドキュメントは、AiStartプロジェクトの立ち上げから現在までに行われた主要なセットアップ内容、使用されている技術スタック、およびそのバージョンをまとめたものです。プロジェクトの全体像を把握するための参照資料として使用します。

## 主要技術スタックとバージョン

以下は、プロジェクトで使用されている主要な技術要素と、`package-lock.json` に記録されている厳密なバージョンです。

**Core Frameworks & Runtime:**
*   **Node.js**: v23.7.0 (*実行環境*)
*   **Next.js**: 14.2.26
*   **React**: 18.3.1
*   **TypeScript**: 5.3.3

**UI & Styling:**
*   **Tailwind CSS**: 3.4.17
    *   `postcss`: 8.4.42 (*dependencies*)
    *   `autoprefixer`: 10.4.19 (*devDependencies*)
    *   `prettier-plugin-tailwindcss`: 0.6.11 (*devDependencies*) - Prettier 連携
*   **shadcn/ui**: (バージョン管理なし、CLIで導入)
*   **Lucide React**: 0.359.0

**Database & ORM:**
*   **Database**: PostgreSQL (Supabase 提供)
*   **Drizzle ORM**: 0.41.0 (*dependencies*)
    *   `Drizzle Kit`: 0.30.6 (*`devDependencies`*) - CLI ツール
*   **PostgreSQL Drivers/Clients:**
    *   `pg`: 8.14.1 (*dependencies*) - Node.js ドライバー
    *   `@types/pg`: 8.11.11 (*dependencies*)
    *   `postgres`: 3.4.3 (*dependencies*) - Node.js クライアント
    *   `@vercel/postgres`: 0.10.0 (*dependencies*) - Vercel 接続用
*   **Migration Tool:**
    *   `node-pg-migrate`: 7.9.1 (*`devDependencies`*)

**State Management & Data Fetching:**
*   **TanStack Query (React Query)**: 5.71.1 (*dependencies*)

**Authentication:**
*   **Auth.js (Core)**: 0.38.0 (*dependencies*)
*   **Auth.js (NextAuth v5 Beta)**: 5.0.0-beta.25 (*dependencies*)
*   **Supabase SSR**: 0.6.1 (*dependencies*, `@supabase/ssr`)

**Testing:**
*   **Vitest**: 3.1.1 (*`devDependencies`*) - Unit/Integration テストフレームワーク
    *   `@vitejs/plugin-react`: 4.3.4 (*devDependencies*) - Vite React プラグイン
    *   `@vitest/browser`: 3.1.1 (*devDependencies*) - ブラウザモード
    *   `@vitest/coverage-v8`: 3.1.1 (*devDependencies*) - カバレッジ
    *   `jsdom`: 26.0.0 (*devDependencies*) - DOM 環境エミュレーション
*   **Playwright**: 1.51.1 (*devDependencies*) - E2E テストフレームワーク
    *   `@playwright/test`: 1.51.1 (*`devDependencies`*) - テストランナー
*   **Testing Library:**
    *   `@testing-library/react`: 14.3.1 (*`devDependencies`*) - React テストユーティリティ
    *   `@testing-library/jest-dom`: 6.6.3 (*devDependencies*) - DOM マッチャー
    *   `@types/testing-library__jest-dom`: 5.14.9 (*devDependencies*)

**Linting & Formatting:**
*   **ESLint**: 8.57.1 (*`devDependencies`*)
    *   `@typescript-eslint/eslint-plugin`: 7.18.0 (*devDependencies*)
    *   `@typescript-eslint/parser`: 7.18.0 (*devDependencies*)
    *   `eslint-config-next`: 14.2.26 (*devDependencies*)
    *   `eslint-config-prettier`: 9.1.0 (*devDependencies*)
    *   `eslint-plugin-import`: 2.29.1 (*devDependencies*)
    *   `eslint-plugin-react`: 7.37.4 (*devDependencies*)
    *   `eslint-plugin-storybook`: 0.12.0 (*`devDependencies`*) - ESLint 連携
*   **Prettier**: 3.2.5 (*`devDependencies`*)
*   **Git Hooks:**
    *   `Husky`: 9.1.7 (*`devDependencies`*)
    *   `lint-staged`: 15.5.0 (*`devDependencies`*)
    *   `rimraf`: 6.0.1 (*devDependencies*) - ファイル/ディレクトリ削除ツール
    *   `glob`: 11.0.1 (*devDependencies*) - パターンマッチング

**Build & Development Tools:**
*   **esbuild**: 0.25.2 (*devDependencies*, version overridden) - ビルドツール
*   **tsx**: 4.7.0 (*devDependencies*) - TypeScript 実行環境
*   **dotenv**: 16.4.5 (*dependencies*) - 環境変数読み込み
*   **Type Definitions:**
    *   `@types/node`: 20.17.28 (*devDependencies*)
    *   `@types/react`: 18.3.20 (*devDependencies*)
    *   `@types/react-dom`: 18.3.5 (*devDependencies*)

**Internationalization (i18n):**
*   **next-intl**: 3.26.5 (*dependencies*)
*   **next-international**: 1.3.1 (*dependencies*)

**Dependency Injection (DI):**
*   **tsyringe**: 4.8.0 (*dependencies*)
*   **reflect-metadata**: 0.2.1 (*dependencies*)

**Backend Services (Supabase):**
*   **Supabase JS Client**: 2.44.2 (*dependencies*)
*   **Supabase CLI:**
    *   `supabase`: 2.20.5 (*devDependencies*)
    *   `supabase-cli`: 0.0.21 (*devDependencies*)

**Component Development & Documentation (Storybook):**
*   **Storybook**: 8.6.12 (*`devDependencies`*)
    *   `@storybook/addon-essentials**: 8.6.12 (*`devDependencies`*) - 基本アドオン
    *   `@storybook/experimental-addon-test**: 8.6.12 (*`devDependencies`*) - テストアドオン
    *   `@storybook/experimental-nextjs-vite**: 8.6.12 (*`devDependencies`*) - Next.js 連携
    *   `@storybook/addon-onboarding**: 8.6.12 (*devDependencies*)
    *   `@storybook/blocks**: 8.6.12 (*devDependencies*)
    *   `@storybook/react**: 8.6.12 (*devDependencies*)
    *   `@storybook/test**: 8.6.12 (*devDependencies*)
    *   `eslint-plugin-storybook**: 0.12.0 (*`devDependencies`*) - ESLint 連携
    *   `@chromatic-com/storybook**: 3.2.6 (*devDependencies*) - Chromatic 連携

**Other Libraries:**
*   **openai**: 4.91.1 (*dependencies*) - OpenAI API クライアント
*   **zod**: 3.22.4 (*dependencies*) - スキーマバリデーション

## セットアップリスト

1.  **プロジェクト初期化 & 基本設定**:
    *   **Next.js (v14.1.3, React 18.2.0)** プロジェクト (`ai-start`) を **TypeScript (v5.3.3)** で作成。
    *   Git リポジトリを初期化。
    *   `package.json` にプロジェクト情報、スクリプト、依存関係を定義 (現バージョン: `0.2.0`)。
    *   `tsconfig.json` で TypeScript コンパイラオプションを設定 (strict モード有効)。
    *   **Node.js (v23.7.0)** を開発環境として使用 (要件定義との差異あり)。

2.  **コード品質 & フォーマット**:
    *   **ESLint (v8.57.0)** と **Prettier (v3.2.5)** を導入し、設定ファイル (`.eslintrc.js`, `.prettierrc.js`, `.prettierignore`) でルールを構成。
    *   **Husky (v9.1.7)** と **lint-staged (v15.5.0)** を設定し、コミット前の自動チェックを実装。

3.  **UI 開発**:
    *   **Tailwind CSS (v3.4.1)** を導入し、設定ファイル (`tailwind.config.js`, `postcss.config.js`) を構成。
    *   **shadcn/ui** を導入・設定 (`components.json`) し、UI コンポーネントの基盤を構築。
    *   **Lucide React (v0.359.0)** アイコンライブラリを導入。

4.  **クライアントサイド状態管理**:
    *   **TanStack Query (React Query v5.28.2)** を導入し、データフェッチングとキャッシュ管理を設定。

5.  **認証**:
    *   **Auth.js (Core v0.38.0, next-auth v5.0.0-beta.3)** を導入し、認証基盤を設定 (`/lib/auth.ts` 等)。
    *   **Supabase SSR (v0.6.1)** を導入 (`@supabase/ssr`)。

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
        *   `release/*` ブランチ -> Vercel **staging** 環境 (カスタムドメイン) -> `staging.ai-start.net`
        *   `development` ブランチ -> Vercel **Preview** 環境 (カスタムドメイン) -> `dev.ai-start.net`
        *   その他 Feature ブランチ -> Vercel **Preview** 環境 (自動生成 URL)
    *   **ビルド設定**: Vercel の標準 Next.js ビルドプリセットを使用。
    *   **その他**: 必要に応じてリダイレクト、ヘッダー等の設定を `vercel.json` または Vercel ダッシュボードで構成。

12. **バックエンドサービス (Supabase)**:
    *   PostgreSQL データベース、認証、ストレージなどのバックエンドサービスを提供。
    *   **環境ごとの Supabase プロジェクト設定**:
        *   `main` ブランチ用 (Production): `ai_start_prod`
        *   `release/*` ブランチ用 (staging): `ai_start_staging`
        *   `development` ブランチ用 (Development/Preview): `ai_start_dev`
    *   **環境変数**: Vercel 環境変数として設定 (詳細は上記参照)。
    *   **認証**: Supabase Auth を利用 (プロバイダー設定等はプロジェクト進行に合わせて実装)。
    *   **データベース**: PostgreSQL を Drizzle ORM 経由で利用。Row Level Security (RLS) ポリシーは `infrastructure/database/rls/` 等で管理・適用想定 (詳細は `docs/04_implementation_rules.md` 参照)。
    *   **ストレージ**: Supabase Storage を利用 (具体的なバケット設定等はプロジェクト進行に合わせて実装)。

13. **テスト**:
    *   **フレームワーク**: **Vitest** (ユニット/統合テスト) と **Playwright** (E2Eテスト) を導入 (`vitest.config.ts`, `playwright.config.ts` で設定)。
    *   **ライブラリ**: **`@testing-library/react`** を使用。
    *   **テストセットアップ**: `tests/setupTests.ts` で Vitest のグローバル設定や **`@testing-library/jest-dom`** マッチャーの統合を行う。
    *   **CI/CD連携**: GitHub Actions (`.github/workflows/ci.yml`) でユニット/統合テスト (`npm run test:unit`) と E2Eテスト (`npm run test:e2e`) を自動実行するよう設定済み。
    *   **カバレッジ**: ユニットテスト、統合テスト、E2E テストを実装 (詳細は `docs/09_testing_implementation.md` 参照)。

14. **ローカル開発環境**:
    *   **Supabase CLI (`supabase-cli`)**: ローカルでのマイグレーション管理、型生成、DB 操作に使用。
    *   **環境変数**: `.env.local` ファイルにローカル Supabase プロジェクトの接続情報などを設定。
    *   **起動コマンド**: `npm run dev` で開発サーバーを起動。
    *   (詳細は `docs/01_requirements_definition.md` の「環境分離戦略」参照)

15. **国際化 (i18n)**:
    *   **ライブラリ**: **`next-intl`** および **`next-international`** を導入。
    *   **設定**: 言語リソース (`i18n/locales/`)、設定ファイル (`i18n/client.ts`, `i18n/server.ts` 等) を構成。
    *   (実装ルール詳細は `docs/04_implementation_rules.md` 参照)

16. **依存性注入 (DI)**:
    *   **ライブラリ**: **`tsyringe`** を導入。
    *   **設定**: **`reflect-metadata`** を利用。
    *   (具体的な利用パターンは `docs/01_requirements_definition.md` および実装コード参照)

17. **UIコンポーネント開発 & ドキュメンテーション (Storybook)**:
    *   **Storybook (v8.6.12)** を導入し、UI コンポーネントの開発、テスト、ドキュメンテーション環境を構築。
    *   `npx storybook@latest init` コマンドで初期セットアップを実行。
    *   設定ファイル (`.storybook/main.ts`, `.storybook/preview.ts` など) を生成。
    *   npm スクリプト (`storybook`, `build-storybook`) を `package.json` に追加。
    *   ESLint 設定 (`.eslintrc.js`) に `eslint-plugin-storybook` を統合。
    *   サンプルストーリー (`src/stories/`) を生成。

---

*このドキュメントは、プロジェクトの進行に合わせて適宜更新する必要があります。*