# クライアント実装コード例 (08_client_implementation.md 対応)

最終更新日: 2025-04-03

このドキュメントは、[08_client_implementation.md](/docs/restructuring/08_client_implementation.md) で説明されているクライアントサイドの実装方針に関する具体的なコード例を提供します。先行するドキュメント (01-07) およびコードサンプルとの整合性を保っています。

## グローバル状態設計 (Context API)

`08_client_implementation.md` の「グローバル状態設計」セクションに対応します。

### 認証状態プロバイダー (Auth.js連携想定)

```typescript
// presentation/providers/AuthProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from 'next-auth'; // next-authからSession型をインポート
import { getSession } from 'next-auth/react'; // クライアントサイドでセッション取得

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const sessionData = await getSession(); // クライアントサイドでセッションを取得
        setSession(sessionData);
      } catch (error) {
        console.error('Failed to fetch session:', error);
        // 必要に応じてエラー処理を追加
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  // isLoadingがtrueの間はローディング表示などを検討
  if (isLoading) {
    // 例: return <GlobalSpinner />;
    return <div>Loading session...</div>; // 仮表示
  }

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**説明:**

*   `next-auth/react` の `getSession` をクライアントサイドで使用して認証セッションを取得します。
*   取得した `Session` 情報とローディング状態を Context で提供します。
*   `useAuth` フックを提供し、各コンポーネントから認証情報にアクセスできるようにします。
*   **注意:** これはクライアントサイドでのセッション取得例です。サーバーコンポーネントでは別の方法（例: `getServerSession`）でセッションを取得します。

### テーマプロバイダー (ダークモード対応例)

```typescript
// presentation/providers/ThemeProvider.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system'; // SSR時はsystemをデフォルトに
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const currentTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);

    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

**説明:**

*   現在のテーマ (`light`, `dark`, `system`) とテーマ設定関数を Context で提供します。
*   `localStorage` を使用してテーマ設定を永続化します。
*   `useEffect` 内で `<html>` タグに `light` または `dark` クラスを適用し、Tailwind CSS の `dark:` 修飾子が機能するようにします。
*   `system` 設定の場合は OS の設定 (`prefers-color-scheme`) に追従します。

## APIエラーハンドリング (TanStack Query & Toast)

`08_client_implementation.md` の「APIクライアント > エラーハンドリング」セクションに対応します。

```typescript
// presentation/hooks/useCustomMutation.ts (TanStack Query ラッパー例)
'use client';

import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { useToast } from '@/presentation/components/common/ui/use-toast'; // shadcn/uiのToastフック
import { AppError } from '@/shared/errors/AppError'; // カスタムエラー型 (想定)
import { handleApiError } from '@/shared/utils/error-handler'; // エラー処理ユーティリティ (想定)
import { Result } from '@/shared/types/Result'; // 02, 04で定義されたResult型 (想定)

// Result<TSuccess, TError> 型を返す Mutation Function を想定
type MutationFn<TData, TVariables> = (variables: TVariables) => Promise<Result<TData, AppError>>;

export const useCustomMutation = <
  TData = unknown,
  TError = AppError, // エラー型はAppErrorをデフォルトに
  TVariables = void,
  TContext = unknown
>(
  mutationFn: MutationFn<TData, TVariables>,
  options?: Omit<UseMutationOptions<Result<TData, AppError>, TError, TVariables, TContext>, 'mutationFn'>
): UseMutationResult<TData, TError, TVariables, TContext> => {

  const { toast } = useToast();

  // useMutationの結果をラップして、成功/失敗時の処理を追加
  const mutationResult = useMutation<Result<TData, AppError>, TError, TVariables, TContext>({
    mutationFn: async (variables) => {
      const result = await mutationFn(variables);
      if (!result.isSuccess) {
        // Resultが失敗の場合、エラーをスローしてonErrorで処理させる
        throw result.error;
      }
      return result; // 成功したResultを返す
    },
    onSuccess: (result, variables, context) => {
      // result は成功した Result<TData, AppError> 型
      toast({
        title: '成功しました',
        description: '操作が正常に完了しました。', // 必要に応じてカスタマイズ
        variant: 'default',
      });
      // 元の onSuccess オプションを実行
      options?.onSuccess?.(result, variables, context);
    },
    onError: (error: TError, variables, context) => {
      console.error('Mutation failed:', error);
      // エラー内容に応じたトースト表示
      const { title, description } = handleApiError(error as AppError); // エラー処理ユーティリティを使用
      toast({
        title: title,
        description: description,
        variant: 'destructive', // エラー用スタイル
      });
      // 元の onError オプションを実行
      options?.onError?.(error, variables, context);
    },
    ...options, // その他のオプションを展開
  });

  // useMutation の返り値から、成功時のデータ (result.data) を直接返すように加工
  // isSuccess フラグなども元の useMutation のものを使用
  return {
    ...mutationResult,
    // 成功した場合、dataには Result.data が入るようにする (オプション)
    // data: mutationResult.data?.isSuccess ? mutationResult.data.data : undefined,
  } as UseMutationResult<TData, TError, TVariables, TContext>; // 型アサーションが必要な場合あり
};

// --- 使用例 ---
// presentation/components/feature-specific/project/CreateProjectButton.tsx
import React from 'react';
import { Button } from '@/presentation/components/common/ui/button';
import { useCustomMutation } from '@/presentation/hooks/useCustomMutation';
import { createProject } from '@/application/usecases/project/create-project'; // API呼び出し関数 (想定)
import { CreateProjectInput } from '@/application/dtos/project-dto'; // DTO (想定)
import { Project } from '@/domain/models/entities/Project'; // ドメインモデル (想定)
import { AppError } from '@/shared/errors/AppError'; // AppError型

const CreateProjectButton = () => {
  // カスタムフックを使用
  const { mutate, isPending } = useCustomMutation<Project, AppError, CreateProjectInput>(
    // Mutation関数 (Result型を返す)
    async (input) => await createProject(input),
    // オプション (キャッシュ更新など)
    {
      onSuccess: (result) => { // resultは Result<Project, AppError> 型
        console.log('Project created:', result.data); // 成功データにアクセス
        // 例: プロジェクトリストのキャッシュを無効化 (TanStack Queryの機能)
        // queryClient.invalidateQueries(['projects']);
      },
      // onErrorはカスタムフック内で処理される
    }
  );

  const handleCreate = () => {
    const projectInput: CreateProjectInput = { name: 'New Project', description: '...' };
    mutate(projectInput);
  };

  return (
    <Button onClick={handleCreate} disabled={isPending}>
      {isPending ? '作成中...' : 'プロジェクト作成'}
    </Button>
  );
};

export default CreateProjectButton;
```

**説明:**

*   `useCustomMutation` フックは `useMutation` をラップし、共通のエラーハンドリングと成功/失敗時のトースト表示を行います。
*   Mutation関数は `Result<SuccessData, AppError>` 型を返すことを前提とします ([02], [04] のエラーハンドリング戦略)。
*   失敗時 (`Result.isSuccess` が `false` またはネットワークエラーなど) は `onError` がトリガーされ、`handleApiError` ユーティリティ (別途定義想定) でエラー内容を解析し、`shadcn/ui` の `Toast` (destructive variant) でユーザーに通知します。
*   成功時はデフォルトの成功メッセージを表示し、オプションで渡された `onSuccess` コールバックを実行します (キャッシュ更新などに利用)。
*   コンポーネント側では、このカスタムフックを使うことで、API呼び出しと基本的なUIフィードバック (ローディング状態、トースト通知) を簡潔に実装できます。

## フォーム管理とバリデーション (React Hook Form & Zod)

`08_client_implementation.md` の「フォーム管理」セクションに対応します。

```typescript
// presentation/components/feature-specific/settings/ProfileForm.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod'; // Zodをインポート
import { Button } from '@/presentation/components/common/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/presentation/components/common/ui/form'; // shadcn/uiのFormコンポーネント
import { Input } from '@/presentation/components/common/ui/input';
import { useToast } from '@/presentation/components/common/ui/use-toast';
import { updateUserProfile } from '@/application/usecases/user/update-profile'; // API呼び出し (想定)
import { UserProfileSchema } from '@/shared/types/schemas/user-schema'; // 共有Zodスキーマ (想定)
import { UserProfileDto } from '@/application/dtos/user-dto'; // DTO (想定)
import { useCustomMutation } from '@/presentation/hooks/useCustomMutation'; // 前述のカスタムフック
import { AppError } from '@/shared/errors/AppError';

// Zodスキーマをインポートまたは定義 (バックエンドと共有推奨)
// 例: shared/types/schemas/user-schema.ts で定義
// export const UserProfileSchema = z.object({
//   name: z.string().min(1, { message: '名前は必須です。' }).max(50),
//   email: z.string().email({ message: '有効なメールアドレスを入力してください。' }),
// });
type UserProfileFormData = z.infer<typeof UserProfileSchema>; // スキーマから型を推論

const ProfileForm = ({ defaultValues }: { defaultValues: UserProfileFormData }) => {
  const { toast } = useToast();
  const form = useForm<UserProfileFormData>({
    resolver: zodResolver(UserProfileSchema), // Zodスキーマをリゾルバーとして設定
    defaultValues: defaultValues,
  });

  const { mutate, isPending } = useCustomMutation<UserProfileDto, AppError, UserProfileFormData>(
    async (data) => await updateUserProfile(data), // API呼び出し
    {
      onSuccess: (result) => {
        toast({ title: 'プロフィールを更新しました' });
        // 必要に応じてフォームをリセット or 最新データで更新
        form.reset(result.data); // 例: 更新後のデータをフォームに反映
      },
      onError: (error) => {
        // useCustomMutation内で基本的なトーストは表示される
        // 必要であれば追加のエラー処理 (例: 特定フィールドのエラーをform.setErrorでセット)
        if (error.code === 'VALIDATION_ERROR' && error.details) {
           // サーバー側バリデーションエラーをフォームに反映させる例
           Object.entries(error.details).forEach(([field, message]) => {
             form.setError(field as keyof UserProfileFormData, { type: 'server', message });
           });
        }
      }
    }
  );

  function onSubmit(data: UserProfileFormData) {
    mutate(data);
  }

  return (
    // shadcn/ui の Form コンポーネントを使用
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名前</FormLabel>
              <FormControl>
                <Input placeholder="山田 太郎" {...field} />
              </FormControl>
              <FormDescription>
                表示される名前です。
              </FormDescription>
              <FormMessage /> {/* バリデーションエラーメッセージがここに表示される */}
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>メールアドレス</FormLabel>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage /> {/* バリデーションエラーメッセージがここに表示される */}
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? '更新中...' : 'プロフィールを更新'}
        </Button>
      </form>
    </Form>
  );
};

export default ProfileForm;

```

**説明:**

*   `react-hook-form` と `zodResolver` を使用してフォームの状態管理とバリデーションを行います。
*   バリデーションスキーマは `Zod` を使用し、バックエンドと共有すること ([04], [07]) が推奨されます。`z.infer` でフォームデータの型を推論します。
*   `shadcn/ui` の `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` コンポーネント群を使って、アクセシブルで一貫性のあるフォームUIとエラー表示を構築します。`FormMessage` が自動的に対応するフィールドのエラーを表示します。
*   フォーム送信時には、前述の `useCustomMutation` フックを使用してAPI呼び出しと結果のハンドリング（成功/エラー通知）を行います。
*   サーバー側での追加バリデーションエラーが発生した場合、`onError` 内で `form.setError` を使ってフォームにエラーを反映させることも可能です。

## 国際化対応 (next-intl)

`08_client_implementation.md` の「国際化対応(i18n)」セクションに対応します。

```typescript
// --- 翻訳メッセージの使用例 ---
// presentation/components/common/WelcomeMessage.tsx
'use client';

import React from 'react';
import { useTranslations } from 'next-intl'; // next-intlフック

const WelcomeMessage = ({ userName }: { userName: string }) => {
  // 'common' ネームスペースから翻訳を取得 (i18n/locales/en.json などで定義)
  // {
  //   "common": {
  //     "welcome": "ようこそ、{name}さん！",
  //     "description": "AiStartへようこそ。プロジェクトを開始しましょう。"
  //   }
  // }
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome', { name: userName })}</h1> {/* 変数埋め込み */}
      <p>{t('description')}</p>
    </div>
  );
};

export default WelcomeMessage;


// --- 日付・数値フォーマットの使用例 ---
// presentation/components/feature-specific/project/ProjectDetails.tsx
'use client';

import React from 'react';
import { useFormatter, useTranslations } from 'next-intl'; // next-intlフック
import { Project } from '@/domain/models/entities/Project'; // ドメインモデル (想定)

const ProjectDetails = ({ project }: { project: Project }) => {
  const format = useFormatter(); // フォーマッターを取得
  const t = useTranslations('project'); // 'project'ネームスペース

  const createdAt: Date = new Date(project.createdAt); // 文字列等をDateオブジェクトに
  const budget: number = project.budget || 0; // 仮の予算フィールド

  return (
    <div>
      <h2>{project.name}</h2>
      <p>{project.description}</p>
      <p>
        {t('createdAt')}: {format.dateTime(createdAt, 'medium')} {/* 日付フォーマット */}
      </p>
      <p>
        {t('budget')}: {format.number(budget, { style: 'currency', currency: 'JPY' })} {/* 通貨フォーマット (ロケール依存) */}
      </p>
       {/* {
         "project": {
           "createdAt": "作成日",
           "budget": "予算"
         }
       } */}
    </div>
  );
};

export default ProjectDetails;
```

**説明:**

*   `next-intl` の `useTranslations` フックを使用して、現在のロケールに対応する翻訳メッセージを取得します。ネームスペース（例: `common`, `project`）を指定してメッセージを整理します。メッセージ内での変数埋め込みも可能です。
*   `useFormatter` フックを使用して、日付、時刻、数値を現在のロケールに合わせてフォーマットします。`format.dateTime()` や `format.number()` などを使用し、オプションでスタイル（`medium`, `long` や `currency` など）を指定できます。
*   これらのフックは `'use client'` が指定されたクライアントコンポーネントで使用します。サーバーコンポーネントでは `getTranslator` や `getFormatter` を使用します ([next-intl ドキュメント参照](https://next-intl.dev/docs/getting-started))。


</rewritten_file>