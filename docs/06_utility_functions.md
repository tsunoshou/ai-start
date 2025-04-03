# 06. 共通ユーティリティ関数作成

**最終更新日:** 2025-04-03

## 本ドキュメントの目的

本ドキュメントは、AiStartプロジェクト全体で再利用可能な共通ユーティリティ関数の設計原則、分類、作成ガイドライン、および配置場所について定めます。コードの重複を削減し、保守性と一貫性を高めることを目的とします。

## 設計原則

共通ユーティリティ関数を作成・利用する際には、以下の原則に従います。

1.  **純粋性 (Purity)**: 可能な限り純粋関数（同じ入力に対して常に同じ出力を返し、副作用を持たない関数）として実装します。これにより、テスト容易性と予測可能性が向上します。
2.  **単一責任の原則 (Single Responsibility Principle, SRP)**: 各ユーティリティ関数は、明確に定義された単一の責任を持つべきです。
3.  **依存性の最小化**: 外部ライブラリや特定のフレームワークへの依存を最小限に抑えます。特に、ドメイン層やアプリケーション層の知識に依存しないように注意します。
4.  **明確な命名**: 関数の目的が名前から明確に理解できるように、具体的かつ一貫性のある命名規則（`04_implementation_rules.md` 参照）に従います。
5.  **テスト容易性**: ユーティリティ関数は単体テストが容易であるべきです。純粋関数はこの原則を満たしやすいです。
6.  **ドキュメンテーション**: すべての公開ユーティリティ関数には、目的、パラメータ、戻り値、使用例などを記述したJSDocコメントを付与します。
7.  **汎用性**: 特定のユースケースに過度に特化せず、プロジェクト内の複数の箇所で再利用できる可能性を考慮します。ただし、過度な汎用化は複雑さを増すためバランスが重要です。

## ディレクトリ構造

ユーティリティ関数の配置場所は、その依存性と適用範囲によって決定します。これは `02_architecture_design.md` で定義されたレイヤー構造に基づきます。

1.  **`src/shared/utils/`**: フレームワークや特定のレイヤーに依存しない、**完全に汎用的なユーティリティ関数**を配置します。
    *   例: 文字列操作 (`string-utils.ts`)、日付/時刻操作 (`date-utils.ts`)、基本的な検証関数 (`validation-utils.ts`)、配列/オブジェクト操作 (`collection-utils.ts`) など。
    *   これらの関数は、どのレイヤーからでも安全にインポートして使用できます。

2.  **`src/infrastructure/utils/`**: インフラストラクチャ層固有のユーティリティ関数や、特定の外部ライブラリ（DBクライアント、外部APIクライアントなど）に関連するヘルパー関数を配置します。
    *   例: DB接続ヘルパー、特定のAPIクライアント設定、インフラ層固有のエラー処理ヘルパーなど。
    *   ドメイン層やアプリケーション層から直接インポートするべきではありません。

3.  **`src/application/utils/`**: アプリケーション層（ユースケース層）固有のヘルパー関数を配置します。特定のビジネスプロセスに関連するが、ドメインロジックではない補助的な処理などが該当します。
    *   例: 特定のユースケースフローで共通して使われるデータ整形処理など。
    *   通常、このディレクトリの使用は限定的であるべきで、多くは `shared/utils` かドメインサービス/アプリケーションサービスに属します。

4.  **`src/domain/utils/`**: （通常は非推奨）ドメイン層固有のユーティリティは、通常は値オブジェクトのメソッドやドメインサービスとして実装されるべきです。このディレクトリが必要になるケースは稀です。

**原則**: より低いレイヤー（例: `shared`）のユーティリティは、より高いレイヤー（例: `application`, `infrastructure`）からインポートできますが、逆方向のインポートは禁止です（依存関係の逆転を防ぐため）。

## ユーティリティ関数の基本方針

### 設計原則

1.  **単一責任の原則**: 各ユーティリティ関数は明確に定義された単一の責任を持つ
2.  **純粋関数志向**: 副作用を最小限に抑え、同じ入力に対して常に同じ出力を返す (ただし、ロギングや外部API呼び出しラッパーなど、意図的な副作用を持つものもある)
3.  **型安全性**: TypeScriptの型システムを最大限に活用し、型安全な実装を提供。**特に `Result` 型 (`neverthrow`) を用いたエラー処理をサポートする。**
4.  **テスト容易性**: ユニットテストが容易な設計とし、高いカバレッジを目指す
5.  **再利用性**: レイヤー間で共通して使用できる汎用的な設計
6.  **カプセル化**: 実装の詳細を隠蔽し、安定したインターフェースを提供
7.  **堅牢性**: **`Result` 型を用いた**エラー処理を適切に行い、堅牢な実装を提供
8.  **文書化**: すべての関数に適切なJSDocコメントを付与
9.  **DI連携**: 必要に応じて、`tsyringe` によって注入された依存関係を利用することができる (例: Logger インスタンスの利用)

### ディレクトリ構造

ユーティリティ関数は、そのスコープに応じて `02_architecture_design.md` で定義されたディレクトリ構造に従って整理します。

-   **共有ユーティリティ**: プロジェクト全体で再利用される汎用的な関数は `shared/utils/` 配下に配置します。
-   **プレゼンテーション層ユーティリティ**: UIロジックやReactコンポーネントに特化した関数は `presentation/utils/` 配下に配置します。

`shared/utils/` 配下の推奨される分類構造は以下の通りです：

shared/utils/
├── conversion/ # 型変換関数 (DTO <-> Model など)
├── validation/ # バリデーション関数 (Zod スキーマ利用ヘルパーなど)
├── date/ # 日付/時間処理 (date-fns ラッパーなど)
├── error/ # エラー処理ユーティリティ (Result ヘルパー、エラー生成)
├── logging/ # ログ出力関数 (構造化ロギングラッパー)
├── security/ # セキュリティ関連 (ハッシュ、暗号化ラッパー)
├── testing/ # テスト用ヘルパー
├── performance/ # パフォーマンス計測
├── ai/ # AI関連ユーティリティ (プロンプト処理、APIラッパー)
├── i18n/ # 国際化ユーティリティ (翻訳ヘルパー)
├── network/ # ネットワーク関連 (リトライ処理、HTTPクライアントヘルパー)
└── common/ # その他の汎用ユーティリティ (文字列操作、配列操作など)


### 共有方法

1.  **サーバー/クライアント境界**:
    -   `'use server'` / `'use client'` ディレクティブによる明示的な分離
    -   環境依存のユーティリティは適切なディレクティブを付与
    -   両環境で使用可能なユーティリティは分離せずに共有 (`shared/utils/` に配置)

2.  **モジュール化**:
    -   関連する関数は同一ファイルにグループ化
    -   必要に応じてインデックスファイルでエクスポートを集約
    -   異なるレイヤー間で共通して使用する関数は独立したモジュールとして実装

3.  **バンドルサイズ最適化**:
    -   Tree-shakingを考慮した実装と公開
    -   大きな依存関係を持つユーティリティはLazy loadingが可能な設計
    -   Next.jsのサーバーコンポーネントの特性を活かしたクライアントバンドル最適化

## ユーティリティ関数の選定基準

ユーティリティ関数の追加・修正を検討する際は、以下の基準に従って判断してください。これらの基準は、プロジェクト全体の一貫性と保守性を確保するために重要です。

### 新規ユーティリティ関数の追加基準

以下の条件をすべて満たす場合、新しいユーティリティ関数の追加を検討してください：

1.  **再利用性**
    -   少なくとも3箇所以上で使用される見込みがある
    -   複数のドメイン・機能で共通して必要とされる
    -   将来的な再利用の可能性が高い

2.  **既存ライブラリとの関係**
    -   既存のライブラリ（lodash、date-fns等）で同等の機能が提供されていない
    -   または、既存ライブラリの機能に対して明確な拡張・最適化がある
    -   または、既存ライブラリのサブセットのみを使用し、バンドルサイズ削減が目的

3.  **複雑性と抽象化**
    -   複雑なロジックをカプセル化し、使用側のコードを簡素化できる
    -   特定のビジネスルールや計算ロジックを抽象化できる
    -   エラー処理や特殊ケース処理を統一的に提供できる

4.  **環境依存性**
    -   サーバー/クライアント間での共有が明確に定義できる
    -   環境依存性が明示的に文書化され、適切に処理されている

### 既存ライブラリとの使い分け

既存のユーティリティライブラリと独自実装の選択基準は以下の通りです：

| 機能カテゴリ             | 推奨ライブラリ         | 独自実装の条件                                                                 |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------ |
| **日付操作**             | date-fns               | 特定フォーマット、業務ドメイン固有処理、カレンダー計算等                         |
| **配列/オブジェクト操作** | 標準組み込み関数       | パフォーマンス最適化が必要な場合、TypeScript型との統合が必要な場合               |
| **文字列操作**           | 標準組み込み関数       | 複雑な正規表現処理、多言語対応、特定フォーマット変換                           |
| **数学計算**             | 標準Math               | 業務ドメイン固有の計算ロジック、特殊な数値処理                                   |
| **暗号化/ハッシュ**       | crypto-js, bcrypt      | 既存ライブラリのラッパーのみ（独自実装は避ける）                               |
| **入力検証**             | zod, superstruct       | 特定のビジネスルールに基づく検証、カスタムフォーマット                           |
| **HTTPリクエスト**        | fetch API, axios       | エラーハンドリングの共通化 (`Result`型利用)、認証統合、**リトライロジック (`retryWithBackoff`)** |
| **エラー処理**           | neverthrow             | `Result`型の操作ヘルパー (`mapResult`, `combineResults`等)、カスタムエラー生成ヘルパー |
| **状態管理**             | TanStack Query, Jotai | キャッシュ戦略のカスタマイズ、特定のUI状態パターン                             |

### 事前評価チェックリスト

新しいユーティリティ関数を追加する前に、以下のチェックリストを使用して評価してください：

-   [ ] **同等機能の確認**：既存のユーティリティ関数やサードパーティライブラリで同等機能が提供されていないか
-   [ ] **使用頻度の見込み**：複数の箇所で再利用される見込みがあるか
-   [ ] **責任範囲**：単一の明確な責任を持っているか
-   [ ] **純粋関数**：副作用がなく、同じ入力に対して常に同じ出力を返すか
-   [ ] **型安全性**：TypeScriptの型システムを適切に活用しているか
-   [ ] **テスト可能性**：ユニットテストが容易に書けるか
-   [ ] **命名の適切さ**：機能を適切に表現する名前になっているか
-   [ ] **ドキュメント**：JSDocコメントが完備されているか
-   [ ] **エラー処理**：例外処理が適切に行われているか (`Result` 型の利用を含む)
-   [ ] **パフォーマンス**：パフォーマンスのボトルネックとなる可能性がないか

### セキュリティ関連ユーティリティの特別要件

セキュリティに関連するユーティリティ関数（暗号化、認証、トークン処理等）については、以下の追加要件を満たす必要があります：

1.  **専門家のレビュー**：セキュリティ専門家によるコードレビューを受けること
2.  **既知の脆弱性**：OWASP Top 10等のセキュリティガイドラインに照らし合わせて評価すること
3.  **堅牢な実装**：適切なエラー処理とロギングを実装し、セキュリティ関連の例外を適切に扱うこと
4.  **最新のベストプラクティス**：業界標準のセキュリティベストプラクティスに準拠していること
5.  **定期的な監査**：定期的なセキュリティ監査の対象とすること

### リファクタリングとメンテナンス

既存のユーティリティ関数は、以下の条件に基づいて定期的に評価し、リファクタリングを検討してください：

1.  **使用頻度**：あまり使用されていない関数は汎用化または削除を検討
2.  **バグ発生率**：バグが頻発する関数は設計の見直しを検討
3.  **拡張要求**：頻繁に拡張が要求される関数は、より柔軟な設計への変更を検討
4.  **パフォーマンス**：パフォーマンスのボトルネックとなっている関数は最適化を検討
5.  **依存関係**：多くの箇所から依存される関数は、より安定したインターフェースへの改善を検討

### 開発プロセス

新しいユーティリティ関数の開発プロセスは以下の通りです：

1.  **提案フェーズ**：追加するユーティリティ関数の目的、仕様、使用例を文書化
2.  **レビューフェーズ**：上記の選定基準に照らし合わせて評価
3.  **実装フェーズ**：型安全で純粋な関数として実装、JSDoc完備
4.  **テストフェーズ**：単体テストの作成（カバレッジ100%）
5.  **ドキュメント化フェーズ**：使用例と注意点をコード例集に追加
6.  **リリースフェーズ**：プロジェクトへの統合とチーム内での周知

## 型変換関数 (`shared/utils/conversion/`)

### モデル・エンティティ変換

1.  **双方向変換**:
    -   ドメインモデル ⇔ データエンティティ
    -   ドメインモデル ⇔ API DTOs
    -   データエンティティ ⇔ データベーススキーマ

2.  **変換パターン**:
    -   Mapperパターンによる一貫した変換ロジック
    -   複雑なオブジェクトグラフのネスト変換
    -   部分的な変換と差分抽出

3.  **コンテキスト考慮**:
    -   ユーザー権限に基づくデータフィルタリング
    -   環境（サーバー/クライアント）に応じた適切な情報の選択
    -   国際化要件を考慮した変換ロジック

> **参照**: 具体的な実装例については「[code_examples/06_utility_functions_examples.md#モデル・エンティティ変換](./code_examples/06_utility_functions_examples.md#モデル・エンティティ変換)」を参照してください。

### API・モデル変換

1.  **リクエスト変換**:
    -   APIリクエストパラメータからドメインモデルへの変換
    -   バリデーション統合による安全な変換
    -   クエリパラメータの適切な型変換

2.  **レスポンス変換**:
    -   ドメインモデルからAPIレスポンス構造への変換
    -   権限に基づくフィールドの選択的な表示/非表示
    -   エラーオブジェクトからAPI標準エラーレスポンスへの変換

3.  **ページネーション対応**:
    -   ページネーションメタデータの標準化
    -   カーソルベースおよびオフセットベースのページネーション変換
    -   リストデータの効率的な変換

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「API・モデル変換」セクションを参照してください。

### 型安全な変換関数の設計

1.  **型ガード関数**:
    -   ユーザー入力の型検証とアサーション
    -   実行時型チェックの実装パターン
    -   型述語（Type Predicates）を活用した型絞り込み

2.  **型変換ヘルパー**:
    -   nullableな値の安全な変換
    -   任意のプロパティへのアクセス安全化
    -   型互換性のない値の適切な変換

3.  **型拡張・変換関数**:
    -   Pick、Omit、Partialなどのユーティリティ型に対応する実行時関数
    -   複雑な型変換の抽象化
    -   不変性（Immutability）を保証する変換関数

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「型安全な変換関数」セクションを参照してください。

## バリデーション (`shared/utils/validation/`)

### 入力バリデーション

1.  **Zodスキーマ定義**:
    -   Zodを使用した一貫したバリデーションスキーマの定義
    -   APIリクエスト型とのマッピング
    -   再利用可能なカスタムZodバリデーター

2.  **バリデーションユーティリティ**:
    -   エラーメッセージのフォーマット統一
    -   バリデーションエラーの集約と構造化
    -   条件付きバリデーションの簡素化

3.  **UI統合**:
    -   フォームバリデーションとAPIバリデーションの連携
    -   リアルタイムバリデーションのユーティリティ
    -   エラーメッセージの国際化サポート

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「入力バリデーション」セクションを参照してください。

### クライアント・サーバー共通バリデーション

1.  **共有バリデーションロジック**:
    -   クライアントとサーバーで一貫したバリデーションルールの適用
    -   環境に依存しないバリデーションロジックの実装
    -   バリデーションスキーマの一元管理

2.  **最適化戦略**:
    -   クライアント側での事前バリデーション
    -   サーバー側での厳格なバリデーション
    -   バリデーションコードの重複排除

3.  **環境検出**:
    -   実行環境に基づくバリデーション挙動の調整
    -   クライアント特有のバリデーション拡張
    -   サーバー特有のセキュリティバリデーション

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「クライアント・サーバー共通バリデーション」セクションを参照してください。

### カスタムバリデーションルール

1.  **プロジェクト固有ルール**:
    -   ビジネスドメイン固有のバリデーションルール
    -   複合フィールド間の相互検証ルール
    -   外部依存性を持つバリデーションルール

2.  **拡張バリデーター**:
    -   複雑なデータ構造のカスタムバリデーター
    -   パフォーマンスを考慮した大規模データのバリデーション
    -   条件付きバリデーションのパターン

3.  **メタバリデーション**:
    -   バリデーションルール自体の検証
    -   バリデーションポリシーの動的構成
    -   環境変数やフィーチャーフラグに基づくバリデーション調整

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「カスタムバリデーションルール」セクションを参照してください。

## 日付/時間処理 (`shared/utils/date/`)

### 日付操作

1.  **日付計算**:
    -   日付の加算・減算
    -   期間の計算と比較
    -   営業日・祝日を考慮した計算

2.  **日付の生成**:
    -   現在日時の取得（サーバー/クライアント統一）
    -   特定の条件を満たす日付の生成
    -   日付範囲の生成

3.  **日付変換**:
    -   文字列 ⇔ 日付オブジェクト
    -   タイムスタンプ ⇔ 日付オブジェクト
    -   異なる日付ライブラリ間の互換性

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「日付操作」セクションを参照してください。

### タイムゾーン処理

1.  **タイムゾーン変換**:
    -   UTC ⇔ ローカルタイムゾーン変換
    -   任意のタイムゾーン間の変換
    -   夏時間を考慮した正確な変換

2.  **タイムゾーン検出**:
    -   ユーザーのタイムゾーン検出
    -   サーバー/クライアント間のタイムゾーン調整
    -   タイムゾーン情報の保存と復元

3.  **地域特有の日付処理**:
    -   地域に応じた日付表記の調整
    -   暦の違いを考慮した日付処理
    -   国際的なイベント/期限の調整

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「タイムゾーン処理」セクションを参照してください。

### フォーマット関数

1.  **標準化されたフォーマット**:
    -   一貫性のある日付表示形式
    -   相対時間表示（"1時間前"など）
    -   期間の人間が読みやすい表示

2.  **地域化されたフォーマット**:
    -   i18n連携による地域に応じた日付表示
    -   数値・通貨を含む日付関連情報の表示
    -   ロケールに応じた曜日・月名の表示

3.  **カスタムフォーマット**:
    -   用途別の日付表示パターン
    -   値種別に応じた自動フォーマット選択
    -   APIレスポンス用の標準化されたISO形式

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「フォーマット関数」セクションを参照してください。

## ログ出力、エラーハンドリング (`shared/utils/logging/`, `shared/utils/error/`)

### ログレベル・フォーマット (`shared/utils/logging/`)

1.  **ログ階層**:
    -   エラー（ERROR）: 回復不能な問題
    -   警告（WARN）: 潜在的な問題
    -   情報（INFO）: 重要な処理の開始・完了
    -   デバッグ（DEBUG）: 開発用の詳細情報
    -   トレース（TRACE）: 最も詳細な診断情報

2.  **構造化ロギング**:
    -   JSON形式によるログ出力
    -   コンテキスト情報の一貫した付加
    -   追跡可能な相関ID（correlationId）の管理

3.  **環境別ログ設定**:
    -   環境に応じたログレベル制御
    -   本番環境での機密情報マスキング
    -   開発環境での詳細ログ出力

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「ログレベル・フォーマット」セクションを参照してください。

### エラー型定義 (`shared/utils/error/`, `shared/errors/`)

1.  **エラー階層**:
    -   基底エラークラス（BaseError in `shared/errors/`)
    -   ドメインエラー：業務ロジックに関連するエラー (`shared/errors/`)
    -   インフラストラクチャエラー：外部サービス・リソースに関連するエラー (`shared/errors/`)
    -   検証エラー：入力データの問題に関連するエラー (`shared/errors/`)
    -   アプリケーションエラー：内部的なアプリケーション問題 (`shared/errors/`)

2.  **エラーメタデータ**:
    -   エラーコード：一意の識別子
    -   HTTP状態コード：対応するレスポンスステータス
    -   エラー詳細：開発者向け情報
    -   ユーザーメッセージ：エンドユーザー向け翻訳可能メッセージ

3.  **エラーシリアライズ**:
    -   APIレスポンス用の一貫したエラー形式
    -   安全なエラー情報の公開
    -   デバッグ情報の条件付き含有

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「エラー型定義」セクションを参照してください。

### エラーハンドリング方針 (`shared/utils/error/`)

1.  **エラー変換**:
    -   外部APIエラーやライブラリエラーを、`InfrastructureError` や `ApplicationError` 等の標準エラー型にマッピングし、`Result.err` として返すユーティリティを提供します。
    -   サードパーティライブラリのエラーラッピング。
    -   AI APIエラーの特殊処理と回復戦略 (リトライやフォールバックを含む)。

2.  **エラー伝播**:
    -   `Result` 型をそのまま返すか、必要に応じて `mapErr` などで上位レイヤーのエラー型に変換して伝播させます。
    -   エラーコンテキストの拡充を補助するユーティリティも検討します。

3.  **処理戦略**:
    -   **リトライ可能なエラーの識別**: 特定のエラーコードや種別に基づき、リトライが可能かを判定するヘルパー関数を提供します。
    -   **指数バックオフ (Exponential Backoff)**: `network` ユーティリティとして、指数バックオフを用いた非同期処理のリトライ関数 (`retryWithBackoff`) を提供します (`shared/utils/network/`)。これは、一時的なネットワークエラーや外部APIのレート制限などに対応するために使用します。
    -   フォールバック機構と優雅な縮退 (Graceful Degradation) の実装を支援します。

#### エラー処理ユーティリティ (`shared/utils/error/`)

1.  **`Result` 型ヘルパー**:
    -   `mapResult(result, successFn, errorFn)`: `Result` の成功/失敗に応じて関数を適用します。
    -   `unwrapResult(result)`: 成功値を安全に取り出すか、エラーをスローします (注意して使用)。
    -   `combineResults([...results])`: 複数の `Result` を結合し、すべて成功なら成功値の配列、一つでも失敗なら最初のエラーを返します。
    -   `okAsync`, `errAsync`: 非同期処理の結果を `ResultAsync` としてラップします。

2.  **カスタムエラーユーティリティ**:
    -   `createDomainError(code, message, cause?)`: `DomainError` インスタンスを生成します。
    -   `isDomainError(error)`: エラーが `DomainError` かを判定する型ガード関数。
    -   (同様に `ApplicationError`, `InfrastructureError` 用のヘルパーも提供)

3.  **エラーロギング連携**:
    -   `logErrorResult(result, logger)`: `Result` がエラーの場合に、指定されたロガー (`shared/utils/logging/`) を使ってエラー情報をログ出力します。

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「ログ出力、エラーハンドリング」セクションを参照してください。 **`Result` 型ヘルパーや `retryWithBackoff` の使用例も含まれます。**

## セキュリティ関連 (`shared/utils/security/`)

### 暗号化・復号化

1.  **データ暗号化**:
    -   機密情報の暗号化
    -   サーバーサイド専用の安全な暗号化
    -   鍵管理と更新プロセス

2.  **ハッシュ計算**:
    -   単方向ハッシュ関数
    -   ソルト付きハッシュの生成
    -   ファイルコンテンツの整合性検証

3.  **セキュアな比較**:
    -   タイミング攻撃に耐性のある比較
    -   ハッシュ値の安全な検証
    -   機密値の安全な比較

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「暗号化・復号化」セクションを参照してください。

### パスワード処理

1.  **パスワードハッシュ**:
    -   Argon2idによる安全なパスワードハッシュ
    -   適切なコスト係数の設定と管理
    -   ハッシュアルゴリズムの将来的な移行サポート

2.  **パスワード検証**:
    -   既知の脆弱なパスワードチェック
    -   パスワード強度の評価
    -   多要素認証（MFA）の統合サポート

3.  **パスワードリセット**:
    -   安全なリセットトークン生成
    -   時間制限付きトークンの検証
    -   セキュアなパスワード更新フロー

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「パスワード処理」セクションを参照してください。

### トークン生成・検証

1.  **JWT関連**:
    -   JWTの生成と署名
    -   JWTの検証と解析
    -   クレーム管理とペイロード構造

2.  **アクセストークン**:
    -   短寿命アクセストークンの管理
    -   スコープベースの権限制御
    -   トークン無効化メカニズム

3.  **リフレッシュトークン**:
    -   安全なリフレッシュトークン管理
    -   トークンローテーション戦略
    -   不審なリフレッシュ検出

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「トークン生成・検証」セクションを参照してください。

## テスト用ヘルパー (`shared/utils/testing/`)

### テストデータ生成

1.  **ファクトリ関数**:
    -   モデルインスタンスの簡易生成
    -   関連オブジェクトの自動生成
    -   ランダムなバリエーションの生成

2.  **モックデータ**:
    -   API応答のモック
    -   データベースレコードのモック
    -   外部サービス連携のモック

3.  **カスタムデータセット**:
    -   テストケース別の特殊データ
    -   境界値テスト用データ
    -   国際化テスト用の多言語データ

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「テストデータ生成」セクションを参照してください。

### テスト用ユーティリティ

1.  **アサーション拡張**:
    -   複雑なオブジェクト構造の比較
    -   型安全なカスタムマッチャー
    -   非同期処理の検証ヘルパー

2.  **テスト環境設定**:
    -   テスト用データベース初期化
    -   テスト間の分離保証
    -   テスト終了後のクリーンアップ

3.  **モック/スタブヘルパー**:
    -   一貫したモックオブジェクト生成
    -   外部依存のスタブ化
    -   サーバーコンポーネントのテスト支援

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「テスト用ユーティリティ」セクションを参照してください。

## パフォーマンス計測 (`shared/utils/performance/`)

### 実行時間測定

1.  **処理時間計測**:
    -   関数実行時間の測定
    -   非同期処理の所要時間追跡
    -   閾値超過の自動検出

2.  **パフォーマンスマーク**:
    -   Web Vitalsメトリクスの測定
    -   ユーザー体験指標の収集
    -   パフォーマンスマークの記録と分析

3.  **レポート生成**:
    -   パフォーマンス統計の集計
    -   ボトルネック検出と警告
    -   時系列パフォーマンス変化の追跡

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「実行時間測定」セクションを参照してください。

### リソース使用状況測定

1.  **メモリ使用量**:
    -   ヒープサイズと使用量の監視
    -   メモリリークの検出
    -   大規模データ処理のメモリ最適化

2.  **CPU使用率**:
    -   計算集約的な処理の監視
    -   処理の分散と最適化
    -   アイドル時の処理スケジューリング

3.  **ネットワーク使用量**:
    -   データ転送量の測定と最適化
    -   リクエスト頻度と並列度の調整
    -   キャッシュ効果の測定

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「リソース使用状況測定」セクションを参照してください。

## AI関連ユーティリティ (`shared/utils/ai/`)

### プロンプト管理

1.  **テンプレート処理**:
    -   プロンプトテンプレートの変数置換
    -   コンテキスト情報の動的挿入
    -   多言語プロンプトの管理

2.  **コンテキスト最適化**:
    -   トークン数の計算と制限管理
    -   重要度に基づくコンテキスト圧縮
    -   長期コンテキストの要約と維持

3.  **プロンプト構築**:
    -   システムプロンプトとユーザープロンプトの構成
    -   ステップ間のコンテキスト連携
    -   会話種別に応じた最適プロンプト選択

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「プロンプト管理」セクションを参照してください。

### AI APIラッパー

1.  **プロバイダー抽象化**:
    -   複数AIプロバイダーの統一インターフェース。
    -   プロバイダー固有パラメータの適切な変換。
    -   フォールバック戦略の実装 (**`retryWithBackoff` ユーティリティを利用 (`shared/utils/network/`)**)。

2.  **リクエスト最適化**:
    -   バッチ処理とレート制限の管理。
    -   並列リクエストの調整。
    -   キャッシュ戦略の実装。

3.  **レスポンス処理**:
    -   標準化されたレスポンス形式 (`Result` 型を含む) への変換。
    -   エラー処理と回復メカニズム (**`retryWithBackoff` を利用**)。
    -   ストリーミングレスポンスの処理。

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「AI APIラッパー」セクションを参照してください。

### コンテキスト管理

1.  **コンテキスト保存**:
    -   会話履歴の効率的な保存
    -   異なるステップ間のコンテキスト共有
    -   セッション管理と復元

2.  **コンテキスト選択**:
    -   トークン制限内での最適コンテキスト選択
    -   重要メッセージの優先保持
    -   関連性に基づくコンテキストフィルタリング

3.  **コンテキスト集約**:
    -   複数ソースからのコンテキスト統合
    -   添付ファイル内容の適切な統合
    -   履歴要約とメタデータ抽出

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「コンテキスト管理」セクションを参照してください。

## 国際化ユーティリティ (`shared/utils/i18n/`)

### 翻訳管理

1.  **リソース読み込み**:
    -   言語リソースの効率的な読み込み
    -   必要時のみのリソースロード
    -   リソースバンドルのキャッシュ

2.  **翻訳関数**:
    -   変数置換対応の翻訳処理
    -   複数形対応の翻訳
    -   フォールバック言語の管理

3.  **翻訳コンテキスト**:
    -   名前空間による翻訳の整理
    -   コンポーネント階層に応じた翻訳スコープ
    -   動的言語切り替えサポート

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「翻訳管理」セクションを参照してください。

### ロケール処理

1.  **ロケール検出**:
    -   ユーザーの優先言語の検出
    -   地域設定の取得と適用
    -   ブラウザ/システム設定の活用

2.  **フォーマット管理**:
    -   数値の地域別フォーマット
    -   通貨のロケールに応じた表示
    -   日付・時刻の地域別表示

3.  **ロケール切り替え**:
    -   ユーザー設定の保存と復元
    -   アプリケーション全体のロケール同期
    -   RTL/LTRレイアウト切り替え

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「ロケール処理」セクションを参照してください。

### 多言語コンテンツ

1.  **コンテンツローダー**:
    -   言語に応じたコンテンツの動的読み込み
    -   言語固有アセットの管理
    -   言語依存コンポーネントの条件付きレンダリング

2.  **言語切り替え**:
    -   シームレスな言語切り替えロジック
    -   状態保持を伴う言語変更
    -   URL構造への言語情報の統合

3.  **多言語SEO**:
    -   言語別メタデータ管理
    -   hreflang属性の適切な設定
    -   検索エンジン最適化のための言語指定

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「多言語コンテンツ」セクションを参照してください。

## その他の汎用ユーティリティ (`shared/utils/common/`)

### 文字列操作

1.  **フォーマット**:
    -   テンプレート文字列の処理
    -   名前付きプレースホルダー置換
    -   複数言語対応のフォーマット

2.  **変換**:
    -   ケース変換（camelCase, snake_case, kebab-case等）
    -   スラッグ生成（URL友好的な文字列）
    -   特殊文字のエスケープと処理

3.  **検証と操作**:
    -   文字列パターンマッチング
    -   テキスト切り詰めと省略記号追加
    -   文字列の正規化

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「文字列操作」セクションを参照してください。

### 配列・オブジェクト操作

1.  **データ変換**:
    -   平坦化（flatten）と構造化（nest）
    -   グループ化と分類
    -   マップとフィルタの拡張操作

2.  **不変操作**:
    -   イミュータブルなオブジェクト更新
    -   ディープコピーと比較
    -   パスベースのプロパティアクセスと更新

3.  **特殊コレクション**:
    -   ページネーションコレクション
    -   キャッシュマップ（LRU、TTLなど）
    -   優先度キューと特殊データ構造

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「配列・オブジェクト操作」セクションを参照してください。

### 数値計算

1.  **統計関数**:
    -   記述統計（平均、中央値、分散など）
    -   パーセンタイル計算
    -   時系列データの分析

2.  **数値処理**:
    -   四捨五入と精度制御
    -   範囲制限（clamp）
    -   単位変換とスケーリング

3.  **乱数生成**:
    -   擬似乱数の生成
    -   指定範囲内の乱数
    -   クリプト安全な乱数（必要時のみ）

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「数値計算」セクションを参照してください。

## ユーティリティ関数の作成と拡張ガイドライン

1.  **新規ユーティリティの追加**:
    -   既存の分類に適合するか確認 (`shared/utils/` or `presentation/utils/`)
    -   適切な命名と文書化
    -   単体テストの100%カバレッジ確保

2.  **既存ユーティリティの拡張**:
    -   後方互換性の確保
    -   オプショナルパラメータによる機能拡張
    -   変更理由と影響範囲の文書化

3.  **レイヤー間での共有**:
    -   サーバー/クライアント間の共有方法の考慮 (`shared/utils/` が基本)
    -   バンドルサイズへの影響評価
    -   適切な公開スコープの設定

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「ユーティリティ関数の作成と拡張ガイドライン」セクションを参照してください。

## 機能別ユーティリティ関数

### チャット機能ユーティリティ

チャット機能では、複雑なメッセージ処理、コンテキスト管理、AIとの通信を効率的に行うためのユーティリティ関数が必要です。 (これらは `presentation/utils/chat/` や `shared/utils/ai/` に配置される可能性があります)

#### メッセージ処理

1.  **メッセージフォーマッタ**:
    ```typescript
    /**
     * 生のメッセージコンテンツを表示用にフォーマットします
     * @param content 生のメッセージ内容
     * @param format 出力フォーマット（'text'|'html'|'markdown'）
     * @returns フォーマット済みのメッセージコンテンツ
     */
    function formatMessageContent(
      content: string,
      format: 'text' | 'html' | 'markdown' = 'text'
    ): string;

    /**
     * チャットメッセージからコードブロックを抽出します
     * @param message 処理対象のメッセージ
     * @returns 抽出されたコードブロックの配列（言語タグと内容のペア）
     */
    function extractCodeBlocks(
      message: string
    ): Array<{ language: string; code: string }>;

    /**
     * メッセージ内のリンクを検出してクリック可能なリンクに変換します
     * @param message 処理対象のメッセージ
     * @returns リンクが変換されたメッセージ
     */
    function linkifyMessage(message: string): string;
    ```

2.  **メッセージ正規化**:
    ```typescript
    /**
     * メッセージの内容を正規化し、余分な空白や特殊文字を整理します
     * @param message 正規化対象のメッセージ
     * @returns 正規化されたメッセージ
     */
    function normalizeMessage(message: string): string;

    /**
     * システムメッセージを特定の言語に翻訳します
     * @param message 翻訳対象のシステムメッセージ
     * @param locale 対象言語のロケール
     * @returns 翻訳されたメッセージ
     */
    function translateSystemMessage(
      message: SystemMessage,
      locale: string
    ): Promise<SystemMessage>;
    ```

#### コンテキスト管理

1.  **コンテキスト圧縮**:
    ```typescript
    /**
     * 長いメッセージ履歴を圧縮して指定したトークン制限内に収めます
     * @param messages 圧縮対象のメッセージ配列
     * @param maxTokens 最大トークン数
     * @param config 圧縮設定オプション
     * @returns 圧縮されたメッセージ配列
     */
    function compressMessageHistory(
      messages: Message[],
      maxTokens: number,
      config: ContextCompressionConfig
    ): Message[];

    /**
     * 長いメッセージ履歴から要約メッセージを生成します
     * @param messages 要約対象のメッセージ配列
     * @returns 履歴の要約を含むシステムメッセージ
     */
    function summarizeMessageHistory(
      messages: Message[]
    ): Promise<SystemMessage>;
    ```

2.  **コンテキスト管理**:
    ```typescript
    /**
     * 会話コンテキストに重要なプロジェクト情報を追加します
     * @param context 既存の会話コンテキスト
     * @param projectId プロジェクトID
     * @returns 拡張された会話コンテキスト
     */
    function enrichContextWithProjectInfo(
      context: ConversationContext,
      projectId: ProjectId
    ): Promise<ConversationContext>;

    /**
     * 会話履歴からキーワードとトピックを抽出します
     * @param messages 分析対象のメッセージ配列
     * @returns 抽出されたキーワードとトピックの配列
     */
    function extractTopicsFromConversation(
      messages: Message[]
    ): Promise<string[]>;
    ```

#### AI通信

1.  **プロンプト構築**:
    ```typescript
    /**
     * テンプレートと変数からAIプロンプトを構築します
     * @param template プロンプトテンプレート
     * @param variables テンプレート変数
     * @returns 構築されたプロンプト
     */
    function buildPromptFromTemplate(
      template: PromptTemplate,
      variables: Record<string, any>
    ): string;

    /**
     * 会話種別に基づいて最適なプロンプトテンプレートを選択します
     * @param type 会話種別
     * @param stepType ステップ種別
     * @returns 最適なプロンプトテンプレート
     */
    function selectOptimalPromptTemplate(
      type: ConversationType,
      stepType: StepType
    ): Promise<PromptTemplate>;
    ```

2.  **AI応答処理**:
    ```typescript
    /**
     * AI応答から構造化されたアクション項目を抽出します
     * @param response AI応答メッセージ
     * @returns 抽出されたアクション項目の配列
     */
    function extractActionItemsFromResponse(
      response: AssistantMessage
    ): { type: string; content: string }[];

    /**
     * AI応答の品質をモニタリングするためのメトリクスを計算します
     * @param response AI応答メッセージ
     * @param context 会話コンテキスト
     * @returns 品質メトリクス
     */
    function calculateResponseQualityMetrics(
      response: AssistantMessage,
      context: ConversationContext
    ): {
      relevance: number;
      helpfulness: number;
      clarity: number;
      overall: number;
    };
    ```

### ステップ管理ユーティリティ

ステップ管理では、進捗追跡、条件評価、ナビゲーション支援のためのユーティリティ関数が必要です。 (これらは `shared/utils/step/` や関連するドメインフォルダ内に配置される可能性があります)

#### 進捗追跡

1.  **進捗計算**:
    ```typescript
    /**
     * プロジェクト全体の進捗率を計算します
     * @param projectId プロジェクトID
     * @param userId ユーザーID
     * @returns 進捗率（0-100）
     */
    function calculateProjectProgress(
      projectId: ProjectId,
      userId: UserId
    ): Promise<number>;

    /**
     * ステップの完了条件がすべて満たされているか評価します
     * @param stepId ステップID
     * @param userId ユーザーID
     * @param projectId プロジェクトID
     * @returns 完了条件の評価結果
     */
    function evaluateStepCompletionConditions(
      stepId: StepId,
      userId: UserId,
      projectId: ProjectId
    ): Promise<{
      isComplete: boolean;
      completedConditions: CompletionConditionType[];
      pendingConditions: CompletionConditionType[];
    }>;
    ```

2.  **進捗データ管理**:
    ```typescript
    /**
     * ユーザーの進捗データを安全に更新します
     * @param userId ユーザーID
     * @param stepId ステップID
     * @param projectId プロジェクトID
     * @param progressData 更新する進捗データ
     * @returns 更新された進捗データ
     */
    function updateUserStepProgress(
      userId: UserId,
      stepId: StepId,
      projectId: ProjectId,
      progressData: Partial<StepProgress>
    ): Promise<StepProgress>;

    /**
     * 進捗データをエクスポート可能な形式に変換します
     * @param progress 進捗データ
     * @param format 出力形式（'csv'|'json'|'pdf'）
     * @returns エクスポート用データ
     */
    function exportProgressData(
      progress: StepProgress[],
      format: 'csv' | 'json' | 'pdf'
    ): Promise<Blob>;
    ```

#### ステップナビゲーション

1.  **アクセス制御**:
    ```typescript
    /**
     * ユーザーが特定のステップにアクセスできるか評価します
     * @param userId ユーザーID
     * @param stepId ステップID
     * @param projectId プロジェクトID
     * @returns アクセス評価結果と理由
     */
    function canAccessStep(
      userId: UserId,
      stepId: StepId,
      projectId: ProjectId
    ): Promise<{
      canAccess: boolean;
      reason?: string;
      missingPrerequisites?: StepId[];
    }>;

    /**
     * 特定のステップの前提条件の充足状況を評価します
     * @param stepId 評価対象のステップID
     * @param userId ユーザーID
     * @param projectId プロジェクトID
     * @returns 前提条件の評価結果
     */
    function evaluatePrerequisites(
      stepId: StepId,
      userId: UserId,
      projectId: ProjectId
    ): Promise<{
      fulfilled: StepId[];
      pending: StepId[];
      isFulfilled: boolean;
    }>;
    ```

2.  **ナビゲーション補助**:
    ```typescript
    /**
     * 次に推奨されるステップを計算します
     * @param userId ユーザーID
     * @param projectId プロジェクトID
     * @param currentStepId 現在のステップID（省略可）
     * @returns 推奨ステップのID配列
     */
    function calculateRecommendedNextSteps(
      userId: UserId,
      projectId: ProjectId,
      currentStepId?: StepId
    ): Promise<StepId[]>;

    /**
     * プロジェクト内のステップの依存関係グラフを構築します
     * @param programId プログラムID
     * @returns ステップの依存関係グラフ
     */
    function buildStepDependencyGraph(
      programId: ProgramId
    ): Promise<{
      nodes: Array<{ id: StepId; data: Step }>;
      edges: Array<{ source: StepId; target: StepId }>;
    }>;
    ```

### プロンプト管理ユーティリティ

プロンプト管理では、テンプレート処理、変数置換、バージョン管理のためのユーティリティ関数が必要です。 (これらは主に `shared/utils/ai/` や `infrastructure/ai/prompt-templates/` に関連します)

#### テンプレート処理

1.  **テンプレート操作**:
    ```typescript
    /**
     * プロンプトテンプレートを解析して含まれる変数を抽出します
     * @param templateText テンプレートテキスト
     * @returns 抽出された変数名の配列
     */
    function extractTemplateVariables(
      templateText: string
    ): string[];

    /**
     * プロンプトテンプレートを検証し、構文エラーを検出します
     * @param template 検証対象のテンプレート
     * @returns 検証結果と検出されたエラー
     */
    function validatePromptTemplate(
      template: PromptTemplate
    ): {
      isValid: boolean;
      errors: Array<{ type: string; message: string; position?: number }>;
    };
    ```

2.  **変数置換**:
    ```typescript
    /**
     * テンプレート内の変数を指定された値で置換します
     * @param template プロンプトテンプレート
     * @param variables 変数値のマップ
     * @returns 変数が置換されたテキスト
     */
    function replaceTemplateVariables(
      template: PromptTemplate,
      variables: Record<string, any>
    ): string;

    /**
     * 変数の型とフォーマットを検証します
     * @param variableName 変数名
     * @param value 変数値
     * @param template 関連するテンプレート
     * @returns 検証結果とエラーメッセージ
     */
    function validateVariableValue(
      variableName: string,
      value: any,
      template: PromptTemplate
    ): {
      isValid: boolean;
      error?: string;
    };
    ```

#### バージョン管理

1.  **バージョニング**:
    ```typescript
    /**
     * プロンプトテンプレートの新しいバージョンを作成します
     * @param templateId テンプレートID
     * @param newContent 新しいテンプレート内容
     * @param changelog 変更履歴
     * @param userId 作成者ID
     * @returns 作成された新バージョン
     */
    function createNewPromptVersion(
      templateId: PromptTemplateId,
      newContent: string,
      changelog: string,
      userId: UserId
    ): Promise<PromptVersion>;

    /**
     * プロンプトバージョン間の差分を計算します
     * @param versionA 比較元バージョン
     * @param versionB 比較先バージョン
     * @returns 差分情報
     */
    function calculatePromptVersionDiff(
      versionA: PromptVersion,
      versionB: PromptVersion
    ): {
      textDiff: string;
      variablesDiff: {
        added: PromptVariable[];
        removed: PromptVariable[];
        modified: Array<{
          name: string;
          before: Partial<PromptVariable>;
          after: Partial<PromptVariable>
        }>;
      };
    };
    ```

2.  **A/Bテスト**:
    ```typescript
    /**
     * A/Bテストの結果を統計的に分析します
     * @param testId A/BテストID
     * @returns 分析結果
     */
    function analyzeABTestResults(
      testId: PromptABTestId
    ): Promise<{
      winner: 'A' | 'B' | 'tie' | null;
      confidenceLevel: number;
      metrics: Record<string, {
        promptA: number;
        promptB: number;
        difference: number;
        significantDifference: boolean;
      }>;
      recommendations: string[];
    }>;

    /**
     * A/Bテストでユーザーに表示するプロンプトバージョンを決定します
     * @param testId A/BテストID
     * @param userId ユーザーID
     * @returns 選択されたプロンプトバージョン
     */
    function selectPromptVersionForUser(
      testId: PromptABTestId,
      userId: UserId
    ): Promise<PromptVersion>;
    ```

### ビデオコンテンツ管理ユーティリティ

ビデオコンテンツ管理では、動画処理、プレーヤー統合、視聴進捗管理のためのユーティリティ関数が必要です。(これらは `shared/utils/video/` や `presentation/utils/video/` に配置される可能性があります)

#### ビデオ処理

1.  **メタデータ処理**:
    ```typescript
    /**
     * ビデオURLからプロバイダー情報を抽出します
     * @param url ビデオURL
     * @returns 抽出されたプロバイダー情報
     */
    function extractVideoProviderInfo(
      url: string
    ): {
      provider: VideoProvider;
      providerId: string;
      url: string;
    };

    /**
     * 外部APIを使用してビデオメタデータを取得します
     * @param provider ビデオプロバイダー
     * @param providerId プロバイダー固有のID
     * @returns 取得したメタデータ
     */
    function fetchVideoMetadata(
      provider: VideoProvider,
      providerId: string
    ): Promise<{
      title: string;
      description: string;
      duration: number;
      thumbnailUrl: string;
      publishedAt?: Date;
    }>;
    ```

2.  **埋め込みコード生成**:
    ```typescript
    /**
     * ビデオの埋め込みコードを生成します
     * @param video ビデオオブジェクト
     * @param options 埋め込みオプション
     * @returns 生成された埋め込みコード
     */
    function generateVideoEmbedCode(
      video: Video,
      options: {
        width?: number;
        height?: number;
        autoplay?: boolean;
        startAt?: number;
        controls?: boolean;
      }
    ): string;

    /**
     * ビデオのURL形式を変換します（標準URLから埋め込み用URLなど）
     * @param url 元のURL
     * @param provider ビデオプロバイダー
     * @param format 変換先フォーマット
     * @returns 変換されたURL
     */
    function convertVideoUrl(
      url: string,
      provider: VideoProvider,
      format: 'embed' | 'share' | 'direct'
    ): string;
    ```

#### 視聴進捗管理

1.  **進捗追跡**:
    ```typescript
    /**
     * ユーザーのビデオ視聴進捗を更新します
     * @param userId ユーザーID
     * @param videoId ビデオID
     * @param position 現在の再生位置（秒）
     * @param duration セッション視聴時間（秒）
     * @returns 更新された進捗情報
     */
    function updateVideoWatchProgress(
      userId: UserId,
      videoId: VideoId,
      position: number,
      duration: number,
      projectId?: ProjectId,
      stepId?: StepId
    ): Promise<VideoProgress>;

    /**
     * 視聴進捗に基づいてビデオ完了状態を評価します
     * @param progress ビデオ進捗オブジェクト
     * @param completionThreshold 完了とみなす視聴率しきい値（0-1）
     * @returns 評価結果
     */
    function evaluateVideoCompletion(
      progress: VideoProgress,
      completionThreshold: number = 0.9
    ): {
      isComplete: boolean;
      percentage: number;
      remainingSeconds: number;
      recommendation?: string;
    };
    ```

2.  **統計・分析**:
    ```typescript
    /**
     * ビデオコンテンツの視聴統計を計算します
     * @param videoId ビデオID
     * @returns 視聴統計
     */
    function calculateVideoViewStats(
      videoId: VideoId
    ): Promise<{
      totalViews: number;
      uniqueViewers: number;
      averageCompletionRate: number;
      popularSegments: Array<{
        startTime: number;
        endTime: number;
        viewCount: number
      }>;
      dropoffPoints: Array<{
        time: number;
        dropoffRate: number
      }>;
    }>;

    /**
     * ユーザーの視聴行動パターンを分析します
     * @param userId ユーザーID
     * @returns 視聴行動の分析結果
     */
    function analyzeUserViewingBehavior(
      userId: UserId
    ): Promise<{
      averageWatchTime: number;
      preferredTimes: string[];
      completionRate: number;
      favoriteCategories: Array<{
        category: string;
        watchCount: number
      }>;
      recommendedVideos: VideoId[];
    }>;
    ```

> **参照**: 各ユーティリティ関数の詳細な実装例については「code_examples/06_utility_functions_examples.md」の対応するセクションを参照してください。

### 共通ネットワークユーティリティ (`shared/utils/network/`)

1.  **`retryWithBackoff`**:
    ```typescript
    /**
     * 指定された非同期関数を指数バックオフ付きでリトライします。
     * @param operation リトライ対象の非同期関数 (ResultAsync<T, E> を返す)
     * @param options リトライ回数、初期遅延、最大遅延などの設定
     * @param shouldRetry エラー発生時にリトライすべきかを判定する関数 (デフォルトは常にリトライ)
     * @returns 成功した場合は ResultAsync<T, E>、リトライ上限に達した場合は最後のエラーを含む ResultAsync<T, E>
     */
    function retryWithBackoff<T, E extends BaseError>(
      operation: () => ResultAsync<T, E>,
      options: RetryOptions,
      shouldRetry?: (error: E) => boolean
    ): ResultAsync<T, E>;
    ```
2.  **HTTPクライアントヘルパー**:
    -   `fetchWithResult`: 標準の `fetch` をラップし、レスポンスを `ResultAsync<Response, InfrastructureError>` で返すヘルパー。
    -   `parseJsonResponse`: `Response` オブジェクトから JSON を安全にパースし、`ResultAsync<T, InfrastructureError>` を返すヘルパー。
    -   (必要に応じて `axios` ラッパーも提供)

> **参照**: 具体的な実装例については「code_examples/06_utility_functions_examples.md」の「共通ネットワークユーティリティ」セクションを参照してください。
