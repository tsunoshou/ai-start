# 環境設定と運用ガイド

**最終更新日**: 2024-06-23

## 目次

1. [環境概要](#環境概要)
2. [環境変数設定](#環境変数設定)
3. [データベース環境](#データベース環境)
4. [環境ごとの設定方法](#環境ごとの設定方法)
5. [マイグレーション実行](#マイグレーション実行)
6. [Vercel環境設定](#vercel環境設定)
7. [トラブルシューティング](#トラブルシューティング)

## 環境概要

AiStartでは、以下の3つの環境を使用します：

| 環境名 | 対応するブランチ | 用途 | Vercel環境 |
|------|-------------|------|----------|
| 開発（Development） | development | 開発作業、テスト | Preview |
| ステージング（Staging） | release | 本番リリース前の検証 | Staging |
| 本番（Production） | main | エンドユーザー向けサービス | Production |

各環境は独立したデータベースを持ち、それぞれ適切な設定で運用されます。

## 環境変数設定

`.env.local`ファイル（ローカル開発用）には以下の環境変数を設定します：

```bash
# 基本設定
NODE_ENV=development       # 実行環境（development/test/production）
APP_ENV=development        # アプリケーション環境（development/staging/production）
NEXT_PUBLIC_APP_URL=http://localhost:3000  # アプリケーションのURL

# データベース接続設定 - 現在の環境
DATABASE_URL=postgres://username:password@localhost:5432/ai-start-dev

# 環境別データベース設定（migrate:allコマンドで使用）
DATABASE_URL_DEVELOPMENT=postgres://username:password@localhost:5432/ai-start-dev
DATABASE_URL_STAGING=postgres://username:password@localhost:5432/ai-start-staging
DATABASE_URL_PRODUCTION=postgres://username:password@localhost:5432/ai-start

# Supabase設定 - 現在の環境
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 環境別Supabase設定（オプション）
# NEXT_PUBLIC_SUPABASE_URL_DEVELOPMENT=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY_DEVELOPMENT=your-dev-anon-key
# SUPABASE_SERVICE_ROLE_KEY_DEVELOPMENT=your-dev-service-role-key
# ...同様にSTAGINGとPRODUCTIONの設定

# 認証設定
AUTH_SECRET=your-auth-secret
AUTH_URL=http://localhost:3000

# 国際化設定
DEFAULT_LOCALE=ja
SUPPORTED_LOCALES=ja,en

# AI設定（省略可能）
# OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
# GEMINI_API_KEY=your-gemini-api-key

# ログ設定
LOG_LEVEL=info  # debug, info, warn, error
```

## データベース環境

各環境には独立したデータベースを使用します：

1. **開発環境（development）**: 
   - DB名: `ai-start-dev`
   - 開発作業時に使用
   - 頻繁な変更が発生する環境

2. **ステージング環境（staging）**: 
   - DB名: `ai-start-staging`
   - リリース前の検証に使用
   - 本番環境と同等のデータ構造を持つ

3. **本番環境（production）**: 
   - DB名: `ai-start`
   - 実サービスで使用
   - 安定性と整合性が重要

## 環境ごとの設定方法

### ローカル開発環境

ローカル開発では、`.env.local`ファイルを使用して環境変数を設定します。

```bash
# 開発環境用の設定
APP_ENV=development
DATABASE_URL=postgres://username:password@localhost:5432/ai-start-dev
```

### 環境変数の切り替え

特定の環境の設定を一時的に使用したい場合は、以下のように環境変数を上書きします：

```bash
# ステージング環境の設定を使用する例
APP_ENV=staging npm run dev
```

## マイグレーション実行

データベースマイグレーションは各環境ごとに実行できます：

```bash
# 開発環境のマイグレーション
npm run db:migrate:dev

# ステージング環境のマイグレーション
npm run db:migrate:staging

# 本番環境のマイグレーション
npm run db:migrate:prod

# すべての環境に対してマイグレーションを実行（.env.localに全環境のDBURLが設定されている場合）
npm run db:migrate:all
```

## Vercel環境設定

Vercelでのデプロイでは、以下のように環境変数を設定します：

1. **Preview環境（development）**:
   - Gitブランチ: `development`
   - 環境変数: `APP_ENV=development`, `DATABASE_URL=<開発用DB>`

2. **Staging環境**:
   - Gitブランチ: `release`
   - 環境変数: `APP_ENV=staging`, `DATABASE_URL=<ステージング用DB>`

3. **Production環境**:
   - Gitブランチ: `main`
   - 環境変数: `APP_ENV=production`, `DATABASE_URL=<本番用DB>`

### Vercel環境変数の設定方法

1. Vercelダッシュボードにログイン
2. プロジェクトを選択
3. 「Settings」→「Environment Variables」を選択
4. 環境変数を追加し、適用する環境（Production/Preview/Development）を選択

## トラブルシューティング

### データベース接続エラー

環境変数が正しく設定されていない場合、以下のエラーが発生することがあります：

```
データベース接続文字列を取得できませんでした。環境変数の設定を確認してください。
```

**解決策**:
1. `.env.local`ファイルに`DATABASE_URL`が正しく設定されているか確認
2. 現在の`APP_ENV`と対応するデータベースURLが設定されているか確認
3. データベースサーバーが起動しているか確認

### マイグレーションエラー

```
マイグレーション中にエラーが発生しました
```

**解決策**:
1. データベース接続情報が正しいか確認
2. データベースユーザーが適切な権限を持っているか確認
3. マイグレーションファイルに構文エラーがないか確認

### 環境ごとの設定が反映されない

```
Warning: 環境設定が正しく読み込まれていません
```

**解決策**:
1. `APP_ENV`環境変数が正しく設定されているか確認
2. アプリケーションを再起動して環境変数の変更を反映
3. `config/environment.ts`が正しく実装されているか確認 