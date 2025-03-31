# 実装ルール・命名規則

最終更新日: 2025-03-31

## 本ドキュメントの目的

このドキュメントは、AiStartプロジェクトにおける具体的な実装ルール、コーディング規約、命名規則を定義しています。関連ドキュメントとの役割の違いは以下のとおりです：

- **01_requirements_definition.md**：「何を」実現するのか（What）

  - ビジネス・機能要件の定義
  - 非機能要件の定義
  - 技術スタックの概要

- **02_architecture_design.md**：「どのように」実現するのか（How）

  - アーキテクチャスタイルの選定と理由
  - ディレクトリ構造と各レイヤーの責務
  - モジュール分割と依存関係の設計
  - 認証・認可の実装アーキテクチャ
  - エラー処理戦略の詳細

- **03_prototype_development.md**：プロトタイプでの検証事項（Verify）

  - プロトタイプの目的と検証内容
  - 検証する技術項目と評価方法
  - プロトタイプの実装範囲と制限

- **04_implementation_rules.md**：「どのように書くか」（Write）
  - 具体的なコーディング規約と命名規則
  - 実装パターン集と具体的なコード例
  - 型定義と安全な変換関数の実装詳細
  - リポジトリパターンとRLSの実装詳細

このドキュメントは実装の一貫性と品質を確保するための具体的なルールを提供します。02_architecture_design.mdでの設計思想と原則を、実際のコードレベルでどのように実現するかを示しています。開発者はこのドキュメントを参照して、プロジェクト全体で統一されたコーディングスタイルと実装パターンを適用できます。

> **注意**: 具体的なコード例については、[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

## コーディング規約

### フォーマットと構文

- TypeScriptの厳格モード（strict: true）を使用
- インデント: 2スペース
- セミコロン: 必須
- 1行の最大文字数: 100文字
- 文字列: シングルクォート優先
- 行末コンマ: ES5互換（オブジェクト、配列の最後の要素の後にコンマ）

### リンター設定

ESLintを使用して以下のルールを強制します：

- 未使用変数の警告（アンダースコアプレフィックス付き変数は除外）
- 明示的な関数戻り値型の強制
- 命名規則の強制（各種型、関数、変数、コンポーネントなど）
  - 一般関数: camelCase
  - Reactコンポーネント関数: PascalCase（特定の条件を満たす場合のみ）
  - 変数: camelCase（PascalCaseやUPPER_CASEも特定の条件下で許可）
  - グローバル定数: UPPER_CASE（特定の例外あり）
  - インターフェース: PascalCase（Iプレフィックスなし）
  - 型定義: PascalCase
  - enumメンバー: PascalCase
- インポート順序の管理
- レイヤー間の依存関係制約
- ファイル種別に応じた特別ルール

詳細な設定例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### 自動フォーマット

Prettierを使用して以下のフォーマットを自動適用します：

- セミコロン、引用符、インデント、行の長さなどのスタイル統一
- 改行、空白、括弧などの一貫したフォーマット

Prettierの適用範囲から除外するファイルや特定のパターンは、`.prettierignore`で定義しています：

- ビルド成果物（`.next/`, `build/`, `dist/`など）
- `node_modules/`のような依存関係ディレクトリ
- ドキュメントフォルダ内のマークダウンファイル（`docs/**/*.md`）：マークダウンのフォーマットを維持するため

詳細な設定例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### 国際化（i18n）実装ルール

国際化機能の実装には、以下のルールを適用します。

#### 翻訳キーの命名規則

翻訳キーは、以下の構造に従って命名します：

```
[機能カテゴリ].[コンポーネント/ページ名].[コンテキスト].[識別子]
```

例：

- `common.button.submit` - 共通の送信ボタンラベル
- `project.details.title` - プロジェクト詳細ページのタイトル
- `auth.login.error.invalidCredentials` - ログイン時の無効な認証情報エラー

翻訳キーには以下のルールを適用します：

- キャメルケースで記述
- 階層の数は最大4レベルまで
- 通常4階層目はエラーメッセージやバリエーションを表す
- 動的に生成されるキーは使用しない

#### 翻訳ファイル構造

翻訳ファイルは、以下の構造で組織します：

```
/i18n
  /locales
    /ja
      common.json
      auth.json
      project.json
      program.json
      ai.json
      ...
    /en
      common.json
      auth.json
      project.json
      program.json
      ai.json
      ...
  /types
    i18n-types.ts  // 自動生成された型定義
```

#### 翻訳の使用パターン

コンポーネント内での翻訳の使用パターンは、以下のように統一します：

```tsx
'use client';

import { useTranslation } from 'next-intl';

export function SubmitButton() {
  const t = useTranslation('common');

  return <button type="submit">{t('button.submit')}</button>;
}
```

パラメータを含む翻訳の場合：

```tsx
// 翻訳キー: "project.details.createdByUser" = "{username}さんが作成"
const message = t('project.details.createdByUser', { username: user.name });
```

#### RTL（右から左）対応の実装ルール

RTL言語（アラビア語、ヘブライ語等）のサポートを実装する場合、以下のルールに従います：

##### 1. 基本設定

- すべてのHTMLテンプレートまたはレイアウトでは言語に応じて動的に`dir`属性を設定：

```tsx
// layout.tsx
export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // RTL言語のリスト
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  const isRtl = rtlLocales.includes(locale);

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <body>{children}</body>
    </html>
  );
}
```

##### 2. スタイリングルール

- Tailwind CSSの`rtl:`バリアントを使用して方向に依存するスタイルを適用：

```tsx
// RTL対応のパディング（LTRでは左、RTLでは右）
<div className="pl-4 rtl:pr-4 rtl:pl-0">...</div>

// RTL対応のテキスト配置
<p className="text-left rtl:text-right">...</p>

// RTL対応のフレックス方向
<div className="flex flex-row rtl:flex-row-reverse">...</div>
```

- CSS変数を使用して方向に依存する値を定義：

```css
:root {
  --start: left;
  --end: right;
}

[dir='rtl'] {
  --start: right;
  --end: left;
}

.align-start {
  text-align: var(--start);
}
```

##### 3. コンポーネント設計ルール

- 方向に依存するUIコンポーネントでは、常に「開始/終了」の概念を使用：

```tsx
// 悪い例（方向が固定）
<IconButton iconPosition="left" />

// 良い例（方向に依存しない）
<IconButton iconPosition="start" />
```

- アイコンやグラフィックの向きを自動的に反転させるユーティリティを使用：

```tsx
// アイコン反転ユーティリティコンポーネント
function DirectionalIcon({ icon, ...props }) {
  const { isRtl } = useRtlContext();
  return (
    <Icon
      icon={icon}
      className={isRtl && requiresFlipping(icon) ? 'rotate-180 transform' : ''}
      {...props}
    />
  );
}
```

##### 4. 双方向テキスト処理

- Unicode制御文字を適切に使用して混合言語テキストを正しく表示：

```tsx
// 混合言語テキストを表示する際のユーティリティ
function BidiText({ text, baseDirection = 'auto' }) {
  const bidiMarker = baseDirection === 'rtl' ? '\u200F' : '\u200E';
  return (
    <span>
      {bidiMarker}
      {text}
    </span>
  );
}
```

##### 5. テスト要件

- すべての新規UIコンポーネントはRTLモードでのビジュアルテストを必須とする
- RTLモードでのインタラクションテストを実装する
- RTL切り替え時のレイアウト崩れをチェックするスナップショットテストを実装する

#### 型安全な翻訳

// ... 既存のコード ...

#### リソース更新ワークフロー

// ... 既存のコード ...

### 歴史的事例データベース実装ルール

1. **事例データモデル構造**

   - 基本メタデータ: ID、タイトル、業種、規模、期間、結果
   - 詳細属性: 主要要因、状況説明、経緯、結果詳細
   - ベクトル表現: 埋め込みベクトルとして保存するエンティティ特徴
   - 関連性タグ: 複数のカテゴリタグとメタタグ

2. **事例データ CRUD 操作**

   - 作成/更新操作: トランザクション管理と整合性検証
   - ベクトル生成: テキスト埋め込み計算と保存手順
   - 検索操作: 類似度検索とフィルタリングの組み合わせ
   - バッチ操作: 大量データ処理の分割実行

3. **分析エンジン実装**

   - モジュール分割: 特徴抽出、類似度計算、評価計算、提案生成
   - パイプライン構造: 順次処理とエラーハンドリング
   - キャッシュ戦略: 計算コスト最適化と結果再利用
   - スコアリングロジック: 複合指標による加重評価

4. **AIアシスト統合**
   - プロンプトテンプレート: 事例ベースの状況特化プロンプト
   - コンテキスト構築: 類似事例と評価結果の効果的な組み込み
   - 提案生成指示: 具体性と実用性を強調する指示構文
   - 出力構造化: JSON応答フォーマットの定義と解析

詳細な実装例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

## プロジェクト構造

### ディレクトリ構造

02_architecture_design.mdの記載に基づく正確なディレクトリ構造を採用します。主な構造は以下の通りです：

- **domain/**: ドメイン層（モデル、サービス、イベント、リポジトリインターフェース）
- **application/**: アプリケーション層（DTOs、ユースケース）
- **infrastructure/**: インフラストラクチャ層（データベース、マッパー、外部サービス連携）
- **presentation/**: プレゼンテーション層（API、UIコンポーネント）
- **shared/**: 共有リソース（ユーティリティ、定数）
- **config/**: アプリケーション設定
- **tests/**: テスト
- **app/**: Next.js App Router

詳細な構造例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

## 命名規則

### ファイル命名規則

| ファイルタイプ             | 命名規則                                | 例                                                      |
| -------------------------- | --------------------------------------- | ------------------------------------------------------- |
| Reactコンポーネント        | PascalCase.tsx                          | Button.tsx, UserCard.tsx                                |
| ページコンポーネント       | page.tsx                                | page.tsx (app/projects/page.tsx)                        |
| レイアウトコンポーネント   | layout.tsx                              | layout.tsx (app/layout.tsx)                             |
| APIルート                  | route.ts                                | route.ts (app/api/users/route.ts)                       |
| ユーティリティ             | camelCase.ts                            | formatDate.ts, stringUtils.ts                           |
| 型定義                     | camelCase.ts                            | index.ts, api.ts (types/フォルダ内)                     |
| エンティティ               | PascalCase.ts                           | User.ts, Program.ts                                     |
| 値オブジェクト             | camelCase.ts                            | ids.ts, email.ts                                        |
| リポジトリインターフェース | PascalCaseRepository.ts                 | UserRepository.ts                                       |
| リポジトリ実装             | {Infrastructure}PascalCaseRepository.ts | SupabaseUserRepository.ts, PostgresProjectRepository.ts |
| ユースケース               | PascalCaseUsecase.ts                    | CreateProjectUsecase.ts                                 |
| DTOクラス                  | PascalCaseDTO.ts                        | UserDTO.ts, ProjectDTO.ts                               |
| マッパー                   | PascalCaseMapper.ts                     | UserMapper.ts, ProjectMapper.ts                         |
| テストファイル             | {対象ファイル名}.test.ts                | User.test.ts, formatDate.test.ts                        |
| 定数ファイル               | camelCase.ts                            | appConstants.ts, errorCodes.ts                          |
| カスタムフック             | use{名詞}.ts                            | useAuth.ts, useFormValidation.ts                        |
| 言語リソースファイル       | {言語コード}.json                       | en.json, ja.json                                        |
| 翻訳ユーティリティ         | i18n{機能}.ts                           | i18nConfig.ts, i18nUtils.ts                             |
| 事例データモデル           | {モデル}Entity.ts, {モデル}DTO.ts       | CaseStudyEntity.ts, AnalysisResultDTO.ts                |
| 分析アルゴリズム           | {機能}Algorithm.ts                      | SimilarityAlgorithm.ts, RiskEvaluationAlgorithm.ts      |

### ディレクトリ命名規則

| ディレクトリタイプ  | 命名規則                        | 例                                                |
| ------------------- | ------------------------------- | ------------------------------------------------- |
| 機能モジュール      | kebab-case                      | program-management/, user-profiles/               |
| Reactコンポーネント | kebab-case                      | common/, program/, project/                       |
| テストディレクトリ  | camelCase                       | unit/, integration/, e2e/                         |
| app内ルートグループ | (kebab-case)                    | (auth)/, (dashboard)/                             |
| 言語リソース        | i18n/                           | i18n/locales/, i18n/config/                       |
| 歴史的事例関連      | case-studies/, historical-data/ | case-studies/algorithms/, historical-data/models/ |

ディレクトリの深さは機能ごとに3〜4階層以内に抑え、過度に深いネストは避けます。

### モジュール分割の原則

プロジェクトのモジュール分割には以下の原則を適用します：

1. **レイヤーアーキテクチャに基づく水平分割**

   - **ドメイン層**: システムの核となるビジネスロジックとルール
   - **アプリケーション層**: ユースケースの実装とオーケストレーション
   - **インフラストラクチャ層**: 外部サービスとの連携
   - **プレゼンテーション層**: ユーザーインターフェース実装

2. **関心事の分離**

   - 各レイヤー内では機能ごとに適切なディレクトリ分割を行う
   - ドメインモデルのカテゴリごとに適切なサブディレクトリを構成
   - 共通ユーティリティと特定機能のロジックを分離

3. **インターフェース（出入口）の明確化**

   - 各モジュールは明示的なインターフェースを通じてのみ外部と通信
   - `index.ts` ファイルで公開APIを定義
   - 内部実装の詳細は隠蔽

4. **単一責任の原則に基づくモジュール設計**
   - 各モジュールは明確に定義された単一の責任を持つ
   - モジュールサイズが大きくなりすぎる場合は、さらに分割を検討

## 安全な型変換

### ブランド型とID型の使用方針

プロジェクトでは型安全性を確保するため、以下の方針でブランド型（特にID型）を使用します：

1. **プリミティブ型の拡張**

   - 文字列や数値を基にした独自の型を定義
   - readonly属性を持つ一意のシンボルプロパティで型を区別

2. **型変換の安全性確保**

   - 生の文字列からID型への変換は検証を伴う専用関数を使用
   - 新規IDの生成には型付けされた生成関数を使用

3. **型互換性の明示的制御**
   - 異なるID型間の誤った代入をコンパイル時に検出
   - 必要な場合のみ明示的に型変換を行う

詳細な実装例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### マッパー関数でのID型変換

データベースからのデータをドメインエンティティに変換する際、文字列からID型への安全な変換が必要です。マッパー関数はデータアクセス層とドメイン層の境界で型変換を担当します。

主な責務：

- データベースレコードからドメインモデルへの安全な変換
- ドメインモデルからDTOへの変換

詳細な実装例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### 型変換のベストプラクティス

- **`as unknown as T`の使用は特定の条件下でのみ行う**

  - 主にドメイン層とインフラ層の境界でのみ使用
  - 内部ロジックではブランド型を維持して型安全性を確保

- **型変換の集中化**

  - ID変換ロジックは`createId`と`generateId`関数に集中させる
  - マッパーレイヤーで型変換を行い、他の箇所では型キャストを避ける

- **型ガード関数の活用**
  - 型の安全な判別のための専用関数を定義
  - 条件分岐内で型の絞り込みを行う

これらの方針に従うことで、型安全性を確保しつつ、必要な箇所での型変換を効率的に行うことができます。ブランド型のアプローチは、特にIDや値オブジェクトを扱う際に、コンパイル時に型エラーを検出し、実行時のバグを減らすのに役立ちます。

## 実装パターン集

### 型定義と安全な変換パターン

本プロジェクトでは以下のパターンに基づいて型定義と安全な変換を実装します。

#### ID型定義と変換関数

ID型はUUID形式の文字列をベースとしたブランド型として定義します。生成と変換のための専用ユーティリティ関数を提供し、型安全性と一貫性を確保します。

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

#### 値オブジェクト定義と変換関数

メールアドレスや日時など、ドメイン特有の値を表す型を定義し、検証と変換のための関数を提供します。これにより、無効な値がドメインモデルに入り込むことを防ぎます。

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

#### エラーコード定義

エラーコードとエラー型の定義は[05_type_definitions.md#共通エラー型](05_type_definitions.md#共通エラー型)に集約されています。各レイヤーで使用するエラーコードの定義方法、エラーハンドリングのパターン、およびエラーレスポンスの構造については、型定義文書を参照してください。

### リポジトリとRLSの実装パターン

#### リポジトリの責務範囲

リポジトリは**データアクセス層**の責務を担い、ドメインオブジェクトの永続化と取得に特化します。以下の原則に厳密に従ってください：

1. **リポジトリの基本責務（許可される操作）**:

   - **基本的なCRUD操作のみ**: Create, Read, Update, Delete操作
     - 例: `create(user)`, `findById(userId)`, `update(user)`, `delete(userId)`
   - **単純なFinderメソッド**: 主キーや一意の属性による検索
     - 例: `findByEmail(email)`, `findByUsername(username)`
   - **シンプルなフィルタリング**: 基本的な条件による検索
     - 例: `findByStatus(status)`, `findByCreatedDateAfter(date)`
   - **単純なコレクション取得**: 関連エンティティの直接的な取得
     - 例: `findProjectsByUserId(userId)`, `findCommentsByPostId(postId)`
   - **トランザクション管理**: データ整合性を保つためのトランザクション
     - 例: `withTransaction(callback)`, `beginTransaction()`, `commitTransaction()`

2. **リポジトリで禁止される操作**:

   - **ビジネスロジックの実装**: ドメインルールや業務ロジックの判断/実行
     - 禁止例: `approveUserRegistration()`, `calculateProjectScore()`
     - 代替: DomainServiceやApplicationServiceに委譲
   - **複雑なクエリ処理**: 複雑な結合や集計を含むクエリ（QueryObjectに委譲）
     - 禁止例: `findUserProjectsWithStatusSummary()`, `getActiveProjectStatistics()`
     - 代替: QueryObjectまたはReadModelに委譲
   - **複数リポジトリを跨ぐ操作**: 複数のエンティティ型にまたがる操作
     - 禁止例: `createUserWithProjects()`, `updateUserAndNotifyContacts()`
     - 代替: ApplicationServiceに委譲
   - **データ変換ロジック**: 複雑なデータ変換や計算処理
     - 禁止例: リポジトリ内での複雑なデータ構造の変換や計算
     - 代替: 専用のMapperクラスに委譲
   - **キャッシュ戦略の決定**: キャッシュの判断ロジック（インフラレイヤーに委譲）
     - 禁止例: リポジトリ内でのキャッシュヒット判断や保存期間管理
     - 代替: 専用のCachingServiceに委譲
   - **遅延ロード/プリロードの判断**: 読み込み戦略の決定（クライアントに委譲）
     - 禁止例: クライアントの状態に応じた読み込み戦略の動的判断
     - 代替: クライアント（UseCaseやController）側で指定

3. **代替パターン（複雑な操作の委譲先）**:

   - **QueryObject/ReadModel**: 複雑なクエリや集計、結合を要する読み取り操作
     - 例: `UserProjectsStatisticsQuery`, `ActiveUsersSummaryReadModel`
   - **ApplicationService**: 複数リポジトリを跨ぐ操作や業務ロジック
     - 例: `UserRegistrationService`, `ProjectPublishingService`
   - **DomainService**: 複数エンティティに関わるドメインロジック
     - 例: `PermissionEvaluationService`, `ScoreCalculationService`
   - **Mapper**: 複雑なデータ変換処理
     - 例: `UserEntityMapper`, `ProjectDtoMapper`

4. **責務境界の判断基準**:
   - **単一エンティティか複数エンティティか**:
     - 単一エンティティのみを扱う操作 → リポジトリの責務
     - 複数種類のエンティティを扱う操作 → ApplicationServiceの責務
   - **永続化に関連するか否か**:
     - データの保存/取得のみを行う → リポジトリの責務
     - ビジネスルールの適用や判断を含む → DomainServiceの責務
   - **クエリの複雑さ**:
     - 単純な条件による検索 → リポジトリの責務
     - 複雑な結合や集計を含む検索 → QueryObject/ReadModelの責務
   - **トランザクションの範囲**:
     - 単一エンティティに対するトランザクション → リポジトリの責務
     - 複数リポジトリにまたがるトランザクション → ApplicationServiceの責務

#### リポジトリメソッドの命名規則と責務境界

リポジトリのメソッド名は責務を明確に反映し、以下の命名規則に従います：

1. **CRUD操作の標準メソッド**:

   - `create(entity: Entity): Promise<Entity>` - エンティティの作成
   - `findById(id: ID): Promise<Entity | null>` - IDによる単一エンティティ取得
   - `findByIds(ids: ID[]): Promise<Entity[]>` - 複数IDによるエンティティ取得
   - `update(entity: Entity): Promise<Entity>` - エンティティの更新
   - `delete(id: ID): Promise<void>` - エンティティの削除

2. **許容される拡張Finder**:

   - `findBy{AttributeName}(value: any): Promise<Entity | null>` - 単一属性による検索
   - `findAllBy{AttributeName}(value: any): Promise<Entity[]>` - 単一属性による複数検索
   - `findByFilter(filter: SimpleFilter): Promise<Entity[]>` - シンプルなフィルター条件による検索
   - `exists(id: ID): Promise<boolean>` - エンティティの存在確認

3. **許容される関連エンティティ取得**:

   - `findRelated{EntityName}(id: ID): Promise<RelatedEntity[]>` - 関連エンティティ取得（直接の関連のみ）

4. **許容されるページネーション/ソート**:
   - `findAll(options?: { pagination?: PaginationOptions, sort?: SortOptions }): Promise<PaginatedResult<Entity>>`

**上記以外の複雑な操作はリポジトリの責務外**とし、適切な代替パターン（QueryObject、ReadModel、ApplicationService）に委譲してください。

#### リポジトリインターフェース定義

リポジトリインターフェースはドメインレイヤーに定義され、永続化の詳細から独立したデータアクセスのためのコントラクトを提供します。詳細な型定義と実装パターンについては[05_type_definitions.md#リポジトリインターフェース型](05_type_definitions.md#リポジトリインターフェース型)を参照してください。

#### リポジトリ実装クラス

リポジトリの実装はインフラストラクチャレイヤーで行われます。主な特徴：

1. **RLSによるアクセス制御**: SupabaseのRow Level Security (RLS)を活用した自動的なデータフィルタリング
2. **型安全なマッピング**: DBスキーマとドメインモデル間の安全な型変換
3. **セッションコンテキスト**: 認証済みクライアントを使用した操作の実行

#### モックリポジトリ実装

テスト用のモックリポジトリはインメモリ実装を提供し、テストの独立性と高速な実行を可能にします。

### AI関連の実装ルール

### AIプロバイダー統合

**基本設計原則**

1. **完全な抽象化と交換可能性**

   - 特定のAIプロバイダーに依存しない抽象インターフェースを定義する
   - すべてのプロバイダー実装は共通インターフェースを実装すること
   - アプリケーションコードは具象実装ではなく常に抽象インターフェースに依存すること

2. **ファクトリーとDI（依存性注入）パターンの活用**

   - `AIServiceFactory`を使用してプロバイダー実装のインスタンスを生成する
   - 依存性注入を通じてサービスインスタンスを提供する
   - 環境変数やコンフィグに基づいて適切なプロバイダーを選択する仕組みを組み込む

3. **構成と優先順位**
   - プロバイダーの優先順位: OpenAI（高）→ Anthropic（中）→ Google（中）→ オープンソース（低）
   - プロバイダー選択は目的とコスト効率に基づいて行う
   - 主要な機能はすべてのプロバイダーでサポートされること

**コードの構造**

```
/lib
  /ai
    /providers
      /openai
        openai-service.ts
        openai-config.ts
        openai-types.ts
      /anthropic
        anthropic-service.ts
        anthropic-config.ts
        anthropic-types.ts
      /google
        google-service.ts
        google-config.ts
        google-types.ts
      /open-source
        open-source-service.ts
        open-source-config.ts
        open-source-types.ts
    ai-service-interface.ts
    ai-service-factory.ts
    ai-service-registry.ts
    ai-types.ts
    index.ts
```

**命名規則**

1. **インターフェース**

   - `AIServiceInterface` - AIサービスの基本インターフェース
   - `AIModelConfig` - モデル設定型
   - `AICompletionOptions` - 補完オプション型

2. **具象クラス**

   - `OpenAIService` - OpenAI実装
   - `AnthropicService` - Anthropic実装
   - `GoogleAIService` - Google実装
   - `OpenSourceModelService` - オープンソースモデル実装

3. **ファクトリーと関連クラス**
   - `AIServiceFactory` - プロバイダーサービス作成ファクトリー
   - `AIServiceRegistry` - サービスインスタンス管理レジストリ
   - `AIModelCapabilityRegistry` - モデル能力情報レジストリ

**エラー処理**

1. **統一されたエラー型**

   - すべてのAIサービスエラーは`AIServiceError`型に変換すること
   - プロバイダー固有のエラーコードは共通エラーコードにマッピングすること
   - エラーはログに詳細に記録し、監視システムで追跡できるようにすること

2. **リトライとフォールバック戦略**

   - 一時的なエラーには指数バックオフによるリトライを実装すること
   - 致命的なエラーでは代替プロバイダーへのフォールバックを試みること
   - すべてのフォールバック試行は監視・ログ記録すること

3. **レート制限処理**
   - レート制限エラーの特別な処理メカニズムを実装すること
   - キューイングまたはバックオフ戦略を使用してレート制限を回避すること
   - 適切な警告で管理者に通知する仕組みを備えること

**ストリーミング実装**

1. **ストリーミングレスポンス規格**

   - Server-Sent Events（SSE）またはWebSocketを使用すること
   - 共通形式でチャンク化された応答を返すこと
   - 状態更新と完了イベントを適切に伝達すること

2. **エラー処理**
   - ストリーミング中のエラーは適切にクライアントに伝播すること
   - 接続断のグレースフルハンドリングを実装すること
   - 部分的な応答の適切な処理方法を提供すること

**モデル能力管理**

1. **モデル能力レジストリ**

   - 各AIモデルの能力を中央レジストリで管理すること
   - コンテキスト長制限とコスト情報を含めること
   - 新しいモデルを簡単に追加できる拡張構造にすること

2. **モデル選択ロジック**
   - 使用目的に最適なモデルを選択するロジックを実装すること
   - コスト、性能、速度のバランスを考慮したモデル選択を行うこと
   - ユースケースに基づく自動モデル選択機能を提供すること

**モニタリングと分析**

1. **使用状況とパフォーマンス追跡**

   - すべてのAIリクエストの使用量、レイテンシー、コストを追跡すること
   - プロバイダー間の比較分析を自動化すること
   - 定期的なパフォーマンスレポートを生成すること

2. **品質評価**
   - 応答品質の自動評価メカニズムを実装すること
   - ユーザーフィードバックを収集し分析すること
   - 継続的な改善のためのA/Bテスト機能を備えること

### プロンプト管理

// ... existing code ...

## コードスタイルルール

### 関数の命名規則

関数の命名には以下のルールを適用します：

1. **一般的な関数**

   - camelCase形式を使用（小文字で始まる）
   - 動詞または動詞句で開始する
   - 例: `getData()`, `calculateTotal()`, `convertToModel()`

2. **Reactコンポーネント関数**

   - PascalCase形式を使用（大文字で始まる）
   - 以下の条件を満たす場合のみPascalCaseを許可：
     - Next.js特有のページファイル/コンポーネント (`page.tsx`, `layout.tsx`など)
     - components/ディレクトリ内の関数
     - すでに大文字で始まる関数名
   - 例: `Button()`, `UserProfile()`, `DashboardLayout()`

3. **Reactフック**

   - camelCase形式を使用
   - `use`接頭辞を必ず使用
   - 例: `useState()`, `useEffect()`, `useCustomHook()`

4. **イベントハンドラ**
   - camelCase形式を使用
   - `handle`接頭辞を使用
   - 例: `handleClick()`, `handleSubmit()`, `handleInputChange()`

### 変数の命名規則

変数の命名には以下のルールを適用します：

1. **一般的な変数**

   - camelCase形式を使用
   - 明確で説明的な名前を使用
   - 例: `userData`, `isLoading`, `currentIndex`

2. **グローバル定数**

   - UPPER_SNAKE_CASE形式を使用（すべて大文字）
   - 例外: `metadata`, `config`などのフレームワーク固有の特殊な名前
   - 例: `API_BASE_URL`, `MAX_RETRY_COUNT`, `DEFAULT_TIMEOUT_MS`

3. **コンポーネントProps型**

   - PascalCase形式を使用
   - コンポーネント名 + `Props`のサフィックス
   - 例: `ButtonProps`, `UserProfileProps`

4. **Enum型**
   - 型自体はPascalCase
   - メンバーもPascalCase
   - 例: `enum Role { Admin, User, Guest }`

### React関連ルール

- コンポーネントは関数コンポーネントとして実装
- Hooksはカスタムフックとして抽出し、`use`プレフィックスを付ける
- クライアントコンポーネントには`'use client'`ディレクティブを先頭に記述
- Propsには適切な型定義を必ず行う
- データフェッチングはサーバーコンポーネントで行う

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

## ドキュメント規約

### コードコメント

- 公開APIと複雑なロジックには必ずJSDocコメントを付ける
- パラメータと戻り値の型は明示する
- 副作用があれば明示的に記述する

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### Markdownドキュメント

- 各機能の設計文書はMarkdownで作成
- ディレクトリには`README.md`を配置して目的と内容を説明
- 重要な設計決定はADR (Architecture Decision Record)として記録

## Git運用ルール

### ブランチ戦略

01_requirements_definition.mdに記載されたブランチ戦略に準拠:

```
各開発ブランチ → development → release → main
    |               |             |         |
    v               v             v         v
 開発作業        開発環境     ステージング環境  本番環境
```

- **main**: 本番環境用。直接コミット禁止
- **release**: ステージング環境用。developmentからのマージのみ
- **development**: 開発環境用。機能ブランチからのマージ
- **feature/xxx**: 機能開発用
- **bugfix/xxx**: バグ修正用
- **hotfix/xxx**: 緊急の本番修正用

### コミットメッセージ規約

```
<タイプ>: <簡潔な説明>

[任意の詳細説明]

[関連する課題番号: #123]
```

**タイプ:**

- **feat**: 新機能
- **fix**: バグ修正
- **docs**: ドキュメントのみの変更
- **style**: コードの意味に影響を与えない変更
- **refactor**: バグ修正や機能追加ではないコード変更
- **perf**: パフォーマンス向上
- **test**: テスト関連
- **chore**: ビルドプロセスやツール関連

## 品質基準

### テスト要件

- **単体テスト**: ドメインモデル、ユースケース、ユーティリティ関数に対して80%以上のカバレッジ
- **統合テスト**: リポジトリ実装、API Routes、主要フローに対して実施
- **E2Eテスト**: 重要ユーザージャーニーを網羅

### テスト命名規則

- テストファイル: `{対象ファイル名}.test.ts`
- テストケース: `describe('対象クラス/関数名', () => { it('should 期待される動作', () => {}) })`

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### パフォーマンス要件

- Lighthouse スコア: Performance 90+, Accessibility 95+
- First Contentful Paint: 1.5秒以内
- Largest Contentful Paint: 2.5秒以内
- Time to Interactive: 3.5秒以内
- API応答時間: 150ms以内（AI API除く）
- AI API応答時間: 3秒以内（ストリーミング開始時間）

## セキュリティルール

### 認証・認可

- Auth.jsを使用した認証実装
- OAuth2+OIDC準拠の認証フロー
- PKCE拡張の実装
- ユーザー権限のチェックは必ずサーバーサイドで実施

### データアクセス制御

- PostgreSQL Row Level Securityを活用したデータアクセス制御
- リポジトリ層でのセキュリティチェック実装
- セキュアなAPIエンドポイント設計

### 入力検証

- サーバーサイドでの入力検証の徹底
- Zodを使用したスキーマ検証

## ロギング関連の命名規則

### ログレベル

- **ログレベルはすべて大文字で定義**
  ```
  DEBUG, INFO, WARN, ERROR, FATAL
  ```

### ログメッセージ

- **ログメッセージは簡潔かつ情報をコンテキスト含める**
- **エラーログには必ず関連エラー情報を含める**

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

## テスト関連の命名規則

### テストファイル命名

- **テストファイルは対象ファイル名に .test.ts または .spec.ts を付与**
- **E2Eテストには .e2e.ts サフィックスを使用**

### テスト関数命名

- **Jest/Vitest のテスト関数は明確な説明文を使用**
- **テストケースは期待される動作を明確に説明**

### テストファイル構成

- **テストは関連する機能/モジュールごとにグループ化**
- **セットアップとクリーンアップを明確に区分**

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### モック・スタブの命名

- **モックオブジェクトには簡潔で意図が明確な名前を使用**
- **テストデータには役割を表す単純な名前を使用**

## 共通スタイルガイド補足

### コメント規約

- **TODO コメントには担当者と課題番号を含める**
- **FIXMEコメントには具体的な問題点を記述**
- **コードブロックには目的を説明するコメントを付ける**

詳細なコード例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### インポート規約

- **絶対パスを使用したインポート**
  - プロジェクト内のモジュールをインポートする際は、常に絶対パスを使用する

### エラーハンドリング

- プロバイダー固有のエラーを共通の`AIServiceError`型に変換
- レート制限エラーには自動リトライと指数バックオフを実装
- 一時的なサービス障害に対するフェイルオーバー機能の実装

#### 指数バックオフ実装パターン

レート制限や一時的なサービス障害に対応するため、以下の指数バックオフパターンを実装します：

```typescript
/**
 * 指数バックオフを使用してAI API呼び出しをリトライする関数
 * @param operation - 実行する非同期操作
 * @param isRetryable - エラーがリトライ可能かを判定する関数
 * @param options - リトライオプション
 * @returns 操作の結果
 */
async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  isRetryable: (error: Error) => boolean,
  options: {
    maxRetries?: number; // 最大リトライ回数 (デフォルト: 3)
    initialDelayMs?: number; // 初期遅延（ミリ秒）(デフォルト: 1000)
    maxDelayMs?: number; // 最大遅延（ミリ秒）(デフォルト: 60000)
    backoffFactor?: number; // バックオフ係数 (デフォルト: 2)
    jitterFactor?: number; // ジッター係数 (デフォルト: 0.1)
    onRetry?: (error: Error, attempt: number, delayMs: number) => void; // リトライ時のコールバック
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 60000,
    backoffFactor = 2,
    jitterFactor = 0.1,
    onRetry = () => {},
  } = options;

  let attempt = 0;
  let lastError: Error;

  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt >= maxRetries || !isRetryable(lastError)) {
        throw lastError;
      }

      // 指数バックオフ遅延計算（ジッター付き）
      const baseDelay = Math.min(initialDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);

      // ジッター追加（±jitterFactor%のランダム変動）
      const jitter = baseDelay * jitterFactor * (Math.random() * 2 - 1);
      const delayMs = Math.floor(baseDelay + jitter);

      // リトライコールバック実行
      onRetry(lastError, attempt + 1, delayMs);

      // 指定時間待機
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      attempt++;
    }
  }

  throw lastError;
}

// 使用例
async function callAIServiceWithRetry(): Promise<AICompletionResponse> {
  return retryWithExponentialBackoff(
    () => aiService.completion(options),
    (error) => {
      if (error instanceof AIServiceError) {
        // リトライ可能なエラー種別を判定
        return ['rate_limit_exceeded', 'service_unavailable', 'gateway_timeout'].includes(
          error.code
        );
      }
      return false;
    },
    {
      maxRetries: 5,
      initialDelayMs: 2000,
      onRetry: (error, attempt, delay) => {
        logger.warn(
          `AI Service call failed (${(error as AIServiceError).code}). ` +
            `Retrying attempt ${attempt} after ${delay}ms delay.`
        );
      },
    }
  );
}
```

この実装は以下の特徴を持ちます:

- 指数関数的に増加する待機時間によるバックオフ
- ランダムなジッター付加による負荷分散
- 柔軟なリトライ条件の設定
- カスタマイズ可能なパラメータ設定
- リトライ状況を監視するためのコールバック

## UI実装ルール

### RTL対応の実装指針

RTL（Right-to-Left）言語（アラビア語、ヘブライ語など）のサポートは将来の要件ですが、設計段階から考慮する必要があります。以下の実装指針に従ってください。

#### レイアウト制御

1. **方向属性の使用**

   ```tsx
   // 言語に基づいて方向属性を設定
   <html dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}>
   ```

2. **Tailwind CSSのRTLサポート**

   ```tsx
   // 左右の概念を論理プロパティで扱う
   <div className="ml-4 rtl:ml-0 rtl:mr-4">{/* コンテンツ */}</div>
   ```

3. **Flex方向の自動反転**
   ```tsx
   // RTL対応フレックスコンテナ
   const FlexContainer = ({ children, className, ...props }) => {
     const { locale } = useLocale();
     const isRtl = locale === 'ar';

     return (
       <div
         className={`flex ${isRtl ? 'flex-row-reverse' : 'flex-row'} ${className || ''}`}
         {...props}
       >
         {children}
       </div>
     );
   };
   ```

#### コンポーネント対応

1. **アイコン・矢印の反転**

   ```tsx
   // RTL対応アイコン
   const DirectionalIcon = ({ icon: Icon, ...props }) => {
     const { locale } = useLocale();
     const isRtl = locale === 'ar';

     return <Icon className={isRtl ? 'rotate-180 transform' : ''} {...props} />;
   };
   ```

2. **双方向テキスト管理**

   ```tsx
   // 異なる方向のテキストを混在させる場合
   <span dir="ltr">English text</span>
   <span dir="rtl">النص العربي</span>
   ```

3. **スクロールバーの位置調整**

   ```css
   /* RTL用スクロールバー位置調整 */
   [dir='rtl'] .custom-scrollbar {
     left: 0;
     right: auto;
   }

   [dir='ltr'] .custom-scrollbar {
     right: 0;
     left: auto;
   }
   ```

#### テストと検証

1. **RTL専用テストケース**

   ```typescript
   // RTLモード専用のテストケース
   describe('Component in RTL mode', () => {
     beforeEach(() => {
       // RTLモードで設定
       mockUseLocale.mockReturnValue({ locale: 'ar', isRtl: true });
     });

     it('should flip layout direction', () => {
       render(<Component />);
       // RTL固有の検証
     });
   });
   ```

2. **視覚的リグレッションテスト**
   - スナップショットテストでRTLモードを検証
   - 複数言語環境での自動視覚テスト設定

#### RTL移行戦略

RTL対応は以下の段階で実装します：

1. **準備段階（現在）**

   - `dir`属性をサポートする基本構造の実装
   - 論理プロパティを優先使用（`margin-inline-start`など）
   - CSS変数による方向依存値の抽象化

2. **部分的実装（必要に応じて）**

   - 主要コンポーネントのRTL対応
   - ナビゲーションとレイアウト構造の反転サポート
   - テスト環境でのRTL検証

3. **完全実装（RTL言語追加時）**
   - 全UIコンポーネントのRTL対応完了
   - 文字方向混在時の細かな調整
   - 完全なアクセシビリティ検証

これらの指針は、01_requirements_definition.mdの「国際化対応（i18n）機能」要件と02_architecture_design.mdの「RTL（右から左への記述）言語サポート」アーキテクチャ設計に基づいています。
