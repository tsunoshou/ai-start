# 5. 将来展開計画書：CLI化・ライブラリ化戦略

## 🎯 目的

この文書は、Core SaaS Frameworkの長期的な拡張戦略と将来の発展方向を記述します。特に、フレームワークのCLI化とライブラリ化を通じて、再利用性と拡張性を高めるための計画を詳述します。

## 📋 将来ビジョン

Core SaaS Frameworkは、単なるテンプレートから「製品」へと進化させることを目指します：

1. **統合フレームワーク**: 標準的なSaaSアプリケーション構築に必要なすべての機能を提供
2. **オープンソース化**: コミュニティ主導の継続的改善とエコシステム形成
3. **プラグイン対応**: 拡張可能なアーキテクチャによる機能拡張
4. **自動化ツール**: 開発効率を高めるCLIツールの提供
5. **複数環境対応**: 多様なクラウド環境とデータベースへの対応

## 📦 パッケージ構成の将来像

```
@core/
├── cli/                   # CLIツール
├── create-core-app/       # プロジェクト初期化パッケージ
├── shared/                # 共通基盤ライブラリ
├── infrastructure/        # インフラストラクチャライブラリ
├── user/                  # ユーザー管理ドメインライブラリ
├── billing/               # 課金管理ドメインライブラリ
├── analytics/             # 分析ドメインライブラリ
├── templates/             # 各種テンプレート
│   ├── next-app/          # Nextベースアプリ
│   ├── express-api/       # Express APIサーバー
│   └── admin-dashboard/   # 管理画面
└── docs/                  # ドキュメント
```

## 🛠️ CLI化計画

### CLI ツールの機能

1. **プロジェクト生成**:
   ```bash
   # 新規プロジェクト作成
   npx create-core-app my-saas-app
   
   # テンプレート指定
   npx create-core-app my-saas-app --template full-stack
   
   # 特定ドメインのみ選択
   npx create-core-app my-saas-app --domains user,billing
   ```

2. **コード生成**:
   ```bash
   # 新規ドメイン生成
   core generate domain product
   
   # 値オブジェクト生成
   core generate value-object product-name --domain product
   
   # エンティティ生成
   core generate entity product --domain product
   
   # ユースケース生成
   core generate use-case create-product --domain product
   ```

3. **マイグレーション管理**:
   ```bash
   # マイグレーション生成
   core db:migrate:generate create-products
   
   # マイグレーション実行
   core db:migrate:latest
   
   # マイグレーションロールバック
   core db:migrate:rollback
   ```

4. **テスト補助**:
   ```bash
   # 単体テスト実行
   core test:unit --domain product
   
   # E2Eテスト実行
   core test:e2e --feature product-creation
   
   # テスト環境セットアップ
   core test:setup
   ```

5. **デプロイメント**:
   ```bash
   # デプロイ準備
   core deploy:prepare --env production
   
   # 環境変数検証
   core deploy:validate-env --env production
   ```

### CLI 実装計画

```typescript
// @core/cli/src/commands/generate.ts
import { Command } from 'commander';
import { generateDomain } from '../generators/domain-generator';
import { generateEntity } from '../generators/entity-generator';
import { generateValueObject } from '../generators/value-object-generator';
import { generateUseCase } from '../generators/use-case-generator';

export function registerGenerateCommands(program: Command): void {
  const generate = program.command('generate')
    .description('各種コード生成コマンド');
  
  generate
    .command('domain <name>')
    .description('新規ドメインを生成')
    .option('-d, --description <description>', 'ドメインの説明')
    .action((name, options) => {
      generateDomain(name, options);
    });
  
  generate
    .command('entity <name>')
    .description('新規エンティティを生成')
    .option('-d, --domain <domain>', 'ターゲットドメイン', 'default')
    .option('-p, --props <props>', 'プロパティ定義（カンマ区切り）')
    .action((name, options) => {
      generateEntity(name, options);
    });
  
  // Value Objectコマンド
  generate
    .command('value-object <name>')
    .description('新規値オブジェクトを生成')
    .option('-d, --domain <domain>', 'ターゲットドメイン', 'default')
    .option('-p, --props <props>', 'プロパティ定義（カンマ区切り）')
    .option('-v, --validation', '検証ルールを追加')
    .action((name, options) => {
      generateValueObject(name, options);
    });
  
  // ユースケースコマンド
  generate
    .command('use-case <name>')
    .description('新規ユースケースを生成')
    .option('-d, --domain <domain>', 'ターゲットドメイン', 'default')
    .option('-e, --entity <entity>', '関連エンティティ')
    .option('-i, --input <input>', '入力DTO名')
    .option('-o, --output <output>', '出力DTO名')
    .action((name, options) => {
      generateUseCase(name, options);
    });
}
```

## 📚 ライブラリ化計画

### 共通基盤ライブラリ化

1. **ドメイン層パッケージ**:
   ```typescript
   // @core/shared/base/index.ts
   export * from './entity';
   export * from './value-object';
   export * from './aggregate-root';
   export * from './repository';
   export * from './use-case';
   export * from './domain-event';
   export * from './unique-entity-id';
   ```

2. **汎用ユーティリティパッケージ**:
   ```typescript
   // @core/shared/utils/index.ts
   export * from './date-utils';
   export * from './string-utils';
   export * from './validation-utils';
   export * from './random-utils';
   export * from './object-utils';
   ```

3. **共通値オブジェクトパッケージ**:
   ```typescript
   // @core/shared/value-objects/index.ts
   export * from './email';
   export * from './password';
   export * from './phone-number';
   export * from './money';
   export * from './address';
   export * from './date-range';
   ```

4. **結果型・エラー処理パッケージ**:
   ```typescript
   // @core/shared/result/index.ts
   export * from './result';
   export * from './error-types';
   export * from './app-error';
   export * from './guard';
   ```

### ドメイン別ライブラリ化

1. **ユーザー管理ライブラリ**:
   ```typescript
   // @core/user/index.ts
   // ドメイン層のエクスポート
   export * from './src/domain/entities';
   export * from './src/domain/value-objects';
   export * from './src/domain/repositories';
   export * from './src/domain/events';
   
   // ユースケースのエクスポート
   export * from './src/application/use-cases';
   export * from './src/application/dtos';
   
   // 実装のエクスポート（オプショナル）
   export * from './src/infrastructure/repositories';
   export * from './src/infrastructure/auth';
   
   // フロントエンド用フックのエクスポート
   export * from './src/presentation/hooks';
   ```

2. **課金管理ライブラリ**:
   ```typescript
   // @core/billing/index.ts
   export * from './src/domain/entities';
   export * from './src/domain/value-objects';
   export * from './src/domain/repositories';
   export * from './src/domain/services';
   
   export * from './src/application/use-cases';
   export * from './src/application/dtos';
   
   export * from './src/infrastructure/payment-providers';
   export * from './src/infrastructure/repositories';
   
   export * from './src/presentation/hooks';
   ```

### パッケージ公開戦略

```json
// @core/shared/package.json
{
  "name": "@core/shared",
  "version": "0.1.0",
  "description": "Core SaaS Frameworkの共通基盤ライブラリ",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "LICENSE",
    "README.md"
  ],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts",
    "lint": "eslint \"src/**/*.ts\"",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "publishConfig": {
    "access": "public"
  },
  "keywords": [
    "core",
    "saas",
    "framework",
    "ddd",
    "typescript"
  ],
  "author": "Core SaaS Framework Team",
  "license": "MIT",
  "dependencies": {
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    // 開発依存関係
  }
}
```

## 🔄 移行戦略

現状のモノリシックなコードベースからモジュール化されたライブラリへの移行は、以下の段階で進めます：

### 段階1: 内部モジュール化
1. モノリシックコードベース内で、論理的なモジュール境界を設定
2. `src/modules/` ディレクトリ内で各ドメインを分離
3. 内部APIを定義し、モジュール間の依存関係を明確化

### 段階2: ローカルパッケージ化
1. モノレポ構造（NXまたはTurborepo）に移行
2. 各ドメインを個別のローカルパッケージとして分離
3. 共通基盤コードを`@core/shared`として抽出

### 段階3: パブリックパッケージ化
1. 各パッケージの品質保証（テスト、ドキュメント、APIの安定化）
2. npmレジストリへの公開準備
3. 段階的なパッケージのリリース

### 段階4: フィードバックと改善
1. コミュニティフィードバックの収集
2. ドキュメントとサンプルの充実
3. バージョン管理ポリシーの確立と実装

## 🌐 エコシステム形成計画

### テンプレートライブラリ

1. **スターターテンプレート**：
   - フルスタックSaaSスターター（Next.js + Express）
   - APIサーバースターター（Express）
   - 管理画面スターター（React-Admin）

2. **カスタムテンプレート**：
   ```bash
   # テンプレートから生成
   npx create-core-app my-app --template custom-template-url
   
   # 既存プロジェクトをテンプレート化
   core template:create --from ./my-project --name my-custom-template
   ```

### プラグインエコシステム

1. **プラグイン開発**：
   ```typescript
   // @core/plugin-shopify/src/index.ts
   import { CorePlugin } from '@core/shared/plugin';
   
   export class ShopifyPlugin implements CorePlugin {
     name = 'shopify';
     
     // プラグイン初期化
     async initialize(config: any): Promise<void> {
       // Shopify連携の初期化
     }
     
     // フレームワークにフック登録
     registerHooks(hooks: any): void {
       hooks.onUserCreated(this.handleUserCreated.bind(this));
     }
     
     private async handleUserCreated(user: any): Promise<void> {
       // Shopifyカスタマー作成ロジック
     }
   }
   ```

2. **プラグイン使用例**：
   ```typescript
   // アプリケーションでのプラグイン使用
   import { CoreApp } from '@core/app';
   import { ShopifyPlugin } from '@core/plugin-shopify';
   
   const app = new CoreApp();
   
   // プラグイン登録
   app.use(new ShopifyPlugin({
     apiKey: process.env.SHOPIFY_API_KEY,
     apiSecret: process.env.SHOPIFY_API_SECRET,
     shop: process.env.SHOPIFY_SHOP
   }));
   
   app.start();
   ```

## 📅 ロードマップ

| フェーズ | 期間 | 主要マイルストーン |
|---------|------|-----------------|
| Phase 1: 基盤整備 | 3ヶ月 | - 共通基盤ライブラリ設計と実装<br>- モノレポ構造への移行<br>- ベースドメイン実装 |
| Phase 2: CLI開発 | 2ヶ月 | - 基本CLI機能の実装<br>- コード生成機能の開発<br>- テンプレート管理システム構築 |
| Phase 3: パッケージ公開 | 1ヶ月 | - NPMパッケージとしての公開<br>- ドキュメント整備<br>- サンプル実装の提供 |
| Phase 4: エコシステム拡張 | 継続的 | - プラグインシステムの実装<br>- コミュニティ貢献の仕組み構築<br>- 外部サービス連携の拡充 |

## 🔍 成功指標

1. **開発効率**:
   - 新規SaaSプロジェクト立ち上げ時間の50%削減
   - 繰り返し実装する機能の実装時間の70%削減

2. **コード品質**:
   - テストカバレッジ80%以上の維持
   - 静的解析でのエラー/警告ゼロの維持

3. **採用指標**:
   - GitHubスター数：初年度1,000+
   - NPMダウンロード数：初年度月間10,000+
   - アクティブコントリビューター：初年度20人以上

4. **持続可能性**:
   - 定期的なリリースサイクルの確立（月1回以上）
   - イシュー解決平均時間の短縮

## 📢 コミュニティ構築計画

1. **オープンソース化戦略**:
   - MITライセンスでの公開
   - コントリビューションガイドラインの整備
   - イシューテンプレートと PR テンプレートの作成

2. **ドキュメント・教育リソース**:
   - 公式ウェブサイトの構築
   - チュートリアルとガイドの作成
   - ユースケース別サンプルの提供

3. **コミュニティチャネル**:
   - GitHub Discussionsでのコミュニティフォーラム
   - Discordコミュニティサーバーの開設
   - 定期的な貢献者ミーティング

## 🚀 次のステップ

1. **リポジトリ再構築**:
   - モノレポ構造への移行
   - 自動化CI/CDパイプラインの構築
   - コード品質ツールの導入

2. **CLIプロトタイプ開発**:
   - コマンド設計と基本機能実装
   - テンプレート管理システム構築
   - プロジェクト生成機能のテスト

3. **共通ライブラリの分離**:
   - 基盤コードの抽出と整理
   - APIの設計と安定化
   - 単体テストの充実

## 📚 参照

- 詳細設計については[理想設計書](./01_ideal_design.md)を参照
- 移行プロセスについては[移行計画書](./02_migration_plan.md)を参照
- 共通ベースドメインは[ベースドメイン実装指示書](./03_base_domain_guide.md)を参照
- Userドメインの実装は[Userドメイン実装指示書](./04_user_domain_guide.md)を参照 