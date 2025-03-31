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
      </div>
    </main>
  );
}
