# AI-Start 開発環境セットアップガイド

最終更新日: 2025-04-01

## 1. 実行環境詳細

### システム要件

| 項目 | 要件 |
|------|------|
| Node.js | v18.0.0以上（推奨：v23.7.0） |
| npm | v8.0.0以上（推奨：v10.9.2） |
| OS | macOS, Windows, Linux |
| メモリ | 最低4GB（推奨：8GB以上） |
| ストレージ | 最低1GB空き容量 |

### 技術スタック詳細

| カテゴリ | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| フレームワーク | Next.js | 14.1.3 | Reactベースのフルスタックフレームワーク |
| 言語 | TypeScript | 5.3.3 | 型安全なJavaScript |
| スタイリング | Tailwind CSS | 3.4.1 | ユーティリティファーストCSS |
| データベース | Drizzle ORM | 0.30.4 | タイプセーフなORM |
| 認証 | Auth.js | 5.0.0-beta.3 (next-auth) / 0.38.0 (@auth/core) | 認証フレームワーク（旧NextAuth.js） |
| 状態管理 | React Query | 5.28.2 | サーバー状態管理 |
| 国際化 | next-intl | 3.9.1 | 多言語対応 |
| バックエンド連携 | Supabase | 2.44.2 | BaaS (Backend as a Service) |
| フォーム検証 | Zod | 3.22.4 | スキーマ検証 |
| DI コンテナ | TSyringe | 4.8.0 | 依存性注入 |

### 開発ツール

| ツール | バージョン | 目的 |
|--------|-----------|------|
| ESLint | 8.57.0 | コード品質チェック |
| Prettier | 3.2.5 | コードフォーマット |
| Jest | 29.7.0 | テスト |
| Testing Library | 14.2.1 | Reactコンポーネントテスト |
| Husky | 9.1.7 | Gitフック管理 |
| lint-staged | 15.5.0 | ステージングファイルのリント |
| tsx | 4.19.3 | TypeScriptの実行 |
| drizzle-kit | 0.30.6 | マイグレーション管理 |

## 2. 開発環境セットアップ手順

### 基本セットアップ

```bash
# リポジトリのクローン
git clone https://github.com/tsunoshou/ai-start.git
cd ai-start

# 依存関係のインストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定

# 開発サーバー起動
npm run dev
```

### 環境変数設定

`.env.local`に設定する主な環境変数：

```
# Auth.js（旧NextAuth.js）
AUTH_SECRET=your_auth_secret_here
AUTH_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# データベース
DATABASE_URL=your_database_connection_string
```

### VSCode設定

`.vscode/settings.json`に以下の設定が含まれています：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "javascript.preferences.importModuleSpecifier": "non-relative",
  "deno.enable": false,
  "deno.enablePaths": [],
  "deno.lint": false,
  "deno.unstable": false
}
```

推奨VSCode拡張機能：
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- GitLens
- PostCSS Language Support

### データベースセットアップ

```bash
# スキーマからマイグレーションファイル生成
npm run db:generate

# データベースにスキーマを適用
npm run db:push

# データベース管理UIの起動
npm run db:studio
```

## 3. 開発ワークフロー詳細

### ブランチ戦略

- `main`: 本番環境向けコード
- `develop`: 開発環境向けコード
- `feature/[name]`: 機能開発用
- `fix/[name]`: バグ修正用
- `refactor/[name]`: リファクタリング用

### コミット規約

コミットメッセージは以下の形式に従います：

```
[種別]: [変更内容の要約]

[詳細な説明]
```

**種別の例**:
- `文書`: ドキュメントの変更
- `設定`: 設定ファイルの変更
- `機能`: 新機能の追加
- `修正`: バグの修正
- `リファクタ`: リファクタリング
- `テスト`: テストの追加・修正
- `スタイル`: コードスタイルの変更
- `依存関係`: 依存パッケージの更新
- `ビルド`: ビルドプロセスの変更
- `その他`: その他の変更

### CI/CD パイプライン

GitHub Actionsを使用した自動化パイプライン：
- プルリクエスト時のコード品質チェック
- テスト自動実行
- 脆弱性スキャン
- main/developブランチへのマージ時の自動デプロイ

## 4. アーキテクチャ概要

### ディレクトリ構造詳細

```
ai-start/
├── app/                      # Next.js App Router
│   ├── [...locale]/          # 国際化対応
│   ├── (auth)/               # 認証関連ルート
│   ├── (dashboard)/          # ダッシュボード関連ルート
│   ├── api/                  # APIルート
│   ├── layout.tsx            # ルートレイアウト
│   └── page.tsx              # ホームページ
├── presentation/             # プレゼンテーション層
│   ├── components/           # UIコンポーネント
│   │   ├── common/           # 共通コンポーネント
│   │   ├── feature-specific/ # 機能特化コンポーネント
│   │   ├── forms/            # フォームコンポーネント
│   │   └── layouts/          # レイアウトコンポーネント
│   ├── hooks/                # Reactフック
│   ├── providers/            # Reactコンテキストプロバイダー
│   ├── styles/               # グローバルスタイル
│   └── utils/                # プレゼンテーション層ユーティリティ
├── domain/                   # ドメイン層
│   ├── models/               # ドメインモデル
│   ├── repositories/         # リポジトリインターフェース
│   ├── services/             # ドメインサービス
│   └── events/               # ドメインイベント
├── application/              # アプリケーション層
│   └── use-cases/            # ユースケース
├── infrastructure/           # インフラストラクチャ層
│   └── repositories/         # リポジトリ実装
├── shared/                   # 共通ユーティリティ
│   ├── types/                # 共通型定義
│   └── utils/                # 共通ユーティリティ関数
├── i18n/                     # 国際化設定
├── tests/                    # 結合/E2Eテスト
├── __tests__/                # ユニットテスト
├── config/                   # アプリケーション設定
├── supabase/                 # Supabase関連設定
├── .vscode/                  # VSCode設定
├── .husky/                   # Git hooks
├── docs/                     # ドキュメント
├── next.config.js            # Next.js設定
├── tailwind.config.js        # Tailwind設定
├── jest.config.js            # Jest設定
└── tsconfig.json             # TypeScript設定
```

### アーキテクチャパターン

- **クリーンアーキテクチャ**: ドメインロジックをUIから分離
- **リポジトリパターン**: データアクセスの抽象化
- **依存性注入**: TSyringeによるDI
- **サーバーアクション**: Next.jsのサーバーアクションを活用
- **領域駆動設計(DDD)**: ドメイン層の実装に適用

## 5. リンターとフォーマッター設定

### ESLint設定

プロジェクトでは厳格なESLint設定を採用しています。主要なルール：

- **基本ルール**：未使用変数のチェック（`_`プレフィックスは除外）、console文の警告
- **インポート順序**：builtin > external > internal > parent > sibling > index、アルファベット順
- **React JSX**：プロパティのソート（コールバックは最後、ショートハンドは最初）
- **命名規則**：
  - 一般関数：camelCase
  - Reactコンポーネント関数：PascalCase（app/ディレクトリや特定パスのみ許可）
  - 変数：camelCase、UPPER_CASE、PascalCaseを状況に応じて使用
  - 型/インターフェース：PascalCase（`I`プレフィックスなし）
  - グローバル定数：UPPER_CASE（metadata, configは例外）
  - enumメンバー：PascalCase

```javascript
// .eslintrc.js (一部抜粋)
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // ...各種ルール設定
  }
}
```

### Prettier設定

コード整形に関する統一設定：

- セミコロン：使用する
- 引用符：シングルクォート
- 行の最大幅：100文字
- インデント：2スペース
- トレイリングカンマ：ES5互換
- Tailwind CSSプラグイン：使用

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  jsxSingleQuote: false,
  bracketSameLine: false,
  plugins: ['prettier-plugin-tailwindcss'],
};
```

### Git Hooks設定

husky と lint-staged を使って、コミット前にコードの品質を確保：

- **pre-commit**: ステージングされたファイルに対してlint-stagedを実行
- **commit-msg**: コミットメッセージのフォーマットを検証

```json
// package.jsonのlint-staged設定
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,css,md}": [
    "prettier --write"
  ]
}
```

## 6. セキュリティ実装

### 脆弱性対策

- `npm audit`による定期的な脆弱性チェック
- 脆弱なパッケージのオーバーライド設定

```json
// package.jsonのセキュリティ対策例
"overrides": {
  "esbuild": "^0.25.2"
}
```

### 認証セキュリティ

- Auth.js（旧NextAuth.js）によるセキュアな認証フロー
- JWTトークンの適切な管理
- CSRFトークンによるクロスサイトリクエストフォージェリ対策

### データセキュリティ

- Drizzle ORMによるSQL Injection防止
- zodによる入力データのバリデーション
- SupabaseのRLSによる行レベルセキュリティ

## 7. 動作確認方法

### ローカル開発環境

```bash
# 開発サーバー起動（デフォルトはhttp://localhost:3000）
npm run dev

# 特定ポートで起動
npm run dev -- -p 4000
```

### テスト実行

```bash
# 全テスト実行
npm test

# 特定のテストを実行
npm test -- -t "component name"

# テストカバレッジレポート生成
npm test -- --coverage
```

### ビルド確認

```bash
# 本番ビルド
npm run build

# ビルドした結果を実行
npm start
```

### コード品質確認

```bash
# リントチェック
npm run lint

# 自動修正を含むリント
npm run lint:fix

# フォーマットチェック
npm run format:check

# フォーマット実行
npm run format

# すべてのチェックを実行
npm run check

# リントとフォーマットの自動修正
npm run fix
```

## 8. トラブルシューティング

### よくある問題と解決策

| 問題 | 解決策 |
|------|--------|
| 開発サーバー起動失敗 | ポートが使用中の場合は `-p` オプションで別ポートを指定 |
| 環境変数エラー | `.env.local` ファイルが存在し、必要な変数が設定されているか確認 |
| 認証エラー | `AUTH_SECRET` が設定されていること、認証プロバイダー設定を確認 |
| ビルドエラー | `npm run lint` を実行してコードエラーを修正 |
| パッケージエラー | `npm ci` で依存関係をクリーンインストール |
| Git hook実行エラー | 権限を確認: `chmod +x .husky/*` |
| ESLint/Prettierの競合 | `.eslintrc.js`と`.prettierrc.js`の設定を確認 |
| 型エラー | `node_modules`を削除して`npm install`を再実行 |

### サポートリソース

- GitHub Issue: https://github.com/tsunoshou/ai-start/issues
- プロジェクトWiki: https://github.com/tsunoshou/ai-start/wiki
- 技術ドキュメント: `/docs` ディレクトリ

---

このセットアップガイドは開発チームのための内部ドキュメントであり、プロジェクトの構成や開発方法に関する包括的な情報を提供します。不明点やエラーについてはIssueを作成し、チームで共有してください。 