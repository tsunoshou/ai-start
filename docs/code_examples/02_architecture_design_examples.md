# 02_architecture_design_examples.md

最終更新日: 2025-03-26

## 本ドキュメントの目的

このドキュメントは「[02_architecture_design.md](02_architecture_design.md)」で定義されているアーキテクチャ設計の具体的な実装例を提供します。アーキテクチャの概念的な説明は元ドキュメントを参照し、このドキュメントでは実際のコード例に焦点を当てています。

## アーキテクチャスタイル実装例

### クリーンアーキテクチャの実装

```typescript
// src/domain/models/User.ts
/**
 * ユーザードメインモデル
 * @description ビジネスロジックに関わるユーザーの中心的なデータモデル
 */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}
```

```typescript
// src/application/services/UserService.ts
import { User } from '@/domain/models/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { injectable, inject } from 'tsyringe';

/**
 * ユーザー関連のユースケースを実装するサービス
 * @description ドメインロジックを組み合わせ、アプリケーション固有の機能を提供する
 */
@injectable()
export class UserService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('Logger') private logger: Logger
  ) {}

  /**
   * ユーザー情報を取得する
   * @param userId 取得するユーザーのID
   * @returns 指定されたユーザー情報
   * @throws ユーザーが見つからない場合はNotFoundException
   */
  async getUserById(userId: string): Promise<User> {
    this.logger.info(`ユーザー情報取得 ID: ${userId}`);
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user;
  }
}
```

```typescript
// src/infrastructure/repositories/UserRepositoryImpl.ts
import { User } from '@/domain/models/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { UserMapper } from '@/infrastructure/mappers/UserMapper';
import { injectable, inject } from 'tsyringe';

/**
 * ユーザーリポジトリの実装クラス
 * @description データベースアクセスとドメインモデルの変換を担当
 */
@injectable()
export class SupabaseUserRepository implements UserRepository {
  constructor() {}

  async findByEmail(email: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!result) return null;

    return UserMapper.toDomain(result);
  }

  async findById(id: string): Promise<User | null> {
    const result = await db.query.users.findFirst({
      where: eq(users.id, id),
    });

    if (!result) return null;

    return UserMapper.toDomain(result);
  }

  async create(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    await db.insert(users).values(data);
  }

  async update(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    await db.update(users).set(data).where(eq(users.id, user.id));
  }
}
```

### ディレクトリ構造例と各レイヤーの実装

```typescript
// src/domain/repositories/UserRepository.ts
import { User } from '@/domain/models/User';

/**
 * ユーザーリポジトリのインターフェース
 * @description ドメインモデルのユーザーに対する永続化操作を定義
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
```

```typescript
// src/infrastructure/mappers/UserMapper.ts
import { User, UserRole } from '@/domain/models/User';
import { User as UserEntity } from '@prisma/client';
import { injectable } from 'tsyringe';

/**
 * ユーザーエンティティとドメインモデル間の変換を行うマッパー
 */
@injectable()
export class UserMapper {
  /**
   * データベースエンティティからドメインモデルへの変換
   * @param entity データベースから取得したユーザーエンティティ
   * @returns ドメインモデルに変換されたユーザー
   */
  toDomain(entity: UserEntity): User {
    return {
      id: entity.id,
      email: entity.email,
      displayName: entity.displayName || '',
      role: entity.role as UserRole,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * ドメインモデルからデータベースエンティティへの変換
   * @param domain ドメインモデルのユーザー
   * @returns データベース保存用のエンティティ
   */
  toEntity(domain: User): Omit<UserEntity, 'password'> & { password?: string } {
    return {
      id: domain.id,
      email: domain.email,
      displayName: domain.displayName,
      role: domain.role,
      createdAt: domain.createdAt,
      updatedAt: new Date(),
    };
  }
}
```

## モジュール分割と依存関係の設計

### DIコンテナの実装

```typescript
// src/infrastructure/di/container.ts
import { container } from 'tsyringe';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { users } from '@/db/schema';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { SupabaseUserRepository } from '@/infrastructure/repositories/SupabaseUserRepository';
import { UserService } from '@/application/services/UserService';
import { UserMapper } from '@/infrastructure/mappers/UserMapper';
import { Logger } from '@/domain/services/Logger';
import { LoggerImpl } from '@/infrastructure/services/LoggerImpl';

/**
 * 依存性注入コンテナの設定
 * @description アプリケーション起動時に呼び出され、依存関係を設定する
 */
export function setupContainer(): void {
  // シングルトンインスタンス
  container.registerSingleton<Logger>('Logger', LoggerImpl);

  // マッパー
  container.registerSingleton<UserMapper>('UserMapper', UserMapper);

  // リポジトリ
  container.registerSingleton<UserRepository>('UserRepository', SupabaseUserRepository);

  // サービス
  container.registerSingleton<UserService>(UserService);
}
```

### モジュール間依存関係の実装

```typescript
// src/application/usecases/CreateUserUseCase.ts
import { User, UserRole } from '@/domain/models/User';
import { UserRepository } from '@/domain/repositories/UserRepository';
import { IdGenerator } from '@/domain/services/IdGenerator';
import { PasswordHasher } from '@/domain/services/PasswordHasher';
import { injectable, inject } from 'tsyringe';
import { CreateUserDto } from '@/application/dtos/CreateUserDto';
import { EmailService } from '@/domain/services/EmailService';

/**
 * ユーザー作成ユースケース
 * @description 新規ユーザーの作成プロセスを実装
 */
@injectable()
export class CreateUserUseCase {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('IdGenerator') private idGenerator: IdGenerator,
    @inject('PasswordHasher') private passwordHasher: PasswordHasher,
    @inject('EmailService') private emailService: EmailService
  ) {}

  /**
   * 新規ユーザーを作成する
   * @param dto ユーザー作成に必要なデータ
   * @returns 作成されたユーザー
   * @throws メールアドレスがすでに使用されている場合はDuplicateEmailException
   */
  async execute(dto: CreateUserDto): Promise<User> {
    // メールアドレスの重複チェック
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new DuplicateEmailException(dto.email);
    }

    // 新規ユーザー作成
    const newUser: User = {
      id: this.idGenerator.generate(),
      email: dto.email,
      displayName: dto.displayName,
      role: UserRole.USER,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // パスワードハッシュ化とユーザー保存は別のサービスに委譲
    const hashedPassword = await this.passwordHasher.hash(dto.password);
    const createdUser = await this.userRepository.save({ ...newUser, password: hashedPassword });

    // ウェルカムメール送信はドメインサービスに委譲
    await this.emailService.sendWelcomeEmail(createdUser.email, createdUser.displayName);

    return createdUser;
  }
}
```

## APIエンドポイント設計とルーティング

### サーバーアクションの実装

```typescript
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe';
import { UserService } from '@/application/services/UserService';
import { ApiErrorHandler } from '@/infrastructure/api/ApiErrorHandler';

/**
 * ユーザー情報取得API
 * @description 指定されたIDのユーザー情報を取得する
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userService = container.resolve(UserService);
    const user = await userService.getUserById(params.id);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}

/**
 * ユーザー情報更新API
 * @description 指定されたIDのユーザー情報を更新する
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userService = container.resolve(UserService);
    const updateData = await request.json();

    const updatedUser = await userService.updateUser(params.id, updateData);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    return ApiErrorHandler.handle(error);
  }
}
```

### クライアントデータフェッチの実装

```typescript
// src/app/users/[id]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UserProfile } from '@/components/users/UserProfile';
import { getUserById } from '@/app/_actions/user-actions';

interface UserPageProps {
  params: {
    id: string;
  };
}

/**
 * ユーザープロフィールページのメタデータ生成
 */
export async function generateMetadata({ params }: UserPageProps): Promise<Metadata> {
  const user = await getUserById(params.id).catch(() => null);

  if (!user) {
    return {
      title: 'ユーザーが見つかりません'
    };
  }

  return {
    title: `${user.displayName}のプロフィール | AiStart`,
    description: `${user.displayName}のユーザープロフィールページです。`
  };
}

/**
 * ユーザープロフィールページ
 */
export default async function UserPage({ params }: UserPageProps) {
  const user = await getUserById(params.id).catch(() => null);

  if (!user) {
    notFound();
  }

  return (
    <main className="container mx-auto py-8">
      <UserProfile user={user} />
    </main>
  );
}
```

```typescript
// src/app/_actions/user-actions.ts
'use server';

import { container } from 'tsyringe';
import { UserService } from '@/application/services/UserService';
import { CreateUserDto } from '@/application/dtos/CreateUserDto';
import { User } from '@/domain/models/User';

/**
 * ユーザー情報取得アクション
 * @param id 取得するユーザーID
 * @returns ユーザー情報
 */
export async function getUserById(id: string): Promise<User> {
  const userService = container.resolve(UserService);
  return await userService.getUserById(id);
}

/**
 * ユーザー作成アクション
 * @param userData 作成するユーザーのデータ
 * @returns 作成されたユーザー情報
 */
export async function createUser(userData: CreateUserDto): Promise<User> {
  const userService = container.resolve(UserService);
  return await userService.createUser(userData);
}
```

## データベース設計と実装

### Prismaスキーマ定義

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id          String    @id
  email       String    @unique
  password    String
  displayName String?
  role        String    @default("USER")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  profile     Profile?
  sessions    Session[]

  @@map("users")
}

model Profile {
  id          String   @id
  userId      String   @unique @map("user_id")
  bio         String?
  avatarUrl   String?  @map("avatar_url")
  preferences Json?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Session {
  id        String   @id
  userId    String   @map("user_id")
  token     String   @unique
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("sessions")
}
```

### マイグレーション実行スクリプト

```typescript
// scripts/migrate.ts
import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * マイグレーション実行スクリプト
 * @description 開発環境とテスト環境でのマイグレーション実行を支援
 */
async function migrate() {
  console.log('🚀 マイグレーションを開始します...');

  try {
    // マイグレーション実行
    await execAsync('npx prisma migrate deploy');
    console.log('✅ マイグレーションが完了しました');

    // 接続テスト
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ データベース接続テスト成功');
    await prisma.$disconnect();

    console.log('🎉 すべての操作が完了しました');
  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error);
    process.exit(1);
  }
}

migrate();
```

## 認証・認可の実装アーキテクチャ

### 認証ミドルウェア

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/application/services/AuthService';
import { container } from 'tsyringe';

/**
 * 認証ミドルウェア
 * @description リクエストのセッショントークンを検証し、認証状態を確立する
 */
export async function middleware(request: NextRequest) {
  // 認証が不要なパスをスキップ
  if (isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  try {
    const sessionToken = request.cookies.get('session_token')?.value;

    // トークンがない場合はログインページにリダイレクト
    if (!sessionToken) {
      return redirectToLogin(request);
    }

    // セッショントークンの検証
    const authService = container.resolve(AuthService);
    const session = await authService.validateSession(sessionToken);

    // 無効なセッションの場合はログインページにリダイレクト
    if (!session) {
      return redirectToLogin(request);
    }

    // ユーザー情報をヘッダーに追加
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.userId);
    return response;
  } catch (error) {
    console.error('認証処理中にエラーが発生しました:', error);
    return redirectToLogin(request);
  }
}

/**
 * 認証が不要なパスかどうかを判定
 */
function isPublicPath(path: string): boolean {
  const publicPaths = ['/login', '/register', '/api/auth', '/about'];
  return publicPaths.some((publicPath) => path.startsWith(publicPath));
}

/**
 * ログインページへのリダイレクトレスポンスを生成
 */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
};
```

### 権限制御コンポーネント

```typescript
// src/components/auth/RequireAuth.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { ReactNode } from 'react';
import { UserRole } from '@/domain/models/User';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { redirect } from 'next/navigation';

interface RequireAuthProps {
  children: ReactNode;
  roles?: UserRole[];
}

/**
 * 認証・権限要求コンポーネント
 * @description 指定された権限を持つユーザーのみコンテンツを表示
 */
export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, isLoading, error } = useAuth();

  // 読み込み中
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 認証エラー
  if (error || !user) {
    redirect('/login');
    return null;
  }

  // 権限チェック
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <h2 className="text-xl font-bold text-red-600">アクセス権限がありません</h2>
        <p className="text-gray-600 mt-2">
          このページを閲覧するための権限がありません。
        </p>
      </div>
    );
  }

  // 認証・権限OK
  return <>{children}</>;
}
```

## エラーハンドリング

### APIエラーハンドラー

```typescript
// src/infrastructure/api/ApiErrorHandler.ts
import { NextResponse } from 'next/server';
import { NotFoundException } from '@/domain/exceptions/NotFoundException';
import { ValidationException } from '@/domain/exceptions/ValidationException';
import { UnauthorizedException } from '@/domain/exceptions/UnauthorizedException';
import { ForbiddenException } from '@/domain/exceptions/ForbiddenException';
import { DomainException } from '@/domain/exceptions/DomainException';

/**
 * API用エラーハンドラー
 * @description ドメイン例外をHTTPレスポンスに変換
 */
export class ApiErrorHandler {
  /**
   * エラーに応じた適切なHTTPレスポンスを生成
   * @param error 発生したエラー
   * @returns フォーマットされたエラーレスポンス
   */
  static handle(error: any): NextResponse {
    console.error('APIエラー:', error);

    if (error instanceof ValidationException) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof NotFoundException) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: error.message,
          },
        },
        { status: 404 }
      );
    }

    if (error instanceof UnauthorizedException) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: error.message,
          },
        },
        { status: 401 }
      );
    }

    if (error instanceof ForbiddenException) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: error.message,
          },
        },
        { status: 403 }
      );
    }

    if (error instanceof DomainException) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DOMAIN_ERROR',
            message: error.message,
          },
        },
        { status: 400 }
      );
    }

    // 未知のエラー
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '内部サーバーエラーが発生しました',
        },
      },
      { status: 500 }
    );
  }
}
```

### グローバルエラーハンドリング

```typescript
// src/app/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * グローバルエラーコンポーネント
 * @description アプリケーション全体のエラーハンドリング
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // エラーをログに記録
    console.error('ページレンダリングエラー:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">
        問題が発生しました
      </h2>
      <p className="text-gray-600 text-center max-w-md mb-6">
        ページの表示中に予期しないエラーが発生しました。
        時間をおいて再度お試しいただくか、以下のボタンをクリックしてください。
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          再読み込み
        </Button>
        <Button onClick={() => window.location.href = '/'} variant="outline">
          ホームに戻る
        </Button>
      </div>
    </div>
  );
}
```

## レスポンシブデザイン実装

### Tailwindを活用したレスポンシブUIコンポーネント

```typescript
// src/components/layout/Dashboard.tsx
import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * ダッシュボードレイアウト
 * @description レスポンシブなダッシュボード用レイアウト
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header className="lg:pl-64" />

      <div className="flex flex-1">
        {/* サイドバー - モバイルではオフキャンバス */}
        <Sidebar className="fixed inset-y-0 z-50 lg:relative lg:z-auto" />

        {/* メインコンテンツ */}
        <main className="flex-1 p-4 lg:p-8 w-full lg:pl-64 transition-all">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
```

## 相互参照リンク

このコードサンプルドキュメントは、[02_architecture_design.md](02_architecture_design.md)の設計方針に基づいています。

アーキテクチャとの対応関係:

- [アーキテクチャスタイル選定](#アーキテクチャスタイル実装例) ⇔ 02_architecture_design.md#アーキテクチャスタイルの選定と理由
- [ディレクトリ構造例](#ディレクトリ構造例と各レイヤーの実装) ⇔ 02_architecture_design.md#ディレクトリ構造と各レイヤーの責務
- [モジュール分割と依存関係](#モジュール分割と依存関係の設計) ⇔ 02_architecture_design.md#モジュール分割と依存関係の設計
- [APIエンドポイント設計](#apiエンドポイント設計とルーティング) ⇔ 02_architecture_design.md#APIエンドポイント設計
- [データベース設計](#データベース設計と実装) ⇔ 02_architecture_design.md#データベース設計
- [認証・認可](#認証認可の実装アーキテクチャ) ⇔ 02_architecture_design.md#認証・認可の実装アーキテクチャ
- [エラーハンドリング](#エラーハンドリング) ⇔ 02_architecture_design.md#エラー処理戦略の詳細

## 次のステップ

実際のコードを実装する際は、このドキュメントの例を参考にしながら、[01_requirements_definition.md](01_requirements_definition.md)で定義された機能要件を満たすよう開発を進めてください。具体的な型定義については[05_type_definitions.md](05_type_definitions.md)を、共通ユーティリティ関数については[06_utility_functions.md](06_utility_functions.md)を参照してください。

🦄
