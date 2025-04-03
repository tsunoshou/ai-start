# クライアント側の実装

最終更新日: 2024-07-27

このドキュメントは、[02_architecture_design.md](/docs/restructuring/02_architecture_design.md) で定義されたアーキテクチャに基づき、AiStartプロジェクトのクライアントサイド（フロントエンド）の実装方針を詳細に記述します。サーバーサイドの実装については [07_server_implementation.md](/docs/restructuring/07_server_implementation.md) を参照してください。

## フレームワーク/ライブラリ選定

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md#技術スタック選定) で選定された技術スタックに基づき、クライアントサイドでは以下のフレームワークおよびライブラリを使用します。

### フロントエンドフレームワーク

- **Next.js (v14+, React 18+)**: App Routerを採用し、サーバーコンポーネント (RSC) とクライアントコンポーネント (CC) を適切に使い分けます。ファイルベースルーティング、最適化された画像処理 (`next/image`)、フォント最適化などの機能を活用します。
  - **理由**: 生産性の高さ、パフォーマンス最適化機能、Reactエコシステムとの親和性。RSC/CCによる関心事の分離。

### コンポーネントライブラリ

- **Tailwind CSS**: ユーティリティファーストのCSSフレームワークとして全面的に採用します。クラス名を直接HTML要素に適用することで、迅速かつ一貫性のあるスタイリングを実現します。
- **shadcn/ui**: Tailwind CSS上に構築された、再利用可能でカスタマイズ性の高いUIコンポーネント集。Radix UIとTailwind CSSをベースとしており、コピー＆ペーストでプロジェクトに導入可能です。`components.json` で設定を管理します。
- **lucide-react**: アイコンライブラリとして統一的に使用します。

### ユーティリティライブラリ

- **date-fns**: 日付操作のための軽量でモダンなライブラリ。
- **clsx / tailwind-merge**: 条件に応じたTailwindクラス名の結合と重複クラスのマージを効率的に行うために使用します。`shadcn/ui` の内部でも利用されています。

## 状態管理

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md#状態管理) で定義された方針に基づき、以下のライブラリを使い分けます。

### 状態管理ライブラリ

- **TanStack Query (旧 React Query)**: サーバー状態管理の主軸として使用します。APIデータのフェッチ、キャッシュ、同期、バックグラウンド更新を管理します。
  - 非同期データの取得 (`useQuery`)
  - データ更新（Mutation: `useMutation`)
  - キャッシュ管理 (`staleTime`, `cacheTime` の適切な設定)
  - Query Key の命名規則は [04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) を参照。
- **React Context API**: グローバルで共有され、更新頻度が低い状態（例: テーマ設定、認証状態、ユーザー情報）の管理に使用します。プロバイダーのネストを避け、必要な範囲で分割して提供します。
- **Jotai**: クライアントサイドの揮発性状態（例: モーダルの開閉状態、複雑なフォームの一時的な状態）で、Context APIよりも細粒度な管理が必要な場合に補助的に使用します。Atomのスコープは最小限に留め、グローバルなAtomの乱立を避けます。

### グローバル状態設計

- 認証状態 (`Session` 情報) やユーザープロファイルは、Auth.jsと連携し、React Context APIを通じてグローバルに提供します。
- UIテーマ（ライト/ダークモード）もContext APIで管理します。
- 詳細は [コード例集](/docs/restructuring/code_examples/08_client_implementation_examples.md#グローバル状態設計) を参照してください。

### ローカル状態管理

- コンポーネント固有の状態は `useState` や `useReducer` を基本とします。
- 複数コンポーネント間で共有されるがサーバー状態ではない揮発性の状態には、必要に応じてJotaiを使用します。

## APIクライアント

### APIクライアントライブラリ

- 基本的に標準の `fetch` APIを使用します。
- **TanStack Query** を通じてAPIリクエストをラップし、キャッシュ、ローディング状態、エラー状態の管理を行います。
- サーバーアクション (Server Actions) も積極的に活用し、クライアントサイドでのAPIエンドポイント定義を減らします。特にフォーム送信などのMutation操作で有効です。

### エラーハンドリング

- APIリクエストのエラーは TanStack Query の `onError` コールバックや `error` 状態で捕捉します。
- バックエンドから返却される `Result` 型 (成功/失敗とデータ/エラー情報を含む) を適切に処理します。
- ユーザーには `shadcn/ui` の `Toast` コンポーネントなどを用いて、分かりやすいエラーメッセージを表示します。ネットワークエラーなど、特定のエラータイプに応じた処理も実装します。
- 詳細は [コード例集](/docs/restructuring/code_examples/08_client_implementation_examples.md#apiエラーハンドリング) を参照してください。

### リクエスト管理

- TanStack Queryによるキャッシュ戦略 (`staleTime`, `cacheTime`) を活用し、不要なAPIリクエストを削減します。
- Optimistic Updates を必要に応じて実装し、UIの応答性を向上させます (`onMutate`, `onError`, `onSettled`)。
- サーバーアクション利用時も、`useTransition` などと組み合わせてローディング状態を管理します。

## UIコンポーネント設計

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md#推奨ディレクトリ構造) の `presentation/` ディレクトリ構造に従います。

### コンポーネント設計パターン

- **Atomic Design** の考え方を参考にしつつも、厳密な階層（Atoms, Molecules, Organisms など）には固執せず、`presentation/components` 配下の分類（`common`, `layouts`, `forms`, `feature-specific`) を優先します。
- サーバーコンポーネント (RSC) とクライアントコンポーネント (CC) の境界を意識し、可能な限りRSCを使用します。インタラクティブ性が必要な場合にのみCC (`'use client'`) を使用します。
- コンポーネントの責務を単一に保ち、Props経由での依存性注入を基本とします。

### コンポーネント階層

- `presentation/components/common/`: アプリケーション全体で再利用される基本的なコンポーネント (Button, Input, Card など)。`shadcn/ui` のラッパーや独自実装を含みます。
- `presentation/components/layouts/`: ページ全体のレイアウト構造を定義するコンポーネント (Header, Sidebar, Footer, MainLayout など)。
- `presentation/components/forms/`: フォーム関連の共通コンポーネント (FormWrapper, FieldWithError など)。
- `presentation/components/feature-specific/`: 特定の機能ドメインに属するコンポーネント (例: `project/ProjectCard`, `chat/ChatMessage`)。
- `app/` ディレクトリ内の `page.tsx`, `layout.tsx` でこれらのコンポーネントを組み合わせてUIを構築します。

### スタイリング方針

- **Tailwind CSS** を全面的に採用します。
- `globals.css` で基本的なスタイル、CSS変数（配色、フォントサイズなど）を定義します。
- コンポーネント固有のスタイルは、原則としてTailwindのユーティリティクラスを直接適用します。複雑なスタイルや再利用性の高いスタイルパターンは `@apply` を用いてCSSクラスとしてまとめることも検討しますが、基本はユーティリティクラスを優先します。
- `tailwind.config.js` でテーマ（色、スペーシング、フォントなど）をカスタマイズします。

## レスポンシブ対応・アクセシビリティ

### レスポンシブデザイン

- Tailwind CSS のレスポンシブ修飾子 (`sm:`, `md:`, `lg:` など) を使用して、モバイル、タブレット、デスクトップの各画面サイズに対応します。
- モバイルファーストのアプローチを基本とします。

### アクセシビリティ対応

- WCAG 2.1 AAレベル準拠を目指します。
- セマンティックなHTMLタグを適切に使用します。
- `shadcn/ui` (Radix UI) が提供するアクセシビリティ機能（キーボードナビゲーション、WAI-ARIA属性など）を活用します。
- 画像には `alt` 属性を、インタラクティブ要素には適切な `aria-*` 属性を設定します。
- `eslint-plugin-jsx-a11y` を導入し、開発中にアクセシビリティの問題を検知します。

### ダークモード対応

- Tailwind CSS の `dark:` 修飾子とCSS変数を組み合わせて実装します。
- テーマ切り替えの状態はReact Context APIまたはJotaiで管理し、`<html>` タグに `class="dark"` を付与することで切り替えます。
- OSのテーマ設定に追従する機能も提供します (`prefers-color-scheme`)。

## ルーティング

### ルーティングライブラリ

- **Next.js App Router** を使用します。特別なルーティングライブラリは導入しません。

### ルート設計

- `app/` ディレクトリ構造がそのままルーティングパスに対応します。
- 動的ルート (`app/projects/[id]/page.tsx`) を使用します。
- ルートグループ (`app/(dashboard)/layout.tsx`) を活用し、特定のセクションで共通のレイアウトや認証チェックを適用します。
- 国際化対応のため、`app/[locale]/` のような構造を基本とします（`next-intl` と連携）。
- 管理者向け画面は `app/(admin)/admin/...` のようなパスで分離し、専用のレイアウトと認証ミドルウェアを適用します。

### ナビゲーション管理

- ページ遷移には Next.js の `<Link>` コンポーネントを使用します。
- プログラムによるナビゲーションには `useRouter` フック (from `next/navigation`) を使用します。
- アクティブなルートに応じてナビゲーションメニューのスタイルを変更する処理を実装します (`usePathname` フック)。

## フォーム管理

### フォームライブラリ

- **React Hook Form**: パフォーマンスが高く、制御されたコンポーネントと非制御コンポーネントの両方をサポートするため採用します。フックベースで扱いやすく、バリデーションスキーマとの統合も容易です。
- **Zod**: バリデーションスキーマ定義ライブラリとして使用します。[04_implementation_rules.md](/docs/restructuring/04_implementation_rules.md) で定義されたバックエンドのバリデーションと一貫性を保ち、型安全なフォームを実現します。`@hookform/resolvers/zod` を使用してReact Hook Formと連携します。

### バリデーション

- Zodスキーマでフォームデータの型とバリデーションルールを定義します。
- リアルタイムバリデーション (`mode: 'onChange'` など) と送信時バリデーションを適切に使い分けます。
- サーバーサイドでの再バリデーションも必須ですが、クライアントサイドである程度の入力エラーを防ぎます。

### エラー表示

- React Hook Form の `formState.errors` を利用して、各入力フィールドに対応するエラーメッセージを表示します。
- `shadcn/ui` の `Form` コンポーネント群（`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` など）を活用し、一貫性のあるエラー表示UIを構築します。
- 詳細は [コード例集](/docs/restructuring/code_examples/08_client_implementation_examples.md#フォーム管理とバリデーション) を参照してください。

## 国際化対応(i18n)

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md#国際化i18nアーキテクチャ) および [技術スタック選定](/docs/restructuring/02_architecture_design.md#国際化i18n技術) に基づき実装します。

### 多言語対応

- **next-intl**: Next.js App Router向けの国際化ライブラリとして使用します。
  - ルーティングベースのロケール管理 (`/en/...`, `/ja/...`)。
  - サーバーコンポーネント、クライアントコンポーネント、サーバーアクションでの利用をサポート。
  - 型安全なメッセージキーアクセス。
- `i18n/locales/` ディレクトリに言語ごとのJSONファイルを配置します (`en.json`, `ja.json` など)。
- `useTranslations` フック (クライアントコンポーネント) や `getTranslator` 関数 (サーバーコンポーネント) を使用して翻訳メッセージを取得します。

### ローカライズ戦略

- 日付、数値、通貨などのフォーマットは `next-intl` が提供する機能（内部で `Intl` APIを使用）を活用します。
- 複数形や性別による翻訳の切り替えには ICU MessageFormat 形式を使用します。
- RTL言語サポートも考慮し、Tailwind CSSの `rtl:` 修飾子を活用します。

### 日付・数値フォーマット

- `useFormatter` フックや `format` 関数を使用して、ロケールに応じた日付・数値フォーマットを適用します。
- 詳細は [コード例集](/docs/restructuring/code_examples/08_client_implementation_examples.md#国際化対応) を参照してください。

## エラー表示とユーザー体験

### エラー表示

- APIエラー: TanStack Query の `error` 状態と `Toast` を組み合わせてフィードバック。
- フォームバリデーションエラー: 各フィールド下に `FormMessage` を用いて表示。
- 予期せぬクライアントエラー: Error Boundary (`error.tsx` in App Router) を用いて、アプリケーション全体のクラッシュを防ぎ、ユーザーフレンドリーなエラー画面を表示。

### ローディング状態

- TanStack Query の `isLoading`, `isFetching` 状態を利用して、データ取得中のローディングインジケーター（スピナー、スケルトンローダーなど）を表示します。
- サーバーアクション実行中は `useTransition` の `isPending` を利用して、ボタンの無効化やローディング表示を行います。
- `shadcn/ui` の `Skeleton` コンポーネントなどを活用します。

### トースト・通知

- 操作の成功時、警告、エラー通知などに `shadcn/ui` の `Toast` コンポーネントを使用します。
- `useToast` フックを通じて簡単にトーストを表示できます。

## パフォーマンス最適化

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md#パフォーマンス最適化戦略) の方針に基づき、以下の最適化を実施します。

### コード分割

- Next.js App Routerのルートベースコード分割が自動的に適用されます。
- `next/dynamic` を使用して、初期表示に不要なクライアントコンポーネントやライブラリを動的にインポートし、遅延ロードさせます。

### メモ化

- `React.memo` を用いて、Propsが変更されない限り再レンダリングされないコンポーネントを作成します（特にリストアイテムなど）。
- `useMemo` を用いて、重い計算結果をメモ化します。
- `useCallback` を用いて、関数参照をメモ化し、不要な再レンダリングを防ぎます（特に関数をPropsとして渡す場合）。

### 仮想化

- 長大なリスト（例: チャット履歴、大量のデータテーブル）を表示する際には、`react-window` や `react-virtualized` のようなライブラリ、または TanStack Virtual (TanStack Table に統合) を導入し、DOM要素の数を制限してレンダリングパフォーマンスを向上させることを検討します。

## クライアントサイドのセキュリティ考慮事項

クライアントサイドの実装においては、以下のセキュリティリスクに特に注意し、対策を講じます。

- **クロスサイトスクリプティング (XSS) 対策**: ReactはデフォルトでJSXに埋め込まれた値をエスケープしますが、`dangerouslySetInnerHTML` の使用は原則禁止とします。外部から取得したHTMLをどうしても表示する必要がある場合は、適切なサニタイズライブラリ (例: `dompurify`) を使用し、その利用箇所は厳格にレビューします。
- **機密情報の保持禁止**: クライアントサイドのコード（JavaScript）やローカルストレージ、セッションストレージには、APIキー、シークレット、個人情報などの機密情報を決して保持しません。
- **入力検証の補助**: サーバーサイドでの厳格な入力検証が主ですが、クライアントサイドでもZodを用いた入力形式チェックを行い、不正なリクエストを早期に検出しユーザー体験を向上させます。ただし、クライアントサイドの検証はあくまで補助的なものと位置づけ、バイパス可能であることを認識します。
- **安全な外部リソース利用**: 外部のJavaScriptライブラリやコンポーネントを導入する際は、信頼性を確認し、定期的に脆弱性情報をチェックします (例: `npm audit`)。

## クライアントサイド環境変数

[02_architecture_design.md](/docs/restructuring/02_architecture_design.md#環境変数定義とアプリケーション設定) で定義された環境変数のうち、クライアントサイドのJavaScriptコードからアクセス可能なものは、Next.jsの規約に従い `NEXT_PUBLIC_` プレフィックスを付ける必要があります。

```typescript
// 例: config/environment.ts (一部抜粋)
const client = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),
});
```

- **重要**: `NEXT_PUBLIC_` が付いた環境変数は、ビルド時にJavaScriptバンドルに**埋め込まれます**。これは、ブラウザで実行されるコードからアクセス可能になることを意味します。
- したがって、**`NEXT_PUBLIC_` プレフィックスが付いた環境変数には、APIキーやシークレットなどの機密情報を決して含めてはいけません。**
- クライアントサイドで使用する必要があるのは、APIエンドポイントのベースURLや、外部サービス（例: Google Analytics）の公開キーなど、公開されても問題ない情報のみです。

## テスト戦略

クライアントサイドのテスト戦略は [09_testing_implementation.md](/docs/restructuring/09_testing_implementation.md) で詳細に定義されますが、概要は以下の通りです。

### コンポーネントテスト

- **React Testing Library** と **Vitest** (または Jest) を使用して、個々のUIコンポーネントのレンダリング結果やインタラクションをテストします。ユーザー視点でのテストを重視します。

### 統合テスト

- 複数のコンポーネントやフック、状態管理、APIモックなどを組み合わせた機能単位のテストを実施します。React Testing Library を使用します。

### E2Eテスト

- **Playwright** (または Cypress) を使用して、実際のブラウザ環境でユーザーシナリオに基づいたエンドツーエンドのテストを実施します。 