# 2. 移行計画書：現状からの段階的移行手順

## 🎯 目的

この文書は、既存の単一構造アプリケーションから、再利用可能なモジュール構造への移行プロセスを定義します。移行は段階的に行い、各フェーズでのリスクを最小化しながら進めます。

## 📊 現状分析

### 現在のディレクトリ構造

```
/
├── app/                     # Next.js アプリケーション
│   ├── api/                 # API Routes
│   ├── (auth)/              # 認証関連ページ
│   ├── (dashboard)/         # ダッシュボード関連ページ
│   └── ...                  # その他のページ
│
├── domain/                  # ドメイン層 (現状)
│   ├── models/              # エンティティ、値オブジェクト
│   │   └── user/
│   ├── repositories/        # リポジトリインターフェース
│   └── services/            # ドメインサービス
│
├── application/             # アプリケーション層 (現状)
│   ├── usecases/            # ユースケース
│   └── dtos/                # DTOs
│
├── infrastructure/          # インフラストラクチャ層 (現状)
│   ├── repositories/        # リポジトリ実装 (Drizzle)
│   ├── database/            # DB接続 (Drizzle), スキーマ
│   ├── auth/                # 認証 (Supabase)
│   ├── mappers/             # マッパー
│   └── ai/                  # AI関連
│
├── presentation/            # プレゼンテーション層 (現状、@core/uiへ移行対象)
│   ├── components/          # UIコンポーネント
│   ├── hooks/               # Reactフック
│   └── contexts/            # Reactコンテキスト
│
├── shared/                  # 共有ユーティリティ (現状、@core/sharedへ移行対象)
│   ├── types/               # 型定義
│   ├── utils/               # ユーティリティ関数
│   ├── enums/               # 列挙型
│   ├── errors/              # エラー定義
│   ├── value-objects/       # 値オブジェクト
│   └── constants/           # 定数
│
└── tests/                   # テスト (現状、各パッケージの__tests__へ移行対象)
    ├── unit/                # ユニットテスト
    ├── integration/         # 統合テスト
    └── e2e/                 # E2Eテスト
```

### 現状の課題

1. **ドメイン境界の不明確さ**
   - 複数のドメイン間で責任の境界が曖昧
   - ドメイン間の依存関係が複雑化

2. **再利用性の低さ**
   - 単一プロジェクト内でのコード整理を前提としているため、他プロジェクトでの再利用が困難
   - モジュール間の依存関係が緊密すぎる

3. **スケーリング時の開発効率低下**
   - プロジェクト規模の拡大に伴い、開発・テスト・デプロイの複雑性が増加
   - チーム間の並行開発が難しい

4. **コードの重複**
   - 類似機能が複数の場所に実装されることがある
   - 共通ロジックの抽出と共有が不十分

## 🗺️ 移行ロードマップ

### フェーズ0: 準備

1. **設計ドキュメントの最終化**
   - 理想的なアーキテクチャ設計（`01_ideal_design.md`）の確認と合意
   - 各ドメインの責任範囲と境界の明確化

2. **移行ブランチの作成**
   - 既存機能を維持したまま並行開発できる環境を準備
   - CI/CDパイプラインの調整

3. **テストカバレッジの確認**
   - 既存機能の正常動作を保証するテスト（Vitest, Playwright）の充実度確認
   - 必要に応じてテストの追加

### フェーズ1: モノレポ基本構造の構築

1. **モノレポツールの設定** (Turborepo または pnpm workspaces)
   - `turbo.json` または `pnpm-workspace.yaml` の作成
   - ビルド・テスト・リントのパイプライン設定

2. **基本ディレクトリ構造の作成**
   - `apps` と `packages` ディレクトリの作成
   - 共通の `tsconfig.base.json` の設定

3. **パッケージマネージャー設定**
   - `pnpm-workspace.yaml` の設定 (pnpmの場合)
   - ルート `package.json` でのワークスペース設定
   - 共通開発依存関係の設定

```sh
# 実行コマンド例 (pnpmの場合)
mkdir -p apps packages
touch pnpm-workspace.yaml tsconfig.base.json
# turbo.json は Turborepo 使用時に作成
```

### フェーズ2: 共有パッケージの作成と移行

1. **共通パッケージの作成**
   - `@core/shared` パッケージの作成と初期設定
   - `@core/infrastructure` パッケージの作成と初期設定
   - `@core/ui` パッケージの作成と初期設定

2. **共通コードの移行**
   - 共通型定義 (`shared/types` → `@core/shared/types`)
   - ユーティリティ関数 (`shared/utils` → `@core/shared/utils`)
   - エラー定義 (`shared/errors` → `@core/shared/errors`)
   - 共通値オブジェクト (`shared/value-objects` → `@core/shared/value-objects`)
   - UIコンポーネント (`presentation/components` → `@core/ui/components`)
   - DBクライアント (`infrastructure/database` → `@core/infrastructure/database`)
   - 認証サービス (`infrastructure/auth` → `@core/infrastructure/auth`)

3. **テストの移行**
   - 共有コードに対応する単体テストを各パッケージの `__tests__/unit` に移行
   - インフラ関連の統合テストを `@core/infrastructure/**/__tests__/integration` に移行

4. **パッケージ間の依存関係設定**
   - 各パッケージの `package.json` で適切な依存関係を設定
   - ビルドパイプラインの調整

### フェーズ3: ドメインパッケージの構築 (例: user)

1. **ユーザードメインパッケージの作成**
   - `@core/user` パッケージの作成
   - `domain`, `application`, `infrastructure` ディレクトリ構造の作成

2. **ユーザードメインコードの移行**
   - ドメイン層 (`domain/models/user`, `domain/repositories/user.repository.interface.ts` など → `@core/user/domain`)
   - アプリケーション層 (`application/usecases/user`, `application/dtos/user` → `@core/user/application`)
   - インフラストラクチャ層 (`infrastructure/repositories/user.repository.ts`, `infrastructure/mappers/user.mapper.ts` → `@core/user/infrastructure`)

3. **テストの移行**
   - ユーザードメインの単体テスト・統合テストを `@core/user/**/__tests__` に移行
   - テストファイル名を規約に沿って変更 (`*.unit.test.ts`, `*.integration.test.ts`)

4. **他のドメインへの展開**
   - 同様のアプローチで他のドメインパッケージを順次作成・移行
   - ドメイン間の依存関係を整理

### フェーズ4: アプリケーション構造の調整

1. **Next.js アプリの移動**
   - `app` ディレクトリ全体を `apps/saas-app` に移動
   - 関連する設定ファイル (`next.config.js`, `tailwind.config.js`, `.env*` など) を移動

2. **アプリケーションからのパッケージ依存設定**
   - `apps/saas-app/package.json` に `@core/*` パッケージへの依存関係を追加
   - アプリケーション内のインポートパスを新しいパッケージ名に修正 (`import ... from '@core/user/...'`)

3. **API Routes の調整**
   - ドメインパッケージのユースケースを使用するように API Routes をリファクタリング
   - 依存関係の注入方法の標準化 (tsyringe など)

4. **E2Eテストの移行と調整**
   - `tests/e2e` を `apps/saas-app/tests/e2e` に移動
   - E2Eテスト内のパスやセレクタを調整

### フェーズ5: 検証と調整

1. **ビルドテスト**
   - 全パッケージと全アプリのビルド実行 (`turbo run build` または `pnpm recursive run build`)
   - ビルドエラーの解消

2. **機能テスト**
   - 全単体テスト・統合テストの実行 (`turbo run test` または `pnpm recursive run test`)
   - E2Eテスト (`apps/saas-app` 内で `pnpm run test:e2e`) での動作確認

3. **パフォーマンス最適化**
   - ビルド時間の最適化 (Turborepoキャッシュ活用など)
   - バンドルサイズの確認と最適化

## 🔑 優先順位付けと成功基準

### 優先順位

1. **共有レイヤーの移行**: `@core/shared`, `@core/infrastructure`, `@core/ui`
2. **主要ドメインの移行**: 最初に `user` ドメインを移行
3. **アプリケーション層の調整**: Next.js アプリのリファクタリング
4. **残りのドメインの移行**: 他のドメインを順次移行

### 成功基準

1. **ビルド成功**: すべてのパッケージとアプリケーションが正常にビルドできる
2. **テスト合格**: すべての単体・統合・E2Eテストが合格
3. **機能維持**: 既存機能がすべて正常に動作する
4. **開発効率向上**: 追加機能の開発がモジュール単位で進められる

## 📚 参照

- 理想構成の詳細は[理想設計書](./01_ideal_design.md)を参照
- ドメイン実装の詳細は[ベースドメイン実装指示書](./03_base_domain_guide.md)と[Userドメイン実装指示書](./04_user_domain_guide.md)を参照
- 将来的な拡張計画は[将来展開計画書](./05_future_expansion_plan.md)を参照

## ⚠️ リスク管理

### 想定されるリスクと対策

1. **循環依存の発生**
   - **リスク**: パッケージ間で循環依存が発生する
   - **対策**: 依存関係を明示的に制限する仕組みを導入（例: dependency-cruiser, ESLintルール）

2. **テスト失敗**
   - **リスク**: 移行によりテストが失敗する
   - **対策**: 各フェーズで十分なテストを実施し、問題を早期発見。テストコードの移行と更新を丁寧に行う。

3. **移行時間の長期化**
   - **リスク**: 予想以上に移行に時間がかかる
   - **対策**: 小さな単位での移行を繰り返し、継続的に成果を得られるようにする。各フェーズの目標を明確にする。

4. **後方互換性の問題**
   - **リスク**: APIや型定義の変更により互換性が失われる
   - **対策**: 移行期間中は一時的に古いインターフェースも維持し、段階的に廃止。バージョン管理を適切に行う。 