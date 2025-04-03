# デプロイ周りの実装

最終更新日: 2024-07-27

このドキュメントは、AiStartプロジェクトのデプロイ戦略、CI/CDパイプライン、インフラ構成、監視、セキュリティ対策など、デプロイメントに関連する実装詳細を定義します。

## 環境定義

### 環境種別

AiStartプロジェクトでは、以下の環境を定義・運用します。

1.  **Production (本番環境)**:
    *   **目的**: エンドユーザー向けの安定版を提供。
    *   **トリガー**: `main` ブランチへのマージ。
    *   **ホスティング**: Vercel Production 環境。
    *   **ドメイン**: `ai-start.net`, `www.ai-start.net`
    *   **バックエンド**: Supabase プロジェクト `ai_start_prod`

2.  **staging (ステージング環境)**:
    *   **目的**: 本番リリース前の最終確認、リハーサル。本番に近い環境での動作検証。
    *   **トリガー**: `release/*` ブランチへのプッシュまたはマージ。
    *   **ホスティング**: Vercel staging 環境 (カスタムドメイン適用)。
    *   **ドメイン**: `staging.ai-start.net`
    *   **バックエンド**: Supabase プロジェクト `ai_start_staging`

3.  **Preview (プレビュー/開発環境)**:
    *   **目的**: 機能開発中の動作確認、プルリクエストレビュー。
    *   **トリガー**: `development` ブランチへのマージ、または任意のフィーチャーブランチからのプルリクエスト作成/更新。
    *   **ホスティング**: Vercel Preview 環境。
    *   **ドメイン**:
        *   `development` ブランチ: `dev.ai-start.net` (カスタムドメイン)
        *   その他フィーチャーブランチ: Vercel が自動生成する一意の URL (`*-<repo>-<hash>.vercel.app`)
    *   **バックエンド**: Supabase プロジェクト `ai_start_dev`

4.  **Local (ローカル開発環境)**:
    *   **目的**: 開発者個人のマシンでの開発・テスト。
    *   **ホスティング**: 開発者マシン (`localhost`)。
    *   **バックエンド**: ローカル Supabase 環境 (Supabase CLI で管理) または共有の開発用 Supabase プロジェクト (`ai_start_dev`)。

### 環境変数管理

環境変数は、セキュリティと管理の容易性を考慮し、以下の方法で管理します。

-   **Vercel 環境変数**:
    *   Production, staging, Preview の各 Vercel 環境に対応する環境変数を Vercel ダッシュボードで設定します。
    *   Supabase 接続情報 (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)、認証関連のシークレット (`AUTH_SECRET` など)、外部サービスAPIキーなどが対象です。
    *   **注意**: `NEXT_PUBLIC_` プレフィックスが付いた変数はクライアントサイドに公開されるため、機密情報を含めないでください。
-   **GitHub Environments Secrets**:
    *   CI/CD パイプライン (GitHub Actions) で使用する機密情報（例: DB マイグレーション用 `DATABASE_URL`）は、GitHub の Environments 機能を利用して環境ごとに設定・管理します。
    *   Environment 名 (例: `Production`, `staging`, `Preview`) は Vercel 環境および対応ブランチ (`main`, `release/*`, `development`) と連動させます。
-   **`.env.local`**:
    *   ローカル開発環境でのみ使用する環境変数を定義します。
    *   ローカル Supabase プロジェクトの接続情報などが含まれます。
    *   このファイルは `.gitignore` に追加し、リポジトリにはコミットしません。
-   **`.env.example`**:
    *   プロジェクトで必要となる環境変数のリストと形式を示すためのサンプルファイルです。実際の値は含めません。

### 環境間の違い

| 項目                 | Production (`main`)                 | staging (`release/*`)             | Preview (`development`, etc.)     | Local                      |
| :------------------- | :---------------------------------- | :-------------------------------- | :-------------------------------- | :------------------------- |
| **目的**             | 安定版提供                          | リリース前最終確認                | 開発・レビュー                    | ローカル開発               |
| **ホスティング**     | Vercel Production                   | Vercel staging 環境 (カスタムドメイン適用) | Vercel Preview                    | localhost                  |
| **ドメイン**         | `ai-start.net`, `www`             | `staging.ai-start.net`          | `dev.ai-start.net`, 自動生成URL | localhost                  |
| **Supabase Project** | `ai_start_prod`                     | `ai_start_staging`                | `ai_start_dev`                    | ローカル or `ai_start_dev` |
| **データ**           | 本番データ                          | ステージング用データ (本番コピー推奨) | テスト/開発データ                 | テスト/開発データ          |
| **デバッグモード**   | 無効                                | 有効 (制限付き)                   | 有効                              | 有効                       |
| **監視レベル**       | 高                                  | 中                                | 低                                | なし                       |
| **DB マイグレーション** | GitHub Actions (要承認の場合あり) | GitHub Actions (自動)             | GitHub Actions (自動)             | 手動 (`npm run db:migrate`) |

## CI/CDパイプライン

### CIツール選定

-   **GitHub Actions**: プロジェクトの CI/CD パイプラインを構築・実行するための主要ツールとして採用します。
    -   **理由**: GitHub リポジトリとの親和性が非常に高く、設定が容易。豊富な Marketplace アクションを利用可能。Vercel との連携もスムーズ。無料で利用できる枠が大きい。

### ビルドプロセス

1.  **ソースコードのチェックアウト**: GitHub Actions ワークフローがトリガーされると、対象ブランチの最新コードをチェックアウトします。
2.  **Node.js 環境セットアップ**: プロジェクトで指定された Node.js バージョン (v23.7.0) をセットアップします。
3.  **依存関係インストール**: `npm ci` を実行し、`package-lock.json` に基づいて依存パッケージを正確にインストールします。
4.  **コード品質チェック**:
    *   ESLint (`npm run lint`) による静的コード解析を実行します。
    *   Prettier (`npm run format:check`) によるコードフォーマットチェックを実行します。
5.  **テスト実行**:
    *   Vitest (`npm run test`) によるユニットテスト・統合テストを実行します。
    *   Playwright (`npm run test:e2e`) による E2E テストを実行します（特定のブランチや Pull Request で実行）。
    *   テストカバレッジレポートを生成し、指定された閾値 ([09_testing_implementation.md](/docs/restructuring/09_testing_implementation.md) 参照) を満たしているかチェックします。
6.  **ビルド**: `npm run build` を実行し、Next.js アプリケーションのプロダクションビルドを生成します。
7.  **Vercel へのデプロイ (Vercel GitHub Integration)**:
    *   ビルドが成功すると、Vercel の GitHub Integration により自動的にデプロイプロセスが開始されます。
    *   Vercel はビルド成果物をアップロードし、適切な環境 (Production, staging, Preview) にデプロイします。

### デプロイフロー

1.  **開発**: 開発者はフィーチャーブランチで作業し、ローカル環境でテストを行います。
2.  **Pull Request (Feature -> Development)**: 開発が完了したら、`development` ブランチへの Pull Request を作成します。
3.  **自動チェック (CI) & Preview デプロイ**: Pull Request が作成/更新されると、GitHub Actions がトリガーされ、コード品質チェックとテスト (ユニット/統合) が実行されます。E2E テストも実行される場合があります。Vercel による Preview 環境への自動デプロイも行われます。
4.  **レビュー**: コードレビューと Preview 環境での動作確認が行われます。
5.  **マージ (Feature -> Development) & Development デプロイ**: レビューが承認されると、フィーチャーブランチが `development` ブランチにマージされます。これにより、`dev.ai-start.net` にデプロイされます。
6.  **リリース準備 (Development -> `release/*`)**: リリース準備が整ったら、`development` ブランチから `release/*` ブランチを作成します。
7.  **ステージングデプロイ**: `release/*` ブランチがプッシュされると、GitHub Actions と Vercel により staging 環境 (`staging.ai-start.net`) に自動デプロイされます。
8.  **ステージングテスト**: staging 環境で最終的な受け入れテストやリハーサルが行われます。必要に応じて `release/*` ブランチで修正を行います。
9.  **本番リリース (Pull Request: `release/*` -> `main`)**: ステージングでの検証が完了したら、`release/*` ブランチを `main` ブランチにマージします (Pull Request 経由推奨)。
10. **本番デプロイ**: `main` ブランチへのマージにより、GitHub Actions と Vercel によって Production 環境 (`ai-start.net`) に自動デプロイされます。
11. **本番内容の開発ブランチへの同期 (Pull Request: `main` -> `development`)**: 本番デプロイが成功した後、`main` ブランチから `development` ブランチへの Pull Request を作成し、レビュー・承認を経てマージします。これにより、`development` ブランチが最新の本番コードを含む状態になります。
12. **DB マイグレーション**:
    *   マイグレーションファイル (`/infrastructure/database/migrations/`) が変更された状態で特定のブランチ (`development`, `release/*`, `main`) にプッシュされると、専用の GitHub Actions ワークフロー (`database-migration.yml`) がトリガーされます。
    *   このワークフローは、対応する環境 (Preview, staging, Production) のデータベースに対して `npm run db:migrate` を実行します。
    *   本番環境へのマイグレーションは、安全のため手動承認ステップを挟むことを検討します。

## インフラ構成

### インフラ設計

AiStart は主に以下の PaaS/SaaS を組み合わせたサーバーレスアーキテクチャを採用しています。

-   **Vercel**:
    *   **役割**: フロントエンド (Next.js) のホスティング、ビルド、デプロイ、CDN、Serverless Functions (API Routes) 実行環境。
    *   **利点**: Next.js との親和性が非常に高く、開発体験が良い。スケーラブルで運用負荷が低い。
-   **Supabase**:
    *   **役割**: バックエンドサービスを提供。
        *   **Database**: PostgreSQL データベース。
        *   **Auth**: ユーザー認証・認可。
        *   **Storage**: ファイルストレージ。
        *   **Edge Functions**: (必要に応じて) サーバーレス関数実行環境。
    *   **利点**: PostgreSQL を中心とした統合的なバックエンド機能を提供。スケーラブルで、RLS によるセキュリティ制御が容易。
-   **GitHub**:
    *   **役割**: ソースコード管理、CI/CD パイプライン実行 (GitHub Actions)。
-   **お名前.com**:
    *   **役割**: ドメイン (`ai-start.net`) の登録・管理。DNS レコード設定。

### コンテナ化

-   現時点ではアプリケーション全体のコンテナ化は行っていません。Vercel と Supabase の PaaS/SaaS を活用することで、インフラ管理の複雑性を低減しています。
-   ただし、[09_testing_implementation.md](/docs/restructuring/09_testing_implementation.md) で言及されているように、データベースの統合テストにおいては **Testcontainers** を使用して PostgreSQL の Docker コンテナを一時的に起動・利用することを推奨しています。

### サーバーレス

-   Next.js の API Routes は Vercel の **Serverless Functions** としてデプロイ・実行されます。
-   Supabase の認証機能やデータベースアクセスもサーバーレスアーキテクチャに基づいており、スケーラビリティに優れています。
-   必要に応じて Supabase **Edge Functions** を活用することも検討します。

## デプロイ戦略

### リリース戦略

-   **Immutable Deployments**: Vercel の標準的なデプロイ方式です。デプロイごとに新しい不変のインスタンスが作成され、トラフィックが即座に切り替えられます。
-   **Preview Deployments**: フィーチャーブランチや Pull Request ごとに独立したプレビュー環境を自動生成し、開発中の機能を安全に確認・レビューできます。
-   **staging Environment**: `release/*` ブランチを使用して、本番環境に近いステージング環境でリリース前の最終検証を行います。
-   **Canary Releases / Blue/Green Deployments**: 現時点では Vercel の標準機能のみを利用していますが、将来的にトラフィックを段階的に移行する高度なリリース戦略が必要になった場合は、Vercel の機能 (例: Incremental Static Regeneration の活用、外部ツール連携) やカスタム実装を検討します。

### ロールバック手順

-   **Vercel Instant Rollback**: Vercel ダッシュボードから、過去の正常なデプロイメントに即座にロールバックすることが可能です。問題発生時には迅速に対応できます。
-   **DB ロールバック**: DB マイグレーションに問題があった場合は、`node-pg-migrate` の `down` コマンドを使用してマイグレーションをロールバックする必要があります。これは手動での対応が必要です。ロールバック手順を事前に確立しておくことが重要です。

### リリース頻度

-   **継続的デプロイメント**: `development`, `release/*`, `main` の各ブランチへのマージをトリガーとして、対応する環境へ自動的にデプロイが行われます。
-   **本番リリース**: `main` ブランチへのマージによって行われます。リリース頻度はビジネス要件や開発サイクルに応じて柔軟に決定しますが、小さな変更を頻繁にリリースすることを目指します (例: 1〜2週間に1回)。

## 監視・アラート

### 監視ツール

-   **Vercel Analytics**: フロントエンドのパフォーマンス（Web Vitals）、トラフィック、訪問者に関するインサイトを提供します。リアルユーザーモニタリング (RUM)。
-   **Vercel Monitoring**: Serverless Functions の実行時間、エラーレート、ログなどを監視します。
-   **Supabase Monitoring**: データベースのパフォーマンス（クエリ実行時間、インデックス使用状況）、APIリクエスト数、Authイベントなどを Supabase ダッシュボードで確認できます。
-   **Sentry (検討)**: アプリケーションのエラー監視とレポートに特化したツール。Vercel との連携が可能で、より詳細なエラー分析が必要な場合に導入を検討します。

### メトリクス

-   **Vercel**:
    *   Web Vitals (LCP, FID, CLS)
    *   ページビュー数、訪問者数
    *   Serverless Function の実行回数、実行時間、エラーレート、メモリ使用量
    *   キャッシュヒット率 (Edge Caching)
-   **Supabase**:
    *   DB CPU 使用率、メモリ使用率、ディスクI/O
    *   DB コネクション数
    *   低速クエリ、クエリ実行時間
    *   API リクエスト数、エラーレート (PostgREST)
    *   Auth 関連イベント (ログイン成功/失敗など)
-   **アプリケーション**:
    *   特定機能のエラーレート
    *   ビジネスKPI

### アラート設定

-   **Vercel**: 特定のエラーレート閾値超過やデプロイ失敗時に通知を設定可能 (連携サービス経由推奨)。
-   **Supabase**: 特定のメトリクス閾値超過やイベント発生時にアラートを設定可能 (例: 高CPU使用率、Authエラー増加)。通知は Email や Webhook (Slack など) に設定します。
-   **外部ツール (Sentryなど)**: エラー発生時にリアルタイムで通知を受け取るように設定します (Slack, Email など)。

## ロギング

### ログ収集

-   **Vercel Runtime Logs**: Serverless Functions (API Routes) や Edge Functions の `console.log` などの出力は Vercel ダッシュボードでリアルタイムに確認できます。
-   **Supabase Logs**:
    *   PostgREST Logs: API (データベースアクセス) のリクエストログ。
    *   Auth Logs: 認証関連イベントのログ。
    *   Database Logs: (設定により) PostgreSQL のログ。
    *   Supabase ダッシュボードで確認できます。
-   **クライアントサイドログ**: 必要に応じて、フロントエンドのエラーやイベントを Sentry などの外部サービスに送信します。

### ログ分析

-   **Vercel ダッシュボード**: ランタイムログの検索、フィルタリング。
-   **Supabase ダッシュボード**: 各種ログの検索、フィルタリング。
-   **外部ログ管理ツール (検討)**: 大量のログを効率的に分析・検索するために、Datadog Logs, Logtail (Better Stack) などの外部サービスとの連携を将来的に検討します。

### ログ保持ポリシー

-   **Vercel**: プランによって保持期間が異なります (無料プランは限定的)。
-   **Supabase**: プランによって保持期間が異なります。
-   長期保持が必要な場合やコンプライアンス要件がある場合は、外部ログ管理ツールへの転送と、そのツールでの保持ポリシー設定が必要です。

## バックアップと障害対応

### バックアップ戦略

-   **Supabase 自動バックアップ**: Supabase は通常、データベースの定期的な自動バックアップ (Point-in-Time Recovery (PITR) を含むことが多い) を提供します。プラン詳細を確認し、要件を満たしているか確認します。
-   **手動バックアップ**: 必要に応じて、`pg_dump` などを使用して手動でデータベースのバックアップを取得します。特に大きな変更前などに実施を検討します。
-   **Storage バックアップ**: Supabase Storage に保存されたファイルについても、必要に応じてバックアップ戦略を検討します (例: 定期的なファイル同期)。

### 災害復旧計画 (DRP)

-   **リージョン冗長性**: Supabase, Vercel ともに複数のアベイラビリティゾーン (AZ) やリージョンを利用してサービスを提供しており、単一障害点のリスクを低減しています。各サービスのドキュメントで詳細を確認します。
-   **復旧目標**: RPO (Recovery Point Objective) と RTO (Recovery Time Objective) を定義し、Supabase の PITR 機能などが目標を満たすか評価します。

### インシデント対応

1.  **検知**: 監視ツールからのアラート、ユーザーからの報告、ヘルスチェックの失敗などでインシデントを検知します。
2.  **影響評価**: インシデントの影響範囲と緊急度を評価します。
3.  **通知・連絡**: 関係者 (開発チーム、運用チーム、必要に応じてユーザー) にインシデント発生と状況を通知します。
4.  **原因調査**: ログ、メトリクス、トレースなどを分析し、インシデントの根本原因を特定します。
5.  **復旧対応**:
    *   **Vercel**: 必要に応じて Instant Rollback を実行。
    *   **Supabase**: データベースのリストア、設定変更、クエリ修正など。
    *   **コード修正**: アプリケーションコードに問題がある場合は、修正版を迅速にデプロイします。
6.  **事後レビュー (Postmortem)**: インシデント収束後、原因、対応プロセス、再発防止策をまとめたレビューを実施し、改善につなげます。
7.  **ステータスページ**: Vercel, Supabase の公式ステータスページを確認し、プラットフォーム側の障害情報を把握します。

## セキュリティ対策

### WAF設定

-   **Vercel Firewall**: Vercel の Pro/Enterprise プランで利用可能な Web Application Firewall 機能。IP ブロッキング、レート制限、マネージドルールセット (OWASP Top 10 対策など) の設定が可能です。必要に応じて導入を検討します。
-   **Supabase**: ネットワーク制限 (特定のIPアドレスからのアクセスのみ許可) などの機能を提供しています。

### レート制限

-   **Next.js API Routes**: `rate-limiter-flexible` などのライブラリを使用して、特定の API エンドポイントに対するレート制限を実装します。
-   **Vercel Firewall**: WAF 機能の一部としてレート制限を設定可能です。
-   **Supabase**: (設定により) API Gateway レベルでのレート制限。

### セキュリティ監視

-   **Vercel Audit Logs**: Vercel ダッシュボードでの操作ログを確認できます。
-   **Supabase Audit Logs**: プロジェクト設定変更などの監査ログを確認できます。
-   **GitHub Actions**:
    *   `npm audit`: 依存関係の脆弱性スキャンを CI で実行します。
    *   **Snyk / Dependabot**: より高度な脆弱性スキャンと自動修正 Pull Request 作成のために導入を検討します。
-   **コードレビュー**: セキュリティ観点でのコードレビューを徹底します (例: SQL インジェクション対策、XSS 対策、認可チェック漏れ)。
-   **RLS (Row Level Security)**: Supabase の RLS ポリシーを適切に設定し、データアクセス制御をデータベースレベルで強制します ([04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) 参照)。

## スケーリング

### オートスケーリング

-   **Vercel Serverless Functions**: リクエスト数に応じて自動的にスケールアウト/スケールインします。インフラ管理は不要です。
-   **Supabase**: トラフィックに応じてデータベースや認証サービスが自動的にスケールします (プランによる制限あり)。必要に応じてプランのアップグレードや、リードレプリカの追加などを検討します。

### パフォーマンスチューニング

-   **フロントエンド**:
    *   **Vercel Analytics**: Web Vitals を監視し、ボトルネックを特定します。
    *   **Next.js Bundle Analyzer**: バンドルサイズを分析し、不要なコードの削除やコード分割を最適化します。
    *   **画像最適化**: Next.js の `<Image>` コンポーネントを活用します。
    *   **キャッシュ**: Vercel Edge Caching, TanStack Query のキャッシュを活用します。
-   **バックエンド**:
    *   **Supabase**: 低速クエリログを確認し、インデックスの追加やクエリの最適化を行います。
    *   **API**: API レスポンスサイズの最適化、不要なデータ取得の削減。

### コスト最適化

-   **Vercel**: 使用状況 (関数実行時間、帯域幅など) を監視し、プランが適切か評価します。不要な Preview 環境の削除。
-   **Supabase**: データベースやストレージの使用状況を監視し、プランが適切か評価します。未使用のインデックスやデータの削除。
-   **効率的なコーディング**: 無駄なコンピューティングリソース消費を避けるように実装します (例: 不要なループ、重い処理の非同期化)。

## ドキュメント

### インフラドキュメント

-   このドキュメント (`10_deployment_implementation.md`) が主要なインフラ関連ドキュメントとなります。
-   Vercel, Supabase の設定画面や GitHub Actions ワークフローファイルも参照情報となります。
-   変更履歴は Git で管理します。

### 運用マニュアル

-   現時点では作成していませんが、プロジェクトの規模拡大や運用体制の変化に応じて、以下の内容を含む運用マニュアルの作成を検討します。
    *   定常的な運用タスク (監視確認、バックアップ確認など)
    *   緊急時の対応手順 (インシデント対応フロー)
    *   リリース手順の詳細
    *   環境変数管理手順

### トラブルシューティングガイド

-   開発・運用中に発生した問題とその解決策を記録し、トラブルシューティングガイドとして蓄積していくことを推奨します (例: Wiki, ドキュメントファイル)。
    *   よくあるエラーとその原因・対処法
    *   デバッグ方法
    *   過去のインシデントとその対応記録 