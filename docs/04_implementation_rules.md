# 実装ルール・命名規則

最終更新日: 2025-04-03

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

> **注意**: 具体的なコード例については、`code_examples/04_implementation_rules_examples.md` ([./code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)) を参照してください。

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
- インポート順序の管理
- レイヤー間の依存関係制約
- ファイル種別に応じた特別ルール

詳細な設定例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### 自動フォーマット

Prettierを使用して以下のフォーマットを自動適用します：
- セミコロン、引用符、インデント、行の長さなどのスタイル統一
- 改行、空白、括弧などの一貫したフォーマット

詳細な設定例は[code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)を参照してください。

### Enum 定義ルール (新規)

- **Enum 名:** PascalCase で定義します。
  - 例: `UserRole`, `ProgramStatus`
- **メンバー名:** PascalCase で定義します。これは ESLint ルール (`@typescript-eslint/naming-convention` の `enumMember`) によって強制されます。
  - 例: `Admin`, `Public`, `Initial`
- **値:** 文字列リテラルを使用し、通常は `UPPER_SNAKE_CASE` で定義します。
  - 例: `Admin = 'ADMIN'`, `Public = 'PUBLIC'`
  - **例外:** 外部の仕様や標準（例: API のレスポンス、ISO コード）に合わせる必要がある場合は、その形式に従います。コメントで理由を明記してください。
    - 例 (`AIModelType`): `Gpt4o = 'gpt-4o'` // OpenAI API のモデル名に合わせる
    - 例 (`SupportedLanguage`): `Ja = 'ja'` // ISO 639-1 言語コード
- **ファイル名:** ドメインに関連する場合は `domain/models/{domain}/{enum-name}.enum.ts`、共有の場合は `shared/enums/{enum-name}.enum.ts` という形式で、kebab-case を使用します。
- **JSDoc:** Enum 自体とその各メンバーに、目的や意味を説明する JSDoc コメントを必ず付与します。`@enum`, `@property` タグを使用します。

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
  
  return (
    <button type="submit">
      {t('button.submit')}
    </button>
  );
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
  params: { locale }
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

[dir="rtl"] {
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
      className={isRtl && requiresFlipping(icon) ? 'transform rotate-180' : ''} 
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
  return <span>{bidiMarker}{text}</span>;
}
```

##### 5. テスト要件

- 国際化に関連するテスト要件は[09_testing_implementation.md](09_testing_implementation.md)を参照してください。

#### 型安全な翻訳

エラーコードとエラー型の定義は`05_type_definitions.md` ([../05_type_definitions.md](05_type_definitions.md)) に集約されています。各レイヤーで使用するエラーコードの定義方法、エラーハンドリングのパターン、およびエラーレスポンスの構造については、型定義文書および本ドキュメントの「エラーハンドリング実装ルール」セクションを参照してください。

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

詳細な実装例は`code_examples/04_implementation_rules_examples.md` ([./code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)) を参照してください。

## プロジェクト構造

### ディレクトリ構造

`02_architecture_design.md` ([../02_architecture_design.md](02_architecture_design.md)) の記載に基づく正確なディレクトリ構造を採用します。主な構造は以下の通りです：

- **app/**: Next.js App Router（ページとルーティング）
- **domain/**: ドメイン層（モデル、サービス、イベント、リポジトリインターフェース）
- **application/**: アプリケーション層（DTOs、ユースケース）
- **infrastructure/**: インフラストラクチャ層（データベース、マッパー、外部サービス連携）
- **presentation/**: プレゼンテーション層（UI コンポーネント）
- **shared/**: 共有リソース（ユーティリティ、定数）
- **config/**: アプリケーション設定 (`tsyringe` のコンテナ設定などを含む)
- **tests/**: テスト (`09_testing_implementation.md` ([../09_testing_implementation.md](09_testing_implementation.md)) で詳細定義)
- **i18n/**: 国際化リソース

この構造では、`src/` ディレクトリを挟まずに、直接ルートディレクトリ下に各レイヤーのディレクトリを配置します。これにより、インポートパスがシンプルになり、コードの可読性と保守性が向上します。

詳細な構造例は`code_examples/04_implementation_rules_examples.md` ([./code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)) を参照してください。

## 命名規則

### ファイル命名規則

| ファイルタイプ | 命名規則 | 例 |
|--------------|---------|-----|
| Reactコンポーネント | PascalCase.tsx | Button.tsx, UserCard.tsx |
| ページコンポーネント | page.tsx | page.tsx (app/projects/page.tsx) |
| レイアウトコンポーネント | layout.tsx | layout.tsx (app/layout.tsx) |
| APIルート | route.ts | route.ts (app/api/users/route.ts) |
| ユーティリティ | kebab-case.ts | format-date.ts, string-utils.ts |
| | | またはディレクトリ + index.ts (例: date-utils/) |
| 型定義 | kebab-case.ts | user-types.ts, api-types.ts (shared/types/ 内) |
| エンティティ | {ドメイン名}.entity.ts | user.entity.ts, program.entity.ts (domain/models/{ドメイン名}/ 内) |
| 値オブジェクト | {値オブジェクト名}.vo.ts (kebab-case) | user-id.vo.ts, email.vo.ts (domain/models/{ドメイン名}/ 内) |
| リポジトリインターフェース | kebab-case.repository.interface.ts | user.repository.interface.ts (domain/repositories/ 内) |
| リポジトリ実装 | kebab-case.repository.ts | user.repository.ts (infrastructure/database/repositories/ 内) |
| ユースケース | kebab-case.usecase.ts | create-user.usecase.ts (application/usecases/ 内) |
| DTO | kebab-case.dto.ts | user.dto.ts (application/dtos/ 内) |
| マッパー | kebab-case.mapper.ts | user.mapper.ts (infrastructure/mappers/ 内) |
| QueryObject/ReadModel | kebab-case.query.ts / kebab-case.read-model.ts | user-projects.query.ts, active-users.read-model.ts |
| テストファイル | {対象ファイル名}.test.ts | user.entity.test.ts, format-date.test.ts |
| 定数ファイル | camelCase.ts | appConstants.ts, errorCodes.ts |
| カスタムフック | use{名詞}.ts (kebab-case も可) | use-auth.ts, use-form-validation.ts |
| 言語リソースファイル | {言語コード}.json | en.json, ja.json |
| 翻訳ユーティリティ | i18n-{機能}.ts | i18n-config.ts, i18n-utils.ts |
| 事例データモデル | {モデル}.entity.ts, {モデル}.dto.ts | case-study.entity.ts, analysis-result.dto.ts |
| 分析アルゴリズム | {機能}.algorithm.ts | similarity.algorithm.ts, risk-evaluation.algorithm.ts |
| DIコンテナ設定 | container.config.ts | container.config.ts (config/ 内) |
| 状態管理Context | {コンテキスト名}.context.tsx (kebab-case) | auth.context.tsx, theme.context.tsx |

### ディレクトリ命名規則

| ディレクトリタイプ | 命名規則 | 例 |
|-----------------|---------|-----|
| 機能モジュール | kebab-case | program-management/, user-profiles/ |
| Reactコンポーネント | kebab-case | common/, program/, project/ |
| テストディレクトリ | camelCase | unit/, integration/, e2e/ |
| app内ルートグループ | (kebab-case) | (auth)/, (dashboard)/ |
| Query/ReadModel | queries/ / read-models/ | infrastructure/queries/, application/read-models/ |
| 言語リソース | i18n/ | i18n/locales/, i18n/config/ |
| 歴史的事例関連 | case-studies/, historical-data/ | case-studies/algorithms/, historical-data/models/ |

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
   - 依存性の注入（DI）を活用し、モジュール間の結合度を低く保つ

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

エラーコードとエラー型の定義は`05_type_definitions.md` ([../05_type_definitions.md](05_type_definitions.md)) に集約されています。各レイヤーで使用するエラーコードの定義方法、エラーハンドリングのパターン、およびエラーレスポンスの構造については、型定義文書および本ドキュメントの「エラーハンドリング実装ルール」セクションを参照してください。

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
   - **QueryObject/ReadModel**: 複雑なクエリや集計、結合を要する読み取り操作。通常、`infrastructure/queries` または `application/read-models` に配置する。
     - 例: `UserProjectsStatisticsQuery`, `ActiveUsersSummaryReadModel`
   - **ApplicationService**: 複数リポジトリを跨ぐ操作や業務ロジック。`application/services` または `application/usecases` に配置。
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

**上記以外の複雑な操作はリポジトリの責務外**とし、適切な代替パターン（QueryObject、ReadModel、ApplicationService）に委譲してください。QueryObject/ReadModel はリード（読み取り）操作に特化し、複雑なデータ取得ロジックをカプセル化します。

#### リポジトリインターフェース定義

リポジトリインターフェースはドメインレイヤーに定義され、永続化の詳細から独立したデータアクセスのためのコントラクトを提供します。詳細な型定義と実装パターンについては`05_type_definitions.md#リポジトリインターフェース型` ([../05_type_definitions.md](05_type_definitions.md)) を参照してください。

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

AI関連のコードは主に `lib/ai/` ディレクトリ以下に配置します。

```
/lib
  /ai
    /providers                # 各AIプロバイダー固有の実装
      /openai
        openai-service.ts     # OpenAIサービスクラス
        openai-config.ts      # OpenAI設定
        openai-types.ts       # OpenAI固有の型定義
      /anthropic
        # ... (Anthropicも同様)
      /google
        # ... (Googleも同様)
      /open-source
        # ... (オープンソースモデルも同様)
    ai-service-interface.ts   # 全プロバイダー共通のインターフェース定義
    ai-service-factory.ts     # プロバイダー選択とインスタンス生成
    ai-service-registry.ts    # (オプション) サービスインスタンス管理
    ai-types.ts               # プロバイダー共通の型定義 (リクエスト/レスポンス形式など)
    ai-constants.ts           # AI関連の定数 (モデル名、デフォルト設定など)
    index.ts                  # lib/ai モジュールの公開インターフェース
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
   - `AIServiceRegistry` - (オプション) サービスインスタンス管理レジストリ
   - `AIModelCapabilityRegistry` - (オプション) モデル能力情報レジストリ

**エラー処理**

1.  **統一されたエラー型**:
    *   すべてのAIサービス実装は、共通のエラー型 `AIServiceError`
2.  **リトライ戦略**:
    *   一時的なネットワークエラーやレート制限エラー（プロバイダーが示す場合）に対しては、指数バックオフを用いた自動リトライメカニズムを `AIService` の実装またはラッパーで提供する。
    *   リトライ回数や最大待機時間は設定可能にする (`config/`)。
3.  **フォールバック戦略**:
    *   主要なプロバイダー（例: OpenAI）で永続的なエラーが発生した場合、設定された優先順位 (`config/ai.ts` などで定義) に基づいて自動的に次のプロバイダー（例: Anthropic）にフォールバックする機能を `AIServiceFactory` または上位のサービスで実装する。
    *   フォールバック発生時には、適切なログ記録と、必要に応じてユーザーへの通知（例: 「現在、代替AIで処理中です」）を行う。
    *   すべてのプロバイダーが利用不可の場合、定義された最終的なエラー (`AIErrorCode.ALL_PROVIDERS_UNAVAILABLE` など) を返す。
4.  **タイムアウト管理**:
    *   各AIプロバイダーへのリクエストには適切なタイムアウト値を設定する。タイムアウト値は設定可能にする (`config/`)。
    *   タイムアウト発生時は `AIErrorCode.TIMEOUT` を含む `AIServiceError` を返す。

**インターフェース定義 (`ai-service-interface.ts`)**

主要なメソッドとして以下を定義します。ストリーミングと非ストリーミングの両方をサポートします。

```typescript
import { Result } from '@/shared/utils/result';
import { AIServiceError } from '@/lib/ai/ai-types'; // 型定義は 05_type_definitions.md 参照

export interface AIServiceInterface {
  /**
   * テキスト補完を実行します (非ストリーミング)。
   * @param prompt プロンプト文字列
   * @param options 補完オプション (モデル、温度設定など)
   * @returns Result<AICompletionResponse, AIServiceError>
   */
  getCompletion(
    prompt: string,
    options?: AICompletionOptions
  ): Promise<Result<AICompletionResponse, AIServiceError>>;

  /**
   * テキスト補完をストリーミングで実行します。
   * @param prompt プロンプト文字列
   * @param options 補完オプション
   * @returns AsyncGenerator<Result<AIStreamingChunk, AIServiceError>>
   */
  streamCompletion(
    prompt: string,
    options?: AICompletionOptions
  ): AsyncGenerator<Result<AIStreamingChunk, AIServiceError>>;

  // 必要に応じて他のメソッドを追加 (例: 埋め込み生成、画像生成など)
  // getEmbeddings(text: string): Promise<Result<EmbeddingVector, AIServiceError>>;
}
```

**具体的な実装例**

詳細な実装例は `code_examples/04_implementation_rules_examples.md` ([./code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)) を参照してください。

### 依存性注入 (`tsyringe`) の活用方針

本プロジェクトでは、モジュール間の依存関係を管理し、テスト容易性を向上させるために、`tsyringe` を依存性注入 (DI) コンテナとして利用します。

**基本方針**

1.  **コンストラクタインジェクションを基本とする**: 依存性はクラスのコンストラクタを通じて注入します。
2.  **インターフェースに対するプログラミング**: 具象クラスではなく、インターフェース（抽象）に依存するように設計します。DIコンテナが実行時に適切な具象クラスを注入します。
3.  **適用範囲**: 主にアプリケーション層 (`application/`) とインフラストラクチャ層 (`infrastructure/`) で利用します。ドメイン層のエンティティや値オブジェクトには通常適用しません。プレゼンテーション層（Reactコンポーネント）への適用は限定的にします（例: グローバルサービスの注入）。

**設定 (`config/container.ts`)**

*   DIコンテナの設定と登録は `config/container.ts` に集約します。
*   モジュールごとに設定ファイルを分割することも可能です（例: `config/auth.container.ts`）。
*   インターフェース（トークン）と具象クラスのマッピングを定義します。
*   ライフサイクル（`Lifecycle.Singleton`, `Lifecycle.Transient` など）を適切に設定します。

```typescript
// config/container.ts
import { container, Lifecycle } from 'tsyringe';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { SupabaseUserRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { AuthService } from '@/application/services/AuthService';
// ... 他の依存関係のインポート

// リポジトリの登録 (インターフェース UserRepository に対して SupabaseUserRepository を注入)
container.register<UserRepository>('UserRepository', {
  useClass: SupabaseUserRepository,
});
// ライフサイクルを指定する場合 (Singleton)
// container.register<UserRepository>('UserRepository', {
//   useClass: SupabaseUserRepository,
// }, { lifecycle: Lifecycle.Singleton });

// アプリケーションサービスの登録
container.register<AuthService>('AuthService', {
  useClass: AuthService,
});

// AIServiceInterface の登録 (Factory経由)
import { AIServiceFactory } from '@/lib/ai/ai-service-factory';
import { AIServiceInterface } from '@/lib/ai/ai-service-interface';

container.register<AIServiceInterface>('AIServiceInterface', {
    useFactory: (dependencyContainer) => {
        // Factoryに必要な依存があればここで解決
        // const config = dependencyContainer.resolve<AppConfig>('AppConfig');
        return AIServiceFactory.create(); // 環境変数等に基づいて適切な実装を返す
    }
});


export default container;
```

**利用方法**

1.  **注入されるクラス (`@injectable`)**: DIコンテナによってインスタンス化され、注入されるクラスには `@injectable()` デコレータを付与します。

    ```typescript
    // infrastructure/repositories/SupabaseUserRepository.ts
    import { injectable, inject } from 'tsyringe';
    import { UserRepository } from '@/domain/repositories/UserRepository';
    import { SupabaseClient } from '@supabase/supabase-js'; // 仮

    @injectable()
    export class SupabaseUserRepository implements UserRepository {
      // SupabaseClient など、さらに依存があれば注入できる
      constructor(@inject('SupabaseClient') private supabase: SupabaseClient) {}
      // ... リポジトリの実装 ...
    }
    ```

2.  **依存性を注入するクラス (`@inject`)**: コンストラクタで依存性を受け取るクラスでは、引数に `@inject(トークン)` デコレータを使用します。トークンは通常、インターフェース名を文字列として使用します。

    ```typescript
    // application/services/AuthService.ts
    import { injectable, inject } from 'tsyringe';
    import { UserRepository } from '@/domain/repositories/UserRepository';
    import { User } from '@/domain/models/User'; // 仮

    @injectable()
    export class AuthService {
      constructor(
        @inject('UserRepository') private userRepository: UserRepository
        // @inject('AIServiceInterface') private aiService: AIServiceInterface // 他のサービスも注入可能
      ) {}

      async findUserById(userId: string): Promise<User | null> {
        // 注入されたリポジトリを使用
        return this.userRepository.findById(userId);
      }
      // ... 認証関連のメソッド ...
    }
    ```

3.  **インスタンスの取得**: アプリケーションのエントリーポイント（例: API Route ハンドラ、サーバーコンポーネント）でコンテナからルートとなるインスタンスを取得します。

    ```typescript
    // app/api/users/[id]/route.ts
    import container from '@/config/container';
    import { AuthService } from '@/application/services/AuthService';
    import { NextRequest, NextResponse } from 'next/server';

    // コンテナから AuthService インスタンスを取得
    const authService = container.resolve(AuthService);

    export async function GET(
      request: NextRequest,
      { params }: { params: { id: string } }
    ) {
      const userId = params.id;
      const user = await authService.findUserById(userId); // 解決されたインスタンスを使用

      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }
      return NextResponse.json(user);
    }
    ```

**注意点**

*   循環依存を避けるように設計してください。
*   デコレータを使用するため、`tsconfig.json` で `emitDecoratorMetadata` と `experimentalDecorators` を有効にする必要があります。
*   テスト時には、`container.registerInstance` などを使用して依存性をモックに差し替えることが容易になります ([`09_testing_implementation.md`](../09_testing_implementation.md) で詳細)。

### 状態管理 (React Context + TanStack Query) の方針

フロントエンドの状態管理は、サーバーキャッシュ状態とクライアントUI状態を区別し、それぞれの特性に合わせて React Context API と TanStack Query (React Query) を組み合わせて利用します。

**役割分担**

1.  **TanStack Query (React Query)**:
    *   **責務**: サーバー状態のキャッシュ、非同期データフェッチ、更新、無効化。API から取得するデータ（プロジェクト一覧、ユーザー情報、ステップ情報など）の管理。
    *   **主な機能**: `useQuery`, `useMutation`, `queryClient` を利用。
    *   **配置**: データフェッチロジックはカスタムフック (`hooks/queries/`) やリポジトリパターン（クライアントサイド）にカプセル化することを推奨。
2.  **React Context API**:
    *   **責務**: グローバルなクライアントUI状態、認証状態、テーマ設定、言語設定など、複数のコンポーネントで共有され、サーバー状態とは直接関連しない状態の管理。
    *   **主な機能**: `createContext`, `useContext`, `useState`, `useReducer` を利用。
    *   **配置**: 機能ごとの Context を作成 (`contexts/`) し、必要な範囲で Provider を配置。

**利用パターン**

1.  **データフェッチ**:
    *   サーバーからデータを取得する場合は、常に TanStack Query の `useQuery` を使用します。
    *   データ取得ロジックはカスタムフックにまとめます。例: `useProjectsQuery()`, `useUserProfileQuery(userId)`。
    *   `queryKey` の命名規則を定め、一貫性を保ちます (`['projects', { filter }]`, `['users', userId]` など)。
    *   初期データ (`initialData`) や `staleTime`, `cacheTime` を適切に設定し、パフォーマンスを最適化します。
2.  **データ更新**:
    *   サーバー上のデータを更新する場合は、TanStack Query の `useMutation` を使用します。
    *   `onSuccess` や `onError` コールバック内で `queryClient.invalidateQueries` や `queryClient.setQueryData` を使用し、関連するクエリのキャッシュを更新・無効化します。
3.  **グローバルUI状態**:
    *   認証情報（ユーザーオブジェクト、ログイン状態など）、テーマ（ライト/ダーク）、選択言語などは React Context で管理します。
    *   `AuthContext`, `ThemeContext`, `LocaleContext` などを定義し、`_app.tsx` や共通レイアウトで Provider を設定します。
    *   状態更新ロジックが複雑な場合は `useReducer` を利用します。
4.  **コンポーネントローカル状態**:
    *   特定のコンポーネントまたはその子コンポーネントのみで使用される一時的なUI状態（フォーム入力値、モーダルの開閉状態など）は `useState` を使用します。Context や TanStack Query に不必要に入れるべきではありません。

**サーバーコンポーネントとの連携**

*   サーバーコンポーネント内で取得したデータをクライアントコンポーネントに渡す場合、TanStack Query の `initialData` オプションを活用して、クライアントサイドでの初期レンダリング時の不要なデータフェッチを避けます。
*   クライアントコンポーネントで使用する Context Provider は、その Context を利用するクライアントコンポーネント群をラップする、最も近い共通の親クライアントコンポーネントまたはレイアウトに配置します。

**`'use client'` の使用範囲**

*   TanStack Query のフック (`useQuery`, `useMutation`) や React Context の `useContext` を使用するコンポーネント、および `useState`, `useEffect` などのクライアントサイドフックを利用するコンポーネントには `'use client'` ディレクティブが必要です。
*   `'use client'` の境界をできるだけコンポーネントツリーの末端（Leaf Components）に近づけるように設計し、サーバーコンポーネントの利点を最大限に活かします。状態やインタラクションが必要な部分のみをクライアントコンポーネントとして切り出します。

**注意点**

*   Context の Provider の範囲を適切に設定し、不要な再レンダリングを避けます。`React.memo` や `useCallback`, `useMemo` を適宜利用します。
*   TanStack Query の `queryClient` はアプリケーション全体で一つのインスタンスを共有します。通常、`_app.tsx` や共通レイアウトで `QueryClientProvider` を設定します。

詳細な実装例は `code_examples/04_implementation_rules_examples.md` ([./code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)) を参照してください。

### エラーハンドリング実装ルール

アプリケーション全体で一貫したエラーハンドリングを行い、堅牢性とユーザー体験を向上させるため、以下のルールを適用します。

**基本方針**

1.  **`Result` 型の活用**: 関数やメソッドが失敗する可能性がある場合、原則として `Result<T, E extends AppError>` 型 ([`06_utility_functions.md`](../06_utility_functions.md) で定義) を返り値として使用し、成功 (`Ok`) または失敗 (`Err`) を明示的に表現します。これにより、例外処理の強制と型安全なエラーハンドリングを実現します。
2.  **例外 (`throw`) の限定的使用**: `Result` 型で表現できない致命的なエラー（設定不備、回復不能な内部状態など）や、フレームワークが予期する特定の例外（Next.js の `notFound()` など）を除き、予期されるエラー処理のために安易に例外をスローしません。
3.  **エラー型の統一**: アプリケーション固有のエラーは、`AppError` ([`05_type_definitions.md#共通エラー型`](../05_type_definitions.md)) を基底クラスとし、具体的なエラー種別を示す `ErrorCode` ([`05_type_definitions.md#エラーコード`](../05_type_definitions.md)) を含めます。外部ライブラリやAPIのエラーは、適切な `AppError` にラップまたは変換します。
4.  **レイヤー間のエラー伝播**: 下位レイヤー（インフラ層、ドメイン層）で発生したエラーは、`Result` 型を通じて上位レイヤー（アプリケーション層、プレゼンテーション層）に伝播させます。上位レイヤーは受け取った `Result` を検証し、適切に処理（エラー変換、ログ記録、ユーザー通知など）します。

**実装パターン**

1.  **関数の返り値**:
    ```typescript
    import { Result, ok, err } from '@/shared/utils/result';
    import { AppError, ErrorCode } from '@/shared/types/errors'; // 05_type_definitions.md

    async function fetchProject(projectId: string): Promise<Result<Project, AppError>> {
      try {
        const response = await fetch(`/api/projects/${projectId}`);
        if (!response.ok) {
          if (response.status === 404) {
            return err(new AppError(ErrorCode.PROJECT_NOT_FOUND, `Project ${projectId} not found`));
          }
          // 他のステータスコードに応じたエラー処理
          return err(new AppError(ErrorCode.API_REQUEST_FAILED, `Failed to fetch project: ${response.statusText}`));
        }
        const project: Project = await response.json();
        return ok(project);
      } catch (error) {
        // ネットワークエラーなど
        return err(new AppError(ErrorCode.NETWORK_ERROR, 'Network error occurred', { cause: error }));
      }
    }
    ```
2.  **`Result` の処理**:
    ```typescript
    const projectResult = await fetchProject('some-id');

    if (projectResult.isErr()) {
      const error = projectResult.error;
      // エラーの種類に応じた処理
      logger.error(`Failed to fetch project: ${error.message}`, { code: error.code, cause: error.cause });

      if (error.code === ErrorCode.PROJECT_NOT_FOUND) {
        // ユーザーに「プロジェクトが見つかりません」と表示
        showNotFoundError();
      } else {
        // 一般的なエラーメッセージを表示
        showGenericError();
      }
      return; // エラー発生時は処理を中断
    }

    // 成功した場合のみ値を使用
    const project = projectResult.value;
    displayProject(project);
    ```
3.  **エラー変換**: 下位レイヤーのエラーを上位レイヤーでより抽象的なエラーに変換する必要がある場合。
    ```typescript
    async function updateUserProfile(userId: string, data: UpdateProfileDTO): Promise<Result<void, AppError>> {
      const repoResult = await userRepository.update(userId, data); // リポジトリは DB固有エラーを返す可能性
      if (repoResult.isErr()) {
        const dbError = repoResult.error;
        if (dbError.code === ErrorCode.DB_UNIQUE_CONSTRAINT_VIOLATION) {
          // DBエラーをビジネスロジックエラーに変換
          return err(new AppError(ErrorCode.USER_EMAIL_ALREADY_EXISTS, 'Email already exists'));
        }
        // その他のDBエラーは汎用的なエラーとしてそのまま伝播させるか、別のコードに変換
        return err(new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update user profile', { cause: dbError }));
      }
      return ok(undefined);
    }
    ```
4.  **ロギング**:
    *   エラーが発生した箇所（`Result` が `Err` であった場合）で、エラー情報をログに記録します。`logger` ユーティリティ ([`06_utility_functions.md`](../06_utility_functions.md)) を使用します。
    *   ログには、`ErrorCode`、エラーメッセージ、可能であれば発生元のスタックトレースやコンテキスト情報 (`cause`) を含めます。
    *   ユーザーに見せるエラーメッセージと、ログに残す詳細な技術的エラー情報を区別します。機密情報はログ記録前にマスクします。
    *   エラーの重要度に応じてログレベル（`error`, `warn`, `info`）を使い分けます。
5.  **ユーザーへの通知 (UI レイヤー)**:
    *   プレゼンテーション層（React コンポーネント）で `Result` を受け取り、エラーが発生した場合はユーザーフレンドリーなメッセージを表示します。
    *   エラーコード (`ErrorCode`) に基づいて、表示するメッセージやUIの挙動を制御します。
    *   `toast` 通知、フォームのエラーメッセージ表示、専用のエラーページへのリダイレクトなど、状況に応じた適切なフィードバック方法を選択します。
    *   技術的なエラー詳細はユーザーに見せず、代わりに参照可能なエラーIDなどを表示してサポートを依頼する形式を検討します。

**注意点**

*   非同期処理 (`async/await`) 内でも `Result` 型を適切に扱い、`Promise` が `reject` される状況を極力減らします。
*   `Result` 型の導入により冗長に見える箇所もありますが、エラー処理の強制とコードの堅牢性向上を優先します。ユーティリティ関数 ([`06_utility_functions.md`](../06_utility_functions.md)) を活用して記述を簡潔に保ちます。

### Next.js 開発規約

- API Routesは機能ドメイン別にグループ化

#### サーバーコンポーネントとクライアントコンポーネント間のデータ受け渡し

Next.js App Router におけるサーバーコンポーネント (Server Components, SC) とクライアントコンポーネント (Client Components, CC) の連携においては、以下のルールに従います。

1.  **Props 経由のデータ受け渡し**:
    *   SC から CC へデータを渡す基本的な方法は Props を利用します。
    *   **シリアライズ可能なデータのみ**: SC から CC へ Props として渡せるのは、JSON としてシリアライズ可能なデータ型のみです（文字列、数値、真偽値、プレーンオブジェクト、配列など）。`Date`, `Map`, `Set`, 関数、クラスインスタンスなどは直接渡せません。
    *   **変換**: シリアライズ不可能なデータ（例: `Date` オブジェクト）は、SC 側で文字列や数値（タイムスタンプ）に変換してから CC へ渡します。CC 側で必要に応じて元の型に復元します。ドメインオブジェクトなども DTO に変換してから渡すのが基本です。
    *   **機密情報**: パスワードハッシュなど、クライアントに公開すべきでない情報は Props として渡さないでください。
2.  **Server Actions の活用**:
    *   クライアント側のインタラクション（フォーム送信、ボタンクリックなど）に応じてサーバー側の処理（データ更新、AI 呼び出しなど）を実行したい場合は、Server Actions を積極的に利用します。
    *   Server Actions は SC または CC から呼び出し可能で、シリアライズ可能な引数と戻り値を使用します。
    *   フォーム送信と組み合わせることで、JavaScript が無効な環境でも機能するプログレッシブエンハンスメントを実現しやすくなります。
    *   Server Actions 内での状態更新後は、`revalidatePath` や `revalidateTag` を使用して関連データのキャッシュを更新します。
3.  **Props Drilling の回避**:
    *   深い階層の CC にデータを渡すために Props をバケツリレーするのは避けます。
    *   グローバルに近い状態や複数の離れたコンポーネントで共有される状態は、React Context API ([「状態管理の方針」](#状態管理-react-context--tanstack-query-の方針)参照) を利用し、必要な CC から直接アクセスできるようにします。Provider は `'use client'` 境界の内側に配置します。
4.  **サーバーコンポーネントのクライアントキャッシュ (`initialData`)**:
    *   SC で取得したデータを、そのデータを必要とする CC の TanStack Query (`useQuery`) の `initialData` として渡すことで、クライアントでの初期ロード時の不要な再フェッチを防ぎます。

詳細な実装例は `code_examples/04_implementation_rules_examples.md` ([./code_examples/04_implementation_rules_examples.md](code_examples/04_implementation_rules_examples.md)) を参照してください。

## 品質保証

- Next.jsのサーバーコンポーネントとAPI Routesのテスト方法標準化 ([`09_testing_implementation.md`](../09_testing_implementation.md) で詳細定義)

## ドキュメント管理

- 障害対応手順書 ([`10_deployment_implementation.md`](../10_deployment_implementation.md) の一部)

## エラーハンドリング

エラーハンドリングはアプリケーションの堅牢性と保守性を高める上で非常に重要です。以下のルールに従って一貫性のあるエラー処理を実装してください。

### 1. `Result` 型の使用

- 失敗する可能性のある操作（特に非同期操作、I/O、バリデーション）の戻り値には、`neverthrow` ライブラリの `Result<T, E extends AppError>` 型を使用します。
- これにより、成功 (`Ok`) と失敗 (`Err`) の両方のケースを明示的に型レベルで表現し、`try-catch` に頼らないエラー処理を促進します。
- **ルール:** `Result` のエラー型 `E` には、必ず `AppError` またはそのサブクラスを指定します。`Error` 型を直接使用しないでください。

```typescript
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@/shared/errors/app.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

// OK例: AppError を使用
async function fetchData(): Promise<Result<Data, AppError>> {
  try {
    const data = await externalApi.get();
    return ok(data);
  } catch (error) {
    return err(new AppError(ErrorCode.ApiRequestFailed, 'Failed to fetch data', { cause: error }));
  }
}

// NG例: Error を直接使用
// async function fetchDataBad(): Promise<Result<Data, Error>> { ... }
```

### 2. `AppError` と `ErrorCode`

- アプリケーション固有のエラーは、`shared/errors/app.error.ts` に定義された `AppError` クラス、またはそのサブクラスを使用します。
- **ルール:** すべての `AppError` インスタンスには、`shared/errors/error-code.enum.ts` で定義された `ErrorCode` を必ず指定します。
- `ErrorCode` はエラーの種類を分類し、ログ分析やエラーに応じた処理分岐を容易にします。
- 必要に応じて、エラーの原因となった元のエラーオブジェクトを `cause` プロパティに、追加情報を `metadata` プロパティに含めます。

```typescript
// AppError の使用例
if (conditionFails) {
  return err(new AppError(ErrorCode.DomainRuleViolation, 'Specific domain rule violated.'));
}

try {
  // ... DB 操作 ...
} catch (dbError) {
  return err(new AppError(ErrorCode.DatabaseError, 'Database operation failed.', { 
    cause: dbError,
    metadata: { query: 'SELECT ...', params: [...] }
  }));
}
```

### 3. `ValidationError`

- 入力値のバリデーション（APIリクエスト、フォーム入力など）や値オブジェクトの生成時のバリデーションに失敗した場合は、`shared/errors/validation.error.ts` に定義された `ValidationError` を使用します。
- `ValidationError` は `AppError` のサブクラスであり、`ErrorCode.ValidationError` が自動的に設定されます。
- **ルール:** `ValidationError` を生成する際は、`metadata` に可能な限り詳細な情報（バリデーション対象の値 `value`、検証箇所 `validationTarget`、元のバリデーションエラー `cause` など）を含めてください。
- 値オブジェクトの `create` 静的メソッドは、バリデーション失敗時に `Result<VO, ValidationError>` を返す必要があります。

```typescript
// ValidationError の使用例 (Value Object)
import { Result, ok, err } from 'neverthrow';
import { ValidationError } from '@/shared/errors/validation.error';

class Email {
  // ...
  public static create(email: unknown): Result<Email, ValidationError> {
    if (typeof email !== 'string' || !email.includes('@')) {
      return err(new ValidationError('Invalid email format', {
         value: email,
         validationTarget: 'ValueObject',
         metadata: { valueObjectName: 'Email' }
       }));
    }
    return ok(new Email(email));
  }
}
```

### 4. `try-catch` の使用

- 基本的に `Result` 型でエラーを伝播させることを推奨しますが、予期せぬエラー（ライブラリ内部のエラーなど）をキャッチする必要がある場合は `try-catch` を使用します。
- **ルール:** `catch` ブロックで捕捉したエラーは、必ず `AppError` でラップし、適切な `ErrorCode`（多くの場合 `ErrorCode.InternalServerError` や関連するエラーコード）と `cause` を設定して再スローするか、`Result.err` として返却します。捕捉したエラーをそのまま放置したり、`console.error` だけで済ませたりしないでください。

```typescript
// try-catch で捕捉したエラーを AppError でラップする例
try {
  const result = someLibrary.doSomething();
} catch (error) {
  // 適切な ErrorCode と cause を設定して AppError を返す
  return err(new AppError(
    ErrorCode.InternalServerError, 
    'Unexpected error in someLibrary', 
    { cause: error }
  ));
  // または throw new AppError(...); も状況に応じて可
}
```

### 5. API エラーレスポンス

- API ルートハンドラー (`app/api/.../route.ts`) で発生したエラー（ユースケースから返された `AppError` や Zod バリデーションエラーなど）は、`shared/utils/api.utils.ts` の `handleApiError` 関数によって処理され、標準化された JSON 形式のエラーレスポンスに変換されます。
- `handleApiError` は `AppError` の `ErrorCode` に基づいて適切な HTTP ステータスコードを決定します。
- **ルール:** API ルートハンドラー内で直接 `NextResponse.json(...)` を使ってエラーレスポンスを生成せず、原則として `AppError` をスローするか `Result.err(AppError)` を返却し、`handleApiError` に処理を委譲してください。

## API 設計ルール

// ... (以降の内容)
