'use client';

import { useState } from 'react';

import { Button } from '@/presentation/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Textarea } from '@/presentation/components/ui/textarea';

/**
 * ユーザー作成APIレスポンスの型（仮）
 * バックエンドの実装に合わせて調整してください
 */
interface CreateUserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 開発テスト用: ユーザー管理機能テストページ
 * 将来的に削除されることを前提としています。
 */
export default function DevUserManagementPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // パスワード入力も追加
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      // TODO: APIエンドポイントは実際のバックエンド実装に合わせてください
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, passwordPlainText: password }), // キーを passwordPlainText に変更
      });

      const data = await response.json();

      if (!response.ok) {
        // エラーレスポンスの形式に合わせて調整してください
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      // 成功時のレスポンス形式に合わせて調整してください
      const user = data as CreateUserResponse;
      setResult(`Success! User created:\n${JSON.stringify(user, null, 2)}`);
      // 成功したらフォームをクリア
      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Failed to create user:', error);
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle>Dev Test: User Creation</CardTitle>
          <CardDescription>
            This is a temporary page for testing user creation functionality. It will be removed
            later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleCreateUser}>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                required
                id="name"
                placeholder="Enter user name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                required
                id="email"
                placeholder="Enter user email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                required
                id="password"
                minLength={8} // Zodスキーマに合わせて最小長を設定
                placeholder="Enter password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button disabled={isLoading} type="submit">
              {isLoading ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
        {result && (
          <CardFooter>
            <div className="mt-4 w-full">
              <Label htmlFor="result">Result</Label>
              <Textarea
                readOnly
                className="h-48 w-full font-mono text-sm"
                id="result"
                placeholder="API response will appear here..."
                value={result}
              />
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
