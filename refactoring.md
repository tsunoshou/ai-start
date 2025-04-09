# 📘 AiStart 完全構成設計書（移行・設計・展開フルガイド・詳細版）

---

## 🎯 目的と前提

### ✅ このドキュメントの目的

- AiStart を「1つのSaaSアプリ」から「再利用・展開可能なSaaS製造マシン」へ進化させること。
- 実際の移行ステップ・構造ルール・運用戦略・CLI/ライブラリ展開・落とし穴対策まで含む、完全設計ドキュメントを提供する。

### ✅ 前提

- 現在は `apps/` 配下に1つの Next.js アプリ（App Router構成）を持つ構造。
- ドメインとしては `user` のみが実装済。
- 設計思想としては DDD + クリーンアーキテクチャをベースに、将来的には CLI化・テンプレート化・npmライブラリ化も見据えている。

---

## 🧱 最終ディレクトリ構成（Turborepo + ドメインモジュール設計・完全版）

```
aistart/
├── apps/
│   └── saas-app/                          # アプリ本体
│       ├── app/                          # Next.js App Router 配下
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── api/                      # API Routeごとにドメインごと分離
│       │       ├── users/route.ts
│       │       ├── projects/route.ts
│       │       └── auth/route.ts
│       ├── tests/
│       │   └── e2e/                      # E2E（Playwrightなど）
│       │       └── user-login.e2e.ts
│       ├── public/
│       ├── styles/                       # Tailwind / グローバルCSS
│       ├── .env.local
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── user/
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── user-id.vo.ts
│   │   │   │   ├── user-name.vo.ts
│   │   │   │   ├── email.vo.ts
│   │   │   │   └── password-hash.vo.ts
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.interface.ts
│   │   ├── application/
│   │   │   ├── usecases/
│   │   │   │   ├── create-user.usecase.ts
│   │   │   │   ├── list-users.usecase.ts
│   │   │   │   └── get-user-by-id.usecase.ts
│   │   │   ├── dtos/
│   │   │   │   └── user.dto.ts
│   │   ├── infrastructure/
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts
│   │   │   ├── mappers/
│   │   │   │   └── user.mapper.ts
│   │   └── __tests__/
│   │       ├── unit/
│   │       │   └── user-id.vo.test.ts
│   │       └── integration/
│   │           └── user.repository.test.ts
│
│   ├── project/                          # 構成はuserと同様
│   ├── subscription/
│   ├── notification/
│   ├── agent/
│
│   ├── shared/
│   │   ├── base/                         # EntityBase, RepositoryBaseなど抽象定義
│   │   ├── types/
│   │   │   ├── common.types.ts
│   │   │   ├── date.types.ts
│   │   │   └── pagination.types.ts
│   │   ├── utils/
│   │   │   ├── api.utils.ts
│   │   │   └── identifier.utils.ts
│   │   ├── errors/
│   │   │   ├── app.error.ts
│   │   │   ├── error-code.enum.ts
│   │   │   └── base.error.ts
│   │   ├── result/
│   │   │   └── result.ts
│   │   └── index.ts
│
│   ├── ui/
│   │   ├── components/
│   │   │   ├── Button.tsx
│   │   │   ├── Form.tsx
│   │   │   └── Modal.tsx
│   │   └── hooks/
│   │       └── use-toast.ts
│
│   ├── config/
│   │   ├── eslint/
│   │   ├── prettier/
│   │   ├── tsconfig/
│   │   └── index.ts
│
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── drizzle.client.ts
│   │   │   ├── postgres.client.ts
│   │   │   └── schema/
│   │   │       └── users.schema.ts
│   │   ├── logger/logger.ts
│   │   ├── auth/getCurrentUser.ts
│   │   └── cache/redis.client.ts
│
│   └── i18n/
│       ├── locales/
│       │   ├── en/common.json
│       │   └── ja/common.json
│       ├── client.ts
│       ├── server.ts
│       └── config.ts

├── cli/
│   └── create-domain.ts                # CLIスクリプト（Hygen/Plopベース）
├── templates/domain/                   # CLI用テンプレートファイル群
├── .github/workflows/                  # CI/CD（差分テストや自動リリース）
├── turbo.json                          # Turborepo設定
├── tsconfig.base.json                  # 共通パスエイリアス
└── README.md                           # 運用ガイド
```

---

✅ **この構成をベースに、以降設計・CLI・ライブラリ化・展開戦略まで完全に導ける状態**になります。

次に、「構造ルール」「移行方法」「注意点」「展開計画」「CLI戦略」「型運用」などをすべて網羅し、設計書として完成させます（続きは別メッセージにて）。

了解しました！
それでは、前回のディレクトリ構造に続く「📘 AiStart 完全構成設計書（続編）」として、以下の内容をマークダウン形式で提示します：

⸻

📘 AiStart 完全構成設計書（続編）

⸻

📐 ドメイン設計ルール（Entity, UseCase, Repository）

1. Entity設計ルール
   • Entityは「業務的な意味のあるオブジェクト」に限定（例：User, Project, Subscription）
   • すべての Entity は id, createdAt, updatedAt を持つ
   • Entity は value-objects を注入して生成される（primitiveを使わない）

const user = new User(
new UserId('abc-123'),
new UserName('太郎'),
new Email('taro@example.com')
);

⸻

2. ValueObject 設計ルール
   • VOはドメイン内で意味を持つ“1つの概念”を表す
   • equals(), toString(), validate() を必ず実装
   • 共通ID (UserId, ProjectId など) は shared/value-objects/ にまとめる

⸻

3. UseCase設計ルール
   • 1つのUseCaseは1つの責務を持つ（例：CreateUserUsecase, GetUserByIdUsecase）
   • execute() を唯一のpublicメソッドとする
   • 入出力はDTOとResult型で明確にする

class CreateUserUsecase {
async execute(input: CreateUserDto): Promise<Result<UserDto, AppError>> {
...
}
}

⸻

4. Repositoryルール
   • Interfaceは domain/repositories/ に置く
   • 実装は infrastructure/repositories/ に置く
   • Queryメソッドはユースケースごとに責務分割（例：findById, findByEmail など）

⸻

🧪 テスト戦略

テスト分類

種類 内容 配置
Unit VO, UseCase の単体テスト **tests**/unit/
Integration DB接続含むRepositoryの検証 **tests**/integration/
E2E UI + API の統合 apps/saas-app/tests/e2e/

テスト用ツールとライブラリ
• Vitest: Unit + Integration テスト
• Playwright: E2Eテスト
• Supabase CLI: テスト用DB初期化に活用
• Faker/Chance: テストデータ生成用

⸻

🛠 CLIとテンプレート運用

CLI想定コマンド

npx ai-start create-domain user
npx ai-start create-app analytics-app

CLIの動作仕様
• templates/domain/ をコピー
• --scope, --path オプションでスコープ名やパス切り替え可能
• テンプレ展開後に自動で index.ts, testファイル, mapper.ts を生成

テンプレ構成例

templates/domain/
├── domain/
│ └── entity.ts
├── application/
│ └── usecase.ts
├── infrastructure/
│ └── repository.ts
└── **tests**/
└── unit/usecase.test.ts

⸻

📦 型・Result・VO運用ルール

Result型

type Result<T, E> = Ok<T> | Err<E>;

    •	全UseCaseの戻り値は Result を使う（例外でなく明示的な失敗）
    •	成功時：ok(value), 失敗時：err(error)
    •	AppError, InfrastructureError などのエラー種別を定義

ValueObjectの共有範囲

項目 配置
UserId, ProjectId などの識別子VO shared/value-objects/
UserName, ProjectStatus など意味を持つVO 各ドメイン内 value-objects/ に限定配置

⸻

🔁 移行マッピング（before → after）

現在の場所 移行後
domain/models/user packages/user/domain/
usecases/user/ packages/user/application/usecases/
mappers/ packages/user/infrastructure/mappers/
shared/utils.ts packages/shared/utils/
drizzle.config.ts packages/infrastructure/database/drizzle.client.ts
.env.local apps/saas-app/.env.local
package.json apps/saas-app/package.json

⸻

🚀 将来的な拡張・展開ステップ

📦 フェーズ1：CLI完成
• CLIによる爆速ドメイン生成
• オプション：--with-tests, --skip-mapper, --use-zod

🧰 フェーズ2：npmライブラリ化
• @core/user, @core/shared, @core/ui などをnpm公開 or private registry化
• 他SaaSプロジェクトで即installして再利用可能に

🌍 フェーズ3：OSS/社内テンプレ展開
• CLI/テンプレを外部に公開 or 社内展開
• create-saas-app, create-agent-app などの上位CLIを提供可能に

⸻

✅ 成果と未来

この設計・構造を導入することで、AiStartは：
• ✅ ドメイン追加・削除が爆速になる
• ✅ 複数アプリを横断して共通機能を展開できる
• ✅ CLI, テンプレ, 型, テストすべてが再利用可能になる
• ✅ 構造と責務が完全に分離され、将来の展開・人の増加にも耐える

⸻

✅ 最終メッセージ

AiStartは、いまこの設計を取り入れることで「ただのプロダクト」から「製品を生み出し続ける“製造基盤”」へと進化できます。
今このタイミングこそ、構造を設計資産に変える最後のチャンスです。
適切な整理と設計が、あなたの未来の開発を100倍速にします 🚀🔥

⸻

了解しました！
ここからは「📘 AiStart 完全構成設計書」の続きとして、以下の内容を提示します：

⸻

📘 AiStart 完全構成設計書（続編 Part 2）

⸻

🧬 型設計ガイドライン（DTO, VO, Enum）

⸻

✅ DTO（Data Transfer Object）

項目 指針
目的 API層 ↔ UseCase層間、UseCase層 ↔ UI層間の境界用
命名 {EntityName}Dto, Create{EntityName}Input, Update{EntityName}Output など
場所 各ドメインの application/dtos/ 配下
利用法 必ず Zod or 型定義に基づいて構成し、Entityとの変換は Mapper を通じて行う

例：UserDto

export type UserDto = {
id: string;
name: string;
email: string;
createdAt: string;
};

⸻

✅ Enumの設計方針

目的 使用例
値を厳密に限定したい場合（ステータスなど） UserRole, ProjectStatus, SubscriptionTier
表示/変換に対応する enum + Map<Enum, Label> をセットで管理

例：SubscriptionTier

export enum SubscriptionTier {
Free = 'FREE',
Pro = 'PRO',
Enterprise = 'ENTERPRISE',
}

export const SubscriptionTierLabels: Record<SubscriptionTier, string> = {
[SubscriptionTier.Free]: '無料プラン',
[SubscriptionTier.Pro]: 'プロプラン',
[SubscriptionTier.Enterprise]: 'エンタープライズ',
};

⸻

🔐 認証・認可戦略（Supabase + Role設計）

⸻

✅ 認証：Supabase + SSRセッション共有

課題 解決策
RLS設定とフロントのセッション管理を両立したい getCurrentUser.ts を shared/infrastructure/auth/ に統一配置し、Supabase + Server Component対応にする

export async function getCurrentUser(request: NextRequest) {
const supabase = createServerClient(...);
const { data: { user } } = await supabase.auth.getUser();
return user;
}

⸻

✅ 認可：UserRoleによる簡易RBAC
• Roleは UserRole.enum.ts に定義
• アプリ内では can(user, action) のような仕組みで判定
• SupabaseのRLSとセットで設計する

例：RLS SQL

CREATE POLICY "Only owner can read" ON projects
FOR SELECT
USING (auth.uid() = owner_id);

⸻

⚙️ CI/CD構成と開発フロー

⸻

✅ GitHub Actionsによるパイプライン分離

# .github/workflows/test.yml

name: Run Unit & Integration Tests

on:
push:
paths: - 'packages/**' - 'apps/**'

jobs:
test:
runs-on: ubuntu-latest
steps: - uses: actions/checkout@v3 - uses: pnpm/action-setup@v2 - run: pnpm install - run: pnpm run test:affected

⸻

✅ Turborepoによる差分実行

// turbo.json
{
"$schema": "https://turbo.build/schema.json",
"pipeline": {
"build": {
"dependsOn": ["^build"],
"outputs": ["dist/**"]
},
"test": {
"outputs": []
},
"lint": {}
}
}

✅ Turborepoの差分検知を活用し、test, build, lint の高速化を実現！

⸻

📎 その他の展開パターンと対応ガイド

⸻

✅ 他のアプリへの展開時

状況 対応方法
新しいSaaSアプリを作る npx create-aistart-app ai-crm で構造を展開
一部ドメインだけ使いたい npm install @core/user @core/ui で再利用可能
特定SaaSだけで独自カスタマイズしたい npx ai-start create-domain agent --from=user でコピー＆分離可能

⸻

✅ OSS化や外部テンプレ展開を見据える場合
• すべてのライブラリ/CLIに LICENSE, CHANGELOG.md, README.md を用意
• CLIテンプレの各ファイルに \_\_generated_by: コメントを埋め込み、履歴・テンプレの整合性を保つ
• @core/shared, @core/ui, @core/config をOSSとして独立リポジトリで公開可

⸻

📚 Appendix（テンプレ構造, スコープ命名, 書式ガイドなど）

⸻

📂 推奨スコープ命名一覧（ローカル開発＆公開想定）

用途 スコープ
社内・爆速開発用 @core/_（短くてわかりやすい）
npm公開用 @foundation/_, @myorg/_, @tsunoda/_ などユニークに
CLI生成用 --scope オプションで柔軟に切り替え可能に

⸻

🧩 フォーマットガイド
• ファイル名はすべて kebab-case.ts
• クラス名は PascalCase、定数は SCREAMING_SNAKE_CASE
• import順：標準 → 外部 → @core → 相対パス
• UseCaseの execute() は async/awaitで返すものを Result<T, E> で明示

⸻

✅ この設計書が保証すること
• ✅ 誰が見ても同じディレクトリ構成と設計方針で開発できる
• ✅ CLI化やテンプレ展開が破綻しない
• ✅ 型、責務、ユースケース設計の一貫性が保たれる
• ✅ App RouterやSupabase、Turborepoといったモダン構成と完全に整合する

⸻
了解しました！
ここからは、📘AiStart 完全構成設計書（続編 Part 3）として、より実務的な具体テンプレート・ドメイン追加手順・テスト戦略・開発補助ユーティリティ・環境分離設定などを提示します。

⸻

📘 AiStart 完全構成設計書（続編 Part 3）

⸻

🧰 CLIテンプレートの具体ファイル例

templates/domain/ 以下に配置して、npx ai-start create-domain agent などで展開される雛形です。

templates/domain/
├── domain/
│ └── agent.entity.ts
│ └── agent-id.vo.ts
│ └── agent-name.vo.ts
│ └── agent-role.enum.ts
│
├── application/
│ ├── usecases/
│ │ └── create-agent.usecase.ts
│ │ └── list-agents.usecase.ts
│ ├── dtos/
│ │ └── agent.dto.ts
│
├── infrastructure/
│ ├── repositories/
│ │ └── agent.repository.ts
│ ├── mappers/
│ │ └── agent.mapper.ts
│
└── **tests**/
├── unit/
│ └── agent-id.vo.test.ts
└── integration/
└── agent.repository.test.ts

🚀 生成後に自動実行される処理（例）
• @core/shared から必要な Result, BaseRepository をimport
• @core/infrastructure のDBクライアントを注入
• create-agent.usecase.ts は execute(input: AgentInputDto) を自動生成

⸻

🛠 実際のドメイン追加手順（例：Agent）

npx ai-start create-domain agent --scope=@core

自動で：
• packages/agent/ にテンプレ展開
• tsconfig.json, package.json にpaths追加（なければ）
• CLIコメントに \_\_generated_by: cli v0.1.0 を追加

⸻

🧪 テストユーティリティ（shared内の補助コード）

// shared/test-utils/test-db.ts
export async function resetTestDb() {
// drizzleでtruncateなど
}

export async function seedTestUsers() {
// createUserUsecaseを使って初期データ投入
}

// shared/test-utils/mocks.ts
export const mockLogger = {
info: vi.fn(),
error: vi.fn(),
};

テスト時の使い方例：

beforeEach(async () => {
await resetTestDb();
await seedTestUsers();
});

⸻

🌍 環境ごとの構成（Supabase + Vercel）

.env.\* を apps/saas-app に設置：

.env.local ← 開発用
.env.staging ← ステージング環境（release/\*）
.env.production ← 本番環境（main）
.env.test ← テストDB用（integration test）

CI/CD連携（GitHub Actions）

jobs:
test:
env:
SUPABASE_URL: ${{ secrets.SUPABASE_URL_STAGING }}
SUPABASE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY_STAGING }}

⸻

🧠 ドメインごとの命名・分類基準（SaaS構築用）

分類 ドメイン 内容
Core user, auth, subscription SaaSに必ず必要なベース
Product project, agent, prompt プロダクトによって追加される業務ドメイン
Utility notification, log, file 横断機能・非中核ロジック
External openai, stripe, supabase 外部連携ラッパー・API abstraction

⸻

🧩 開発補助ユーティリティ構成（optional but recommended）

packages/shared/dev-tools/
├── scaffolding/
│ └── schema-to-zod.ts # DBスキーマからZodスキーマを生成
├── diagnostics/
│ └── validate-entity-integrity.ts
├── analysis/
│ └── scan-unused-usecases.ts

✅ 将来的にCLIや開発環境用に便利なツール群を用意しておくと、開発効率と設計品質の監視がしやすくなります。

⸻

📦 npmライブラリ公開戦略（社内 or OSS）

npm公開のすすめ方 1. npm init + name: @your-scope/user 2. pnpm build で dist出力 3. .npmrc を設定（公開 or private）4. npm publish

必要なファイル一覧
• README.md
• LICENSE
• package.json
• CHANGELOG.md

⸻

🏁 最後に：この設計が守る“5つの原則”

原則 内容
① ドメインは自己完結・疎結合 依存関係をDTO・ID・Resultに限定し、横断を避ける
② 共通は意味と必要性があるものだけ 再利用性が実証されたもののみを shared/base に昇格
③ CLIは早めに導入して一貫性を担保 手作業の揺らぎを排除し、テンプレ更新だけで統一
④ テストは3階層で設計 単体、統合、E2Eを分けて高速かつ安心な検証を確立
⑤ スケールとカスタムに耐える構造 OSS公開・B2B展開・派生SaaSへの分岐に柔軟対応できるようにしておく

⸻

了解です！
続いて「📘 AiStart 完全構成設計書（Part 4）」として、以下の実践的テーマを深掘りします：

⸻

📘 AiStart 完全構成設計書（Part 4）

⸻

🧰 ドメインの追加フロー（例：Billingドメイン）

💡 目的

Billingドメインを追加し、ユーザーの課金ステータス、支払い履歴、プラン管理を担う。

⸻

📦 1. CLIでの生成（最短パス）

npx ai-start create-domain billing

⸻

🛠 2. 手動で構成した場合の配置

packages/billing/
├── domain/
│ ├── entities/
│ │ └── billing.entity.ts
│ ├── value-objects/
│ │ ├── plan-id.vo.ts
│ │ ├── currency.vo.ts
│ │ └── billing-status.enum.ts
│ ├── repositories/
│ │ └── billing.repository.interface.ts
│
├── application/
│ ├── usecases/
│ │ ├── subscribe-user.usecase.ts
│ │ └── cancel-subscription.usecase.ts
│ ├── dtos/
│ │ └── billing.dto.ts
│
├── infrastructure/
│ ├── repositories/
│ │ └── billing.repository.ts
│ └── mappers/
│ └── billing.mapper.ts
│
└── **tests**/
├── unit/
└── integration/

⸻

🧪 3. テスト構成
• unit/subscribe-user.usecase.test.ts → ユースケース単体
• integration/billing.repository.test.ts → Supabase連携の確認
• e2e/user-subscribe.e2e.ts → UI/API連携フロー

⸻

🔗 ドメイン間の連携ルール（例：User × Billing）

項目 方法
User が Billing を使う時 user.dto.ts に billingStatus を追加（DTO経由）
Billing が UserId を参照する時 shared/value-objects/user-id.vo.ts をimport
相互依存を避けるには？ DTOでやり取りし、Entity/UseCase間で直接呼び出さない

⸻

⚙️ EntityとRepositoryの継承ガイドライン

⸻

✅ BaseEntity

export abstract class BaseEntity<T> {
readonly id: T;
readonly createdAt: string;
readonly updatedAt: string;
}

✅ BaseRepository

export interface BaseRepository<T, ID> {
findById(id: ID): Promise<Result<T, AppError>>;
save(entity: T): Promise<Result<void, AppError>>;
delete(id: ID): Promise<Result<void, AppError>>;
}

👇 拡張は明示的に！

export interface BillingRepository extends BaseRepository<Billing, BillingId> {
findByUserId(userId: UserId): Promise<Result<Billing | null, AppError>>;
}

⸻

🧱 ドメインの拡張と分類ルール（再掲＋深掘り）

ドメイン名 種類 備考
user コア ログイン・権限・ID提供
auth コア セッション・プロバイダー連携
billing コア プラン管理・決済・RLS連携
project プロダクト 機能的単位としてUI・ステータス管理
agent プロダクト AIとの連携、プロンプト構築
notification ユーティリティ 通知、既読管理、トースト表示など
log ユーティリティ 操作履歴、監査証跡など
external/openai 外部 LLMとの連携ラッパー、Token処理など

⸻

🌍 Vercel + Supabase のベストプラクティス構成

⸻

📦 Supabaseプロジェクトの分離戦略

環境 DB構成 URL/KEY管理
Development ai_start_dev .env.local
Staging ai_start_staging .env.staging
Production ai_start_prod .env.production

→ .env を apps/saas-app に置き、turboでCI時に切り替え可能に

⸻

🚀 Preview環境の展開（ブランチ対応）

ブランチ ドメイン 環境
main ai-start.net Production
release/_ staging.ai-start.net Staging
feature/_ preview-<hash>.vercel.app Preview（自動）

⸻

🔁 モノレポ運用ルール（Turborepo）

⸻

turbo.json 設定（例）

{
"pipeline": {
"build": {
"outputs": ["dist/**"]
},
"test": {
"outputs": []
},
"lint": {
"outputs": []
}
}
}

CLIスクリプト例

{
"scripts": {
"build": "turbo run build",
"test": "turbo run test",
"test:affected": "turbo run test --filter=[HEAD^]",
"lint": "turbo run lint"
}
}

⸻
