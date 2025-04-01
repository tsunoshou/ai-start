# データベース接続テスト - セットアップガイド

本プロジェクトでは、PostgreSQLデータベースとSupabaseを使用してデータを管理します。このガイドでは、ローカル開発環境でのデータベース接続テストのセットアップ方法を説明します。

## 前提条件

- Node.js v18.0.0以上（推奨：v23.7.0）
- npm v8.0.0以上（推奨：v10.9.2）
- Docker Desktop（Supabaseをローカルで実行する場合）

## セットアップ手順

### 1. 環境変数の設定

`.env.local`ファイルに以下の環境変数を設定します：

```bash
# データベース
DATABASE_URL="postgresql://postgres:password@localhost:54322/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"

# 認証
AUTH_SECRET="your-auth-secret-key"
AUTH_URL=http://localhost:3000
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. Supabaseローカル開発環境の起動（Docker必須）

```bash
npx supabase start
```

これにより、PostgreSQLデータベースやSupabase関連サービスがローカルで起動します。

### 4. マイグレーションの実行

```bash
npm run db:migrate
```

このコマンドは`db/migrations`ディレクトリ内のSQLファイルを実行し、データベーススキーマを作成します。

### 5. 接続テストの実行

```bash
npm run db:test
```

このスクリプトは以下を検証します：

- Drizzle ORMによるPostgreSQL直接接続
- Supabaseクライアントを通じた接続

## ディレクトリ構造

データベース関連のファイルは以下のディレクトリ構造に従って配置されています：

```
infrastructure/
  └── database/           # データベース関連のルートディレクトリ
      ├── client.ts       # PostgreSQL直接接続クライアント
      ├── client/         # データベースクライアント実装
      │   └── supabase.ts # Supabaseクライアント実装
      ├── migrations/     # マイグレーションファイル
      ├── schema/         # テーブルスキーマ定義
      │   ├── index.ts    # スキーマエクスポート
      │   └── users.ts    # ユーザーテーブル定義 (USERS, USER_ROLES)
      ├── types/          # データベース型定義
      │   └── supabase.ts # Supabase型定義
      └── utils/          # データベースユーティリティ
          └── test-db-connection.ts # 接続テストスクリプト
```

環境変数は以下のファイルで設定します：

- `.env.local` - ローカル開発環境用

## スキーマ定義

このセットアップでは以下のテーブルを定義しています：

1. **users** - ユーザー情報を格納

   - id: UUID（主キー）
   - email: メールアドレス（一意）
   - password_hash: パスワードハッシュ
   - display_name: 表示名
   - preferred_language: 優先言語
   - その他のプロファイル情報

2. **user_roles** - ユーザーのロールを管理
   - user_id: ユーザーID（外部キー）
   - role: ロール名
   - assigned_at: 割り当て日時

## 補足

- **Row Level Security (RLS)**: テーブルにはRLSポリシーが設定されており、ユーザーは自分のデータのみアクセス可能です
- **Drizzle ORM**: TypeScriptで型安全にデータベースを操作するためのORMを使用しています
- **マイグレーション**: SQLファイルベースのマイグレーションでスキーマを管理しています

## トラブルシューティング

接続テストが失敗する場合：

1. Docker Desktopが起動しているか確認してください
2. Supabaseが正常に起動しているか確認してください: `npx supabase status`
3. 環境変数が正しく設定されているか確認してください
4. データベースのポートが他のアプリケーションと競合していないか確認してください
