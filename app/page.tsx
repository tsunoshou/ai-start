// ESLintルールを一時的に無効化（Reactコンポーネントは大文字で始める必要があるため）
// eslint-disable-next-line @typescript-eslint/naming-convention
import Link from 'next/link';

import ConnectionTest from '@/presentation/components/common/ConnectionTest';
import { Button } from '@/presentation/components/ui/button';

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

        <div className="mt-8 flex justify-center gap-4">
          <Button variant="default">はじめる</Button>
          <Button variant="outline">詳細</Button>
          <Button asChild variant="secondary">
            <Link href="/dev-test/user-management">User Management Test</Link>
          </Button>
        </div>

        <ConnectionTest />
      </div>
    </main>
  );
}
