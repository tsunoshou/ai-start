# AI-Start

Next.jsを使用した最新のAIアプリケーション開発スターターキット

## 機能

- 🚀 Next.js 14 & React 18
- 💾 Supabaseを使用したバックエンド統合
- 🔒 NextAuthによる認証
- 🌐 next-intlによる国際化
- 🧠 AIサービス統合
- 🎨 TailwindCSSによるスタイリング
- 📦 DrizzleORMによるデータアクセス
- ✅ TypeScriptによる型安全性
- 🧪 Jestによるテスト

## セットアップ

### 必要条件

- Node.js 20.x以上
- npm 10.x以上
- Git

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/tsunoshou/ai-start.git
cd ai-start

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# AI Services
OPENAI_API_KEY=your_openai_api_key
```

## 開発ワークフロー

このプロジェクトでは、以下の開発ワークフローを採用しています：

### コード品質

- ESLintとPrettierを使用してコード品質を維持
- Huskyとlint-stagedを使用してコミット前にコードチェックを実行
- `npm run lint`でリントチェック
- `npm run format`でコードフォーマット

### テスト

- Jestを使用したユニットテスト
- `npm test`でテストを実行

### ブランチとコミットの規約

- 新機能: `feature/機能名`
- バグ修正: `fix/問題名`
- リファクタリング: `refactor/対象名`

コミットメッセージは以下のプレフィックスを使用してください：

- `文書:` - ドキュメント更新
- `設定:` - 設定変更
- `機能:` - 機能追加
- `修正:` - バグ修正
- `リファクタ:` - リファクタリング
- `テスト:` - テスト追加/修正
- `スタイル:` - スタイル変更
- `依存関係:` - 依存関係更新
- `ビルド:` - ビルド関連の変更
- `その他:` - その他の変更

### CI/CD

- GitHub Actionsを使用した自動テストとデプロイ
- mainブランチへのプッシュで自動的にVercelにデプロイ

## プロジェクト構造

詳細なプロジェクト構造とアーキテクチャについては[ドキュメント](docs/README.md)を参照してください。

## ライセンス

ISC

## 貢献

プルリクエストは歓迎です。大きな変更を行う場合は、まずissueを開いて変更内容を議論してください。
