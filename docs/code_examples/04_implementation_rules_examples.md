# 実装ルール・命名規則のコード例集

最終更新日: 2025-03-26

このドキュメントは、[04_implementation_rules.md](../04_implementation_rules.md)で説明されている実装ルールと命名規則に関するコードサンプルを集約したものです。
概念の詳細な説明については、メインドキュメントを参照してください。

## リンター設定例

```javascript
// .eslintrc.js
module.exports = {
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // 基本的なルール
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],

    // インポート順序のルール
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],

    // React関連のルール
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: true,
        reservedFirst: true,
      },
    ],

    // 命名規則のルール
    '@typescript-eslint/naming-convention': [
      'error',
      // デフォルトケース
      {
        selector: 'default',
        format: ['camelCase'],
      },
      // 変数のケース
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
      },
      // 一般的な関数名はcamelCaseのみ
      {
        selector: 'function',
        format: ['camelCase'],
      },
      // Reactコンポーネント関数（app/ ディレクトリ内の関数）はPascalCaseを許可
      {
        selector: 'function',
        filter: {
          // app/ ディレクトリ内のページ/レイアウトコンポーネントに一致
          regex: '^.+/(page|layout|loading|error|template|not-found)\\.[jt]sx?$',
          match: true,
        },
        format: ['PascalCase'],
      },
      // presentation/components/ ディレクトリ内の関数はPascalCaseを許可
      {
        selector: 'function',
        filter: {
          regex: '^.+/components/.+\\.[jt]sx?$',
          match: true,
        },
        format: ['PascalCase'],
      },
      // .tsx ファイル内の大文字で始まる関数はPascalCaseを許可
      {
        selector: 'function',
        filter: {
          regex: '^[A-Z].+$',
          match: true,
        },
        format: ['PascalCase'],
      },
      // インターフェース名はIプレフィックスなし
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
      // 型名はPascalCase
      {
        selector: 'typeLike',
        format: ['PascalCase'],
      },
      // グローバル定数は大文字スネークケース（metadataとconfigは例外）
      {
        selector: 'variable',
        modifiers: ['const', 'global'],
        format: ['UPPER_CASE'],
        filter: {
          regex: '^(metadata|config)$',
          match: false,
        },
      },
      // enumメンバーはPascalCase
      {
        selector: 'enumMember',
        format: ['PascalCase'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
```

## Prettierの設定例

```javascript
// .prettierrc.js
module.exports = {
  semi: true,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  jsxSingleQuote: false,
  bracketSameLine: false,
  plugins: ['prettier-plugin-tailwindcss'],
};
```

## Prettierの無視設定例

```bash
# .prettierignore
# ビルド生成物
.next/
out/
build/
dist/

# 依存関係
node_modules/

# 各種設定ファイル
next.config.js
next-env.d.ts
postcss.config.js
tailwind.config.js

# 公開フォルダ
public/

# ロック/キャッシュファイル
package-lock.json
yarn.lock
.vercel
.env
.env.*

# Supabase
supabase/

# ドキュメント
docs/**/*.md
```

## 命名規則の例

### ファイル命名規則

```
# コンポーネントファイル
ButtonPrimary.tsx            # 単一コンポーネント（PascalCase）
UserProfileCard/             # 複合コンポーネント（ディレクトリ）
├── index.tsx                # エクスポート
├── UserProfileCard.tsx      # メインコンポーネント
├── UserProfileAvatar.tsx    # サブコンポーネント
└── useUserProfileData.ts    # 関連フック

# ユーティリティファイル
format-date.ts               # 単一の関数を含むユーティリティ（kebab-case）
string-utils/                # 関連するユーティリティのグループ（ディレクトリ）
├── index.ts                 # エクスポート
├── format-string.ts         # 文字列フォーマット関数
└── validate-string.ts       # 文字列検証関数

# 型定義ファイル
user-types.ts                # ドメイン固有の型定義（kebab-case）
api-types.ts                 # APIレスポンス/リクエスト型定義

# サーバーアクション
user-actions.ts              # ユーザー関連のサーバーアクション
```

### 変数・関数の命名規則

```typescript
// 変数の命名（camelCase）
const userName = 'John Doe';
const userCount = 42;
const isActive = true;

// 定数の命名（UPPER_SNAKE_CASE）
const MAX_RETRY_COUNT = 3;
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT_MS = 5000;

// 関数の命名（camelCase、動詞で始まる）
function getUserById(id: string): User {
  // 実装...
}

// コンポーネントの命名（PascalCase）
function UserProfileCard({ user }: UserProfileCardProps) {
  // 実装...
}

// フックの命名（use接頭辞）
function useUserData(userId: string) {
  // 実装...
}

// サーバーアクションの命名（接頭辞に基づくグループ化）
export async function fetchUserData(userId: string) {
  // 実装...
}

export async function createUserProfile(data: CreateUserProfileRequest) {
  // 実装...
}

export async function updateUserPreferences(userId: string, preferences: UserPreferences) {
  // 実装...
}

// イベントハンドラの命名（handle + 名詞 + イベント）
function handleButtonClick() {
  // 実装...
}

function handleFormSubmit(event: FormEvent) {
  // 実装...
}
```

## コンポーネント実装規則の例

### コンポーネント基本構造

````tsx
// ProfileCard.tsx
import { useState } from 'react';
import Image from 'next/image';
import { Avatar, Card, Button } from '@/components/ui';
import { formatDate } from '@/utils/format-date';
import type { User } from '@/types/user-types';

export interface ProfileCardProps {
  /** ユーザー情報オブジェクト */
  user: User;
  /** カードクリック時のコールバック関数 */
  onCardClick?: (userId: string) => void;
  /** カードのサイズバリエーション */
  size?: 'sm' | 'md' | 'lg';
  /** カードが選択可能かどうか */
  isSelectable?: boolean;
}

/**
 * ユーザープロファイル情報を表示するカードコンポーネント
 *
 * @example
 * ```tsx
 * <ProfileCard
 *   user={currentUser}
 *   size="md"
 *   onCardClick={handleProfileSelect}
 * />
 * ```
 */
export function ProfileCard({
  user,
  onCardClick,
  size = 'md',
  isSelectable = false,
}: ProfileCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 内部状態の変更を処理する関数
  const handleExpandToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  // 親コンポーネントのコールバックへのイベント委譲
  const handleClick = () => {
    if (isSelectable && onCardClick) {
      onCardClick(user.id);
    }
  };

  // クラス名の条件付き構築
  const cardClasses = [
    'profile-card',
    `profile-card--${size}`,
    isSelectable ? 'profile-card--selectable' : '',
    isExpanded ? 'profile-card--expanded' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Card className={cardClasses} onClick={handleClick} data-testid="profile-card">
      <div className="profile-card__header">
        <Avatar src={user.avatarUrl} alt={`${user.name}のプロフィール画像`} size={size} />
        <h3 className="profile-card__name">{user.name}</h3>
      </div>

      {isExpanded && (
        <div className="profile-card__details">
          <p className="profile-card__bio">{user.bio}</p>
          <p className="profile-card__member-since">登録日: {formatDate(user.createdAt)}</p>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="profile-card__expand-button"
        onClick={handleExpandToggle}
        aria-expanded={isExpanded}
      >
        {isExpanded ? '詳細を隠す' : '詳細を表示'}
      </Button>
    </Card>
  );
}
````

### サーバーコンポーネントの例

```tsx
// UserDashboard.tsx
import { Suspense } from 'react';
import { getUserStats } from '@/actions/user-actions';
import { ErrorBoundary } from '@/components/error-handling/ErrorBoundary';
import { LoadingIndicator } from '@/components/ui/LoadingIndicator';
import { UserStatsDisplay } from './UserStatsDisplay';
import { RecentActivityFeed } from './RecentActivityFeed';

interface UserDashboardProps {
  userId: string;
}

/**
 * ユーザーダッシュボードのサーバーコンポーネント
 * ユーザーの統計情報と最近のアクティビティを表示します
 */
export async function UserDashboard({ userId }: UserDashboardProps) {
  // サーバーサイドでデータを取得
  const userStats = await getUserStats(userId);

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">ダッシュボード</h1>

      <section className="stats-section">
        <h2 className="section-title">統計情報</h2>
        <ErrorBoundary fallback={<p>統計情報の読み込みに失敗しました</p>}>
          <UserStatsDisplay stats={userStats} />
        </ErrorBoundary>
      </section>

      <section className="activity-section">
        <h2 className="section-title">最近のアクティビティ</h2>
        <ErrorBoundary fallback={<p>アクティビティの読み込みに失敗しました</p>}>
          <Suspense fallback={<LoadingIndicator />}>
            {/* @ts-expect-error サーバーコンポーネント */}
            <RecentActivityFeed userId={userId} />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
}
```

### クライアントコンポーネントの例

```tsx
// UserPreferences.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateUserPreferences } from '@/actions/user-actions';
import { userPreferencesSchema } from '@/schemas/user-schemas';
import { Button, Form, FormField, Switch, Select } from '@/components/ui';
import { useToast } from '@/hooks/use-toast';
import type { UserPreferences } from '@/types/user-types';

interface UserPreferencesFormProps {
  initialPreferences: UserPreferences;
  userId: string;
}

/**
 * ユーザー設定を編集するフォームコンポーネント（クライアントコンポーネント）
 */
export function UserPreferencesForm({ initialPreferences, userId }: UserPreferencesFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserPreferences>({
    resolver: zodResolver(userPreferencesSchema),
    defaultValues: initialPreferences,
  });

  async function handleSubmit(data: UserPreferences) {
    try {
      setIsSubmitting(true);
      await updateUserPreferences(userId, data);
      toast({
        title: '設定を保存しました',
        variant: 'success',
      });
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      toast({
        title: '設定の保存に失敗しました',
        description: error instanceof Error ? error.message : '不明なエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="theme"
          render={({ field }) => (
            <Select
              label="テーマ"
              options={[
                { value: 'light', label: 'ライト' },
                { value: 'dark', label: 'ダーク' },
                { value: 'system', label: 'システム設定に合わせる' },
              ]}
              {...field}
            />
          )}
        />

        <FormField
          control={form.control}
          name="emailNotifications"
          render={({ field }) => (
            <Switch
              label="メール通知"
              description="重要な更新情報をメールで受け取る"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />

        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <Select
              label="言語"
              options={[
                { value: 'ja', label: '日本語' },
                { value: 'en', label: '英語' },
              ]}
              {...field}
            />
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting || !form.formState.isDirty}
          loading={isSubmitting}
        >
          設定を保存
        </Button>
      </form>
    </Form>
  );
}
```

## サーバーアクションの実装例

```typescript
// user-actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { UserPreferences, User } from '@/types/user-types';

/**
 * ユーザー設定更新のサーバーアクション
 *
 * @param userId ユーザーID
 * @param preferences 更新するユーザー設定
 * @returns 更新後のユーザー設定
 * @throws {ApiError} データベース操作に失敗した場合
 */
export async function updateUserPreferences(
  userId: string,
  preferences: UserPreferences
): Promise<UserPreferences> {
  // 入力値のバリデーション
  const preferencesSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']),
    emailNotifications: z.boolean(),
    language: z.enum(['ja', 'en']),
  });

  try {
    // バリデーション実行
    const validatedData = preferencesSchema.parse(preferences);

    // ユーザーの存在確認と権限チェック
    const session = await getAuthSession();
    if (!session || session.user.id !== userId) {
      throw new ApiError({
        statusCode: 403,
        message: '権限がありません',
        code: 'FORBIDDEN',
      });
    }

    // データベース操作
    const updatedPreferences = await db.userPreferences.update({
      where: { userId },
      data: validatedData,
    });

    // キャッシュの再検証
    revalidatePath(`/users/${userId}/settings`);

    // 変更をログに記録
    logger.info('ユーザー設定を更新しました', {
      userId,
      changes: validatedData,
    });

    return updatedPreferences;
  } catch (error) {
    // エラーハンドリング
    if (error instanceof z.ZodError) {
      throw new ApiError({
        statusCode: 400,
        message: 'データ形式が不正です',
        code: 'VALIDATION_ERROR',
        cause: error,
      });
    }

    logger.error('ユーザー設定の更新に失敗しました', {
      userId,
      error,
    });

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError({
      statusCode: 500,
      message: 'サーバー内部エラーが発生しました',
      code: 'INTERNAL_SERVER_ERROR',
      cause: error,
    });
  }
}

/**
 * ユーザーの統計情報を取得するサーバーアクション
 */
export async function getUserStats(userId: string) {
  try {
    // 実際の実装...
    return {
      totalPosts: 42,
      followers: 123,
      following: 56,
      lastActive: new Date(),
    };
  } catch (error) {
    logger.error('ユーザー統計情報の取得に失敗しました', {
      userId,
      error,
    });
    throw new ApiError({
      statusCode: 500,
      message: 'ユーザー統計情報の取得に失敗しました',
      code: 'STATS_FETCH_ERROR',
      cause: error,
    });
  }
}
```

## エラーハンドリングとログ記録の例

```typescript
// error-handling-example.ts
import { logger } from '@/lib/logger';
import { ApiError } from '@/lib/errors';
import type { User } from '@/types/user-types';

/**
 * 例外処理とログ記録の実装例
 */
async function fetchAndProcessUserData(userId: string): Promise<User> {
  try {
    logger.debug('ユーザーデータの取得を開始', { userId });

    // 外部APIからのデータ取得（エラーが発生する可能性あり）
    const response = await fetch(`https://api.example.com/users/${userId}`);

    // HTTPエラーチェック
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError({
        statusCode: response.status,
        message: 'ユーザーデータの取得に失敗しました',
        code: 'API_ERROR',
        metadata: {
          userId,
          responseStatus: response.status,
          errorData,
        },
      });
    }

    const userData = await response.json();

    // データ処理（条件に応じたエラー発生）
    if (!userData.isActive) {
      logger.warn('非アクティブユーザーへのアクセス試行', { userId });
      throw new ApiError({
        statusCode: 403,
        message: 'このユーザーは現在非アクティブです',
        code: 'USER_INACTIVE',
        metadata: { userId },
      });
    }

    logger.info('ユーザーデータの取得に成功', { userId });
    return userData;
  } catch (error) {
    // エラー種別に応じた処理
    if (error instanceof ApiError) {
      // 既知のAPIエラーは再スロー
      logger.error('APIエラーが発生しました', {
        code: error.code,
        message: error.message,
        metadata: error.metadata,
      });
      throw error;
    }

    if (error instanceof TypeError || error instanceof SyntaxError) {
      // クライアントコードのエラー
      logger.error('データ処理中にエラーが発生しました', {
        error: error.message,
        stack: error.stack,
        userId,
      });
      throw new ApiError({
        statusCode: 500,
        message: 'データの処理中にエラーが発生しました',
        code: 'DATA_PROCESSING_ERROR',
        cause: error,
      });
    }

    // その他の未知のエラー
    logger.error('予期しないエラーが発生しました', {
      error: error instanceof Error ? error.message : String(error),
      userId,
    });
    throw new ApiError({
      statusCode: 500,
      message: '予期しないエラーが発生しました',
      code: 'UNKNOWN_ERROR',
      cause: error,
    });
  }
}
```

## テスト実装例

```typescript
// profile-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileCard } from './ProfileCard';
import type { User } from '@/types/user-types';

// テストデータ
const mockUser: User = {
  id: 'user-123',
  name: '山田太郎',
  avatarUrl: '/images/avatars/default.png',
  bio: 'ソフトウェアエンジニア',
  createdAt: new Date('2023-01-15'),
};

describe('ProfileCard', () => {
  // 基本的なレンダリングテスト
  it('正しくユーザー情報をレンダリングする', () => {
    render(<ProfileCard user={mockUser} />);

    // 要素の存在確認
    expect(screen.getByText('山田太郎')).toBeInTheDocument();
    expect(screen.getByAltText('山田太郎のプロフィール画像')).toBeInTheDocument();
    expect(screen.getByText('詳細を表示')).toBeInTheDocument();

    // 初期状態では詳細が表示されないことを確認
    expect(screen.queryByText('ソフトウェアエンジニア')).not.toBeInTheDocument();
  });

  // インタラクションテスト
  it('詳細ボタンをクリックすると詳細情報が表示される', () => {
    render(<ProfileCard user={mockUser} />);

    // 詳細ボタンをクリック
    fireEvent.click(screen.getByText('詳細を表示'));

    // 詳細情報が表示されることを確認
    expect(screen.getByText('ソフトウェアエンジニア')).toBeInTheDocument();
    expect(screen.getByText(/登録日:/)).toBeInTheDocument();
    expect(screen.getByText('詳細を隠す')).toBeInTheDocument();
  });

  // プロップスのコールバックテスト
  it('選択可能な場合、クリック時にコールバックが呼ばれる', () => {
    const handleClick = jest.fn();

    render(
      <ProfileCard
        user={mockUser}
        isSelectable={true}
        onCardClick={handleClick}
      />
    );

    // カード全体をクリック
    fireEvent.click(screen.getByTestId('profile-card'));

    // コールバックが正しく呼ばれたことを確認
    expect(handleClick).toHaveBeenCalledWith('user-123');
  });

  // 条件付きレンダリングのテスト
  it('選択可能でない場合、クリックしてもコールバックは呼ばれない', () => {
    const handleClick = jest.fn();

    render(
      <ProfileCard
        user={mockUser}
        isSelectable={false}
        onCardClick={handleClick}
      />
    );

    // カード全体をクリック
    fireEvent.click(screen.getByTestId('profile-card'));

    // コールバックが呼ばれないことを確認
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

## Tailwind CSSの使用例

```tsx
// TailwindStylesExample.tsx
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Task } from '@/types/task-types';

interface TaskListItemProps {
  task: Task;
  onClick: (taskId: string) => void;
}

/**
 * タスクリストアイテムコンポーネント
 * Tailwind CSSを使用したスタイリング例
 */
export function TaskListItem({ task, onClick }: TaskListItemProps) {
  // ステータスに応じたバッジの色を決定
  const getBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'inProgress':
        return 'warning';
      case 'todo':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // 優先度に応じたクラス名を生成
  const priorityClasses =
    {
      high: 'border-l-4 border-red-500',
      medium: 'border-l-4 border-yellow-500',
      low: 'border-l-4 border-green-500',
    }[task.priority] || '';

  return (
    <Card
      className={`focus:ring-primary mb-3 p-4 transition-all hover:shadow-md focus:outline-none focus:ring-2 ${priorityClasses} ${task.status === 'completed' ? 'opacity-70' : 'opacity-100'} `}
      onClick={() => onClick(task.id)}
      tabIndex={0}
      data-testid={`task-item-${task.id}`}
    >
      <div className="flex items-center justify-between">
        <h3
          className={`text-lg font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : ''} `}
        >
          {task.title}
        </h3>

        <Badge variant={getBadgeVariant(task.status)}>{task.status}</Badge>
      </div>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{task.description}</p>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          期限: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('ja-JP') : '未設定'}
        </span>

        <div className="flex space-x-2">
          {task.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-gray-200 px-2 py-1 dark:bg-gray-700">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

## メディアクエリと応答性の例

```tsx
// ResponsiveLayoutExample.tsx
/**
 * レスポンシブデザインの実装例
 * Tailwind CSSのブレークポイントを使用
 */
export function ProductGrid({ products }) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold md:text-3xl lg:text-4xl">商品一覧</h1>

      {/* レスポンシブグリッドレイアウト */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => (
          <div
            key={product.id}
            className="rounded-lg border bg-white p-4 shadow-sm transition-transform hover:scale-105 dark:border-gray-700 dark:bg-gray-800"
          >
            {/* 商品画像 - 異なる画面サイズで異なるサイズを使用 */}
            <div className="aspect-square overflow-hidden rounded-md">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* 商品情報 - モバイルでは縦方向、デスクトップでは横方向のレイアウト */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <p className="text-primary-600 mt-1 text-lg font-bold md:mt-0">
                ¥{product.price.toLocaleString()}
              </p>
            </div>

            {/* モバイルでは省略表示、デスクトップでは通常表示 */}
            <p className="mt-2 line-clamp-2 text-sm text-gray-600 md:line-clamp-none dark:text-gray-300">
              {product.description}
            </p>

            {/* モバイルでは縦並び、デスクトップでは横並びのボタン */}
            <div className="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
              <button className="btn-primary flex-1">カートに追加</button>
              <button className="btn-outline flex-1">詳細を見る</button>
            </div>
          </div>
        ))}
      </div>

      {/* 表示切り替えボタン - モバイルのみ表示 */}
      <div className="fixed bottom-4 right-4 sm:hidden">
        <button className="btn-circle btn-primary">
          <FilterIcon className="h-5 w-5" />
        </button>
      </div>

      {/* フィルターパネル - デスクトップでは常に表示、モバイルでは非表示 */}
      <aside className="mt-8 hidden rounded-lg border p-4 lg:block dark:border-gray-700">
        <h2 className="text-xl font-semibold">フィルター</h2>
        {/* フィルターコンテンツ */}
      </aside>
    </div>
  );
}
```

## 相互参照情報

このドキュメントは[04_implementation_rules.md](../04_implementation_rules.md)で説明されている実装ルールと命名規則に関する具体的なコード例を提供しています。以下のドキュメントも参照してください：

- [02_architecture_design_examples.md](./02_architecture_design_examples.md) - アーキテクチャ設計の実装例
- [05_type_definitions_examples.md](./05_type_definitions_examples.md) - 型定義の実装例
- [06_utility_functions_examples.md](./06_utility_functions_examples.md) - ユーティリティ関数の実装例

04_implementation_rules.mdの各セクションと、このコード例集の対応関係は以下の通りです：

1. **リンター設定** - リンター設定例、Prettierの設定例
2. **命名規則** - ファイル命名規則、変数・関数の命名規則
3. **コンポーネント実装規則** - コンポーネント基本構造、サーバーコンポーネント例、クライアントコンポーネント例
4. **サーバーアクション実装** - サーバーアクションの実装例
5. **エラーハンドリング** - エラーハンドリングとログ記録の例
6. **テスト実装** - テスト実装例
7. **スタイリング** - Tailwind CSSの使用例、メディアクエリと応答性の例

🦄
