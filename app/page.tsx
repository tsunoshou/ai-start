// ESLintルールを一時的に無効化（Reactコンポーネントは大文字で始める必要があるため）
// eslint-disable-next-line @typescript-eslint/naming-convention
// ConnectionTestコンポーネントの一時的な削除（デプロイ成功のため）
// import ConnectionTest from './components/ConnectionTest';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-bold md:text-6xl">AiStart</h1>
        <p className="mb-10 text-lg md:text-xl">
          AI支援によるビジネスプラン作成支援SaaSプラットフォーム
        </p>
        <div className="rounded-lg bg-gray-50 p-6 shadow-sm">
          <p className="text-base text-gray-700">
            開発環境のセットアップが完了しました。プロジェクトディレクトリ構造がアーキテクチャ設計に従って作成されています。
          </p>
        </div>

        {/* 一時的にConnectionTestコンポーネントを削除 */}
        {/* <ConnectionTest /> */}
      </div>
    </main>
  );
}
