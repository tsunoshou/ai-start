# 4. Userドメイン実装指示書

## 🎯 目的

この文書は、Core SaaS Frameworkにおけるユーザー管理ドメインの実装ガイドラインを提供します。認証・認可システムとユーザー管理の標準実装をフレームワークレベルで提供する方法について詳述します。

## 📋 Userドメインの責務

Userドメインは、SaaSアプリケーションの中核となるユーザー管理機能を提供します：

1. **ユーザー管理**: ユーザーの作成、更新、削除、検索
2. **認証**: ログイン、ログアウト、パスワードリセット、(将来的には二要素認証)
3. **認可**: ロールベースのアクセス制御、権限管理 (シンプルな実装)
4. **プロファイル管理**: ユーザープロファイル情報の管理
5. **組織/チーム管理**: (現状は未実装、将来の拡張ポイント)

## 📦 パッケージ構造 (@core/user)

```
@core/user/
├── domain/                  # ドメイン層
│   ├── entities/            # エンティティ
│   │   ├── __tests__/       # エンティティのテスト
│   │   │   └── user.entity.unit.test.ts
│   │   └── user.entity.ts
│   │
│   ├── value-objects/       # 値オブジェクト
│   │   ├── __tests__/       # 値オブジェクトのテスト
│   │   │   └── user-name.vo.unit.test.ts
│   │   ├── user-id.vo.ts
│   │   ├── user-name.vo.ts
│   │   └── password-hash.vo.ts
│   │
│   ├── enums/               # 列挙型
│   │   ├── __tests__/       # 列挙型のテスト
│   │   │   └── user-role.enum.unit.test.ts
│   │   └── user-role.enum.ts
│   │
│   ├── repositories/        # リポジトリインターフェース
│   │   └── user.repository.interface.ts
│   │
│   └── services/            # ドメインサービス (例: 認証)
│       ├── __tests__/       # ドメインサービスのテスト
│       │   └── authentication.service.unit.test.ts
│       └── authentication.service.ts
│
├── application/             # アプリケーション層
│   ├── usecases/            # ユースケース
│   │   ├── __tests__/       # ユースケースのテスト
│   │   │   ├── create-user.usecase.unit.test.ts
│   │   │   └── create-user.usecase.integration.test.ts
│   │   ├── create-user.usecase.ts
│   │   ├── find-user-by-id.usecase.ts
│   │   └── authenticate-user.usecase.ts
│   │
│   └── dtos/                # データ転送オブジェクト
│       ├── user.dto.ts
│       └── create-user.dto.ts
│
├── infrastructure/          # インフラストラクチャ層
│   ├── repositories/        # リポジトリ実装
│   │   ├── __tests__/       # リポジトリ実装のテスト
│   │   │   └── user.repository.integration.test.ts
│   │   └── user.repository.ts  # Drizzleによる実装
│   │
│   └── mappers/             # マッパー
│       ├── __tests__/       # マッパーのテスト
│       │   └── user.mapper.unit.test.ts
│       └── user.mapper.ts
│
├── presentation/            # プレゼンテーション層 (Next.jsアプリ側で実装)
│   └── api/                 # APIコントローラー (例)
│       ├── __tests__/       # APIコントローラーのテスト
│       │   └── user.controller.integration.test.ts
│       └── user.controller.ts
│
├── README.md
└── package.json
```

## 🧩 主要コンポーネント

### ドメインモデル

#### User エンティティ

```typescript
// @core/user/domain/entities/user.entity.ts
import { BaseEntity } from '@core/shared/base'; // 修正: BaseEntityを使用
import { Result } from '@core/shared/result';
import { Email } from '@core/shared/value-objects/email.vo'; // 修正: 正しいパス
import { UserId, UserName, PasswordHash } from '../value-objects'; // 修正: 値オブジェクトをインポート
import { UserRoleEnum } from '../enums/user-role.enum'; // 修正: Enumを使用
import { UserCreatedEvent } from '../events/user-created.event';
import { InvalidPropertyError } from '@core/shared/errors';

interface UserProps {
  email: Email;
  passwordHash: PasswordHash;
  name: UserName;
  role: UserRoleEnum;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends BaseEntity<UserId> { // 修正: BaseEntityを継承
  private constructor(id: UserId, props: UserProps) {
    super(id, props); // 修正: BaseEntityのコンストラクタ呼び出し
  }

  // ゲッター
  get email(): Email { return this.props.email; }
  get passwordHash(): PasswordHash { return this.props.passwordHash; }
  get name(): UserName { return this.props.name; }
  get role(): UserRoleEnum { return this.props.role; }
  get lastLoginAt(): Date | undefined { return this.props.lastLoginAt; }
  // createdAt, updatedAt は BaseEntity から継承

  // ファクトリーメソッド
  public static create(
    props: Omit<UserProps, 'role' | 'createdAt' | 'updatedAt'>,
    id?: UserId
  ): Result<User, Error> {

    // 名前のバリデーションをUserNameで行う想定
    const nameResult = UserName.create(props.name.value); // 仮実装
    if (nameResult.isFailure()) {
      return Result.fail(nameResult.getError());
    }

    const defaultProps: UserProps = {
      ...props,
      role: UserRoleEnum.USER, // デフォルトロール
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const user = new User(id ?? new UserId(), defaultProps);

    // ドメインイベントの発行
    // user.addDomainEvent(new UserCreatedEvent(user)); // AggregateRootの場合

    return Result.ok(user);
  }

  // ビジネスメソッド
  public updateName(name: UserName): Result<void, Error> {
    // バリデーションはUserName値オブジェクト内で行われると想定
    this.props.name = name;
    this.props.updatedAt = new Date();
    // addDomainEvent(new UserUpdatedEvent(this)); // 必要ならイベント発行
    return Result.ok();
  }

  public changeRole(newRole: UserRoleEnum): Result<void, Error> {
    if (!UserRoleEnum.isValid(newRole)) {
        return Result.fail(new InvalidPropertyError('無効なロールです。'));
    }
    if (this.props.role === newRole) {
        return Result.ok(); // 変更なし
    }
    this.props.role = newRole;
    this.props.updatedAt = new Date();
    return Result.ok();
  }

  public recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.props.updatedAt = new Date();
  }
}
```

#### UserRole Enum

```typescript
// @core/user/domain/enums/user-role.enum.ts
export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST' // 例
}

export namespace UserRoleEnum {
  export function isValid(role: string): role is UserRoleEnum {
    return Object.values(UserRoleEnum).includes(role as UserRoleEnum);
  }

  export function isAdmin(role: UserRoleEnum): boolean {
    return role === UserRoleEnum.ADMIN;
  }

  export function getAll(): UserRoleEnum[] {
    return Object.values(UserRoleEnum);
  }
}
```

### リポジトリインターフェース

```typescript
// @core/user/domain/repositories/user.repository.interface.ts
import { BaseRepository } from '@core/shared/base'; // 修正: BaseRepositoryを使用
import { User } from '../entities/user.entity';
import { Email } from '@core/shared/value-objects/email.vo'; // 修正: 正しいパス
import { UserId } from '../value-objects/user-id.vo';
import { Result } from '@core/shared/result';

export interface UserRepositoryInterface extends BaseRepository<User, UserId> { // 修正: BaseRepositoryを継承
  findByEmail(email: Email): Promise<Result<User | null, Error>>;
  findAll(): Promise<Result<User[], Error>>;
  // findById は BaseRepository から継承される
  // save は BaseRepository から継承される
  // delete は BaseRepository から継承される
}
```

### アプリケーション層（ユースケース）

```typescript
// @core/user/application/usecases/create-user.usecase.ts
import { BaseUseCase } from '@core/shared/base'; // 修正: BaseUseCaseを使用
import { Result } from '@core/shared/result';
import { Email } from '@core/shared/value-objects/email.vo';
import { PasswordHash } from '../../domain/value-objects/password-hash.vo';
import { User } from '../../domain/entities/user.entity';
import { UserName } from '../../domain/value-objects/user-name.vo';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UserDto } from '../dtos/user.dto';
import { UserAlreadyExistsError } from '../../domain/errors/user-already-exists.error'; // エラー定義は別途必要
import { PasswordService } from '@core/infrastructure/auth'; // 修正: 適切なパスへ
import { UserMapper } from '../../infrastructure/mappers/user.mapper'; // 修正: 適切なパスへ
import { InvalidPropertyError } from '@core/shared/errors';

export class CreateUserUseCase implements BaseUseCase<CreateUserDto, Result<UserDto, Error>> { // 修正: BaseUseCaseを実装
  constructor(
    private readonly userRepository: UserRepositoryInterface,
    private readonly passwordService: PasswordService, // 注入
    private readonly userMapper: UserMapper // 注入
  ) {}

  public async execute(request: CreateUserDto): Promise<Result<UserDto, Error>> {
    // メールアドレスのバリデーション
    const emailOrError = Email.create(request.email);
    if (emailOrError.isFailure()) {
      return Result.fail(emailOrError.getError());
    }
    const email = emailOrError.getValue();

    // ユーザー既存チェック
    const existingUserResult = await this.userRepository.findByEmail(email);
    if (existingUserResult.isFailure()) {
        return Result.fail(existingUserResult.getError()); // DBエラーなど
    }
    if (existingUserResult.getValue() !== null) {
      return Result.fail(new UserAlreadyExistsError(email.value));
    }

    // 名前のバリデーション (値オブジェクトに委譲)
    const nameOrError = UserName.create(request.name);
    if (nameOrError.isFailure()) {
      return Result.fail(nameOrError.getError());
    }
    const name = nameOrError.getValue();

    // パスワードのバリデーションとハッシュ化
    if (!request.password || request.password.length < 8) { // 例: 簡単なバリデーション
        return Result.fail(new InvalidPropertyError('パスワードは8文字以上である必要があります。'));
    }
    const hashedPassword = await this.passwordService.hashPassword(request.password);
    const passwordHashOrError = PasswordHash.create(hashedPassword);
    if (passwordHashOrError.isFailure()) {
      return Result.fail(passwordHashOrError.getError());
    }
    const passwordHash = passwordHashOrError.getValue();

    // ユーザーエンティティの作成
    const userOrError = User.create({
      email,
      passwordHash,
      name,
    });

    if (userOrError.isFailure()) {
      return Result.fail(userOrError.getError());
    }
    const user = userOrError.getValue();

    // ユーザーの保存
    const saveResult = await this.userRepository.save(user);
    if (saveResult.isFailure()) {
      return Result.fail(saveResult.getError());
    }

    // DTOへの変換
    return Result.ok(this.userMapper.toDto(user));
  }
}
```

### インフラストラクチャ層（リポジトリ実装）

```typescript
// @core/user/infrastructure/repositories/user.repository.ts
import { DrizzleD1Database } from 'drizzle-orm/d1'; // 例: Drizzleの型
import { Result } from '@core/shared/result';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface.ts';
import { Email } from '@core/shared/value-objects/email.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { UserMapper } from '../mappers/user.mapper';
import { DatabaseError } from '@core/shared/errors';
import * as schema from '@core/infrastructure/database/schema'; // DBスキーマをインポート
import { eq } from 'drizzle-orm';

export class UserRepository implements UserRepositoryInterface {
  constructor(
    private readonly db: DrizzleD1Database<typeof schema>, // Drizzleクライアントを注入
    private readonly userMapper: UserMapper // マッパーを注入
  ) {}

  async save(user: User): Promise<Result<void, Error>> {
    try {
      const persistenceModel = this.userMapper.toPersistence(user);

      // Drizzleを使ってUpsert (またはCreate/Update)
      await this.db.insert(schema.users)
        .values(persistenceModel)
        .onConflictDoUpdate({ target: schema.users.id, set: persistenceModel });

      return Result.ok();
    } catch (error) {
      return Result.fail(new DatabaseError(`ユーザー保存エラー: ${error.message}`));
    }
  }

  async findById(id: UserId): Promise<Result<User | null, Error>> {
    try {
      const result = await this.db.select()
        .from(schema.users)
        .where(eq(schema.users.id, id.value))
        .limit(1);

      if (result.length === 0) {
        return Result.ok(null);
      }

      const user = this.userMapper.toDomain(result[0]);
      return Result.ok(user);
    } catch (error) {
      return Result.fail(new DatabaseError(`ユーザー検索エラー(ID: ${id.value}): ${error.message}`));
    }
  }

  async findByEmail(email: Email): Promise<Result<User | null, Error>> {
    try {
      const result = await this.db.select()
        .from(schema.users)
        .where(eq(schema.users.email, email.value))
        .limit(1);

      if (result.length === 0) {
        return Result.ok(null);
      }

      const user = this.userMapper.toDomain(result[0]);
      return Result.ok(user);
    } catch (error) {
      return Result.fail(new DatabaseError(`ユーザー検索エラー(Email: ${email.value}): ${error.message}`));
    }
  }

  async findAll(): Promise<Result<User[], Error>> {
    try {
      const results = await this.db.select().from(schema.users);
      const users = results.map(this.userMapper.toDomain);
      return Result.ok(users);
    } catch (error) {
      return Result.fail(new DatabaseError(`全ユーザー取得エラー: ${error.message}`));
    }
  }

  // delete メソッドの実装 (BaseRepositoryから)
  async delete(id: UserId): Promise<Result<void, Error>> {
    try {
      await this.db.delete(schema.users).where(eq(schema.users.id, id.value));
      return Result.ok();
    } catch (error) {
      return Result.fail(new DatabaseError(`ユーザー削除エラー(ID: ${id.value}): ${error.message}`));
    }
  }
}
```

### プレゼンテーション層（API）

Next.js の App Router を使用する場合、API Routes や Server Actions 内でユースケースを呼び出します。コントローラークラスを直接使うより、関数ベースでの実装が主流です。

```typescript
// 例: app/api/users/route.ts (Next.js App Router API Route)
import { NextRequest, NextResponse } from 'next/server';
import { container } from 'tsyringe'; // DIコンテナを使用する場合
import { CreateUserUseCase } from '@core/user/application/usecases/create-user.usecase';
import { CreateUserDto } from '@core/user/application/dtos/create-user.dto';
import { UserAlreadyExistsError } from '@core/user/domain/errors/user-already-exists.error';
import { ValidationError } from '@core/shared/errors';

// DIコンテナの設定 (別のファイルで行う)
// container.register<UserRepositoryInterface>(...)..
// container.register<PasswordService>(...)..
// container.register<UserMapper>(...)..
// container.register<CreateUserUseCase>(CreateUserUseCase);

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const createUserDto: CreateUserDto = await req.json();

    // DIコンテナからユースケースを取得
    const createUserUseCase = container.resolve(CreateUserUseCase);
    const result = await createUserUseCase.execute(createUserDto);

    if (result.isFailure()) {
      const error = result.getError();

      if (error instanceof ValidationError || error instanceof InvalidPropertyError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error instanceof UserAlreadyExistsError) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      console.error('Create user error:', error);
      return NextResponse.json({ error: '内部サーバーエラーが発生しました' }, { status: 500 });
    }

    // 成功レスポンス
    return NextResponse.json(result.getValue(), { status: 201 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'リクエスト処理中にエラーが発生しました' }, { status: 500 });
  }
}
```

## 📊 Userドメイン実装の優先順位

1. **基本的なユーザー管理機能**: CRUD、認証 (ログイン/ログアウト、パスワードハッシュ)
2. **認可と権限管理**: シンプルなロールベース制御 (`UserRoleEnum`)
3. **プロファイル管理**: 基本的な情報更新
4. **高度な認証機能**: パスワードリセット、(将来的に) 2FA、ソーシャルログイン
5. **組織/チーム管理**: (将来的な拡張)

## 📱 フロントエンド連携

`@core/ui` パッケージのフックやコンポーネント、またはアプリケーション固有のフックを使用します。`use-auth` のようなカスタムフックは、`@core/infrastructure/auth` や API エンドポイントと連携して認証状態を管理します。

```typescript
// 例: apps/saas-app/hooks/use-auth-client.ts (クライアントサイド認証フック)
import { useState, useEffect, useCallback } from 'react';
import { LoginDto } from '@core/user/application/dtos/login.dto'; // DTOをインポート
import { UserDto } from '@core/user/application/dtos/user.dto';
import { AuthTokenDto } from '@core/user/application/dtos/auth-token.dto';

// このフックはクライアントサイドでの状態管理とAPI呼び出しを行う
export function useAuthClient() {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初期化時に現在のユーザー情報を取得 (セッションやトークンを確認)
  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/auth/me'); // 認証状態確認API
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
          // localStorage.removeItem('auth_token'); // トークンがあれば削除
        }
      } catch (err) {
        setError('ユーザー情報の取得に失敗しました');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, []);

  // ログイン処理
  const login = useCallback(async (credentials: LoginDto): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', { // ログインAPI
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'ログインに失敗しました');
        return false;
      }

      const { user, token }: { user: UserDto; token: AuthTokenDto } = await response.json();
      // トークンの処理 (例: HTTP Only Cookie はサーバーで設定、必要ならクライアント側でも保持)
      // localStorage.setItem('auth_token', token.accessToken);
      setUser(user);
      return true;
    } catch (err) {
      setError('ログイン処理中にエラーが発生しました');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ログアウト処理
  const logout = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await fetch('/api/auth/logout', { method: 'POST' }); // ログアウトAPI
      // localStorage.removeItem('auth_token');
      setUser(null);
    } catch (err) {
      setError('ログアウト処理中にエラーが発生しました');
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout
  };
}
```

## 🔗 他のドメインとの連携

Userドメインは他のドメインと以下のように連携します：

1. **認証・認可の共通インフラ提供**: `@core/infrastructure/auth` が Supabase クライアントを提供。APIミドルウェアで認証確認。
2. **ドメイン間のユーザー参照**: 他のドメインは `UserId` (`@core/user/domain/value-objects/user-id.vo.ts`) を参照。
3. **ドメインイベント**: 必要に応じてイベントを発行し、疎結合な連携を実現 (例: `UserCreatedEvent`)。

## 🧪 テスト戦略とサンプル実装

ユーザードメインにおけるテスト戦略は、各レイヤーの責任に応じて適切なテスト方法を選択します。以下に詳細な戦略とサンプル実装を示します。

### ディレクトリ構造とファイル命名規則

テストファイルは各実装ファイルがあるフォルダ内の`__tests__`ディレクトリに配置します：

```
@core/user/
├── domain/
│   ├── entities/
│   │   ├── __tests__/
│   │   │   └── user.entity.unit.test.ts
│   │   └── user.entity.ts
│   ├── value-objects/
│   │   ├── __tests__/
│   │   │   └── user-name.vo.unit.test.ts // 修正: 例としてuser-name
│   │   └── user-name.vo.ts
│   ├── enums/
│   │   ├── __tests__/
│   │   │   └── user-role.enum.unit.test.ts
│   │   └── user-role.enum.ts
```

### ユーザーエンティティのテスト例

```typescript
// @core/user/domain/entities/__tests__/user.entity.unit.test.ts
import { User } from '../user.entity';
import { Email } from '@core/shared/value-objects/email.vo'; // 修正: 正しいパス
import { UserId, UserName, PasswordHash } from '../../value-objects';
import { UserRoleEnum } from '../../enums/user-role.enum';
import { Result } from '@core/shared/result';

describe('User Entity', () => {
  it('should create a valid user', () => {
    // 準備
    const emailOrError = Email.create('test@example.com');
    expect(emailOrError.isSuccess()).toBeTruthy();
    const email = emailOrError.getValue();
    const nameOrError = UserName.create('Test User');
    expect(nameOrError.isSuccess()).toBeTruthy();
    const name = nameOrError.getValue();
    const passwordHashOrError = PasswordHash.create('hashed_password');
    expect(passwordHashOrError.isSuccess()).toBeTruthy();
    const passwordHash = passwordHashOrError.getValue();

    // 実行
    const userOrError = User.create({
      email,
      name,
      passwordHash,
    });

    // 検証
    expect(userOrError.isSuccess()).toBeTruthy();
    const user = userOrError.getValue();
    expect(user.name.value).toBe('Test User');
    expect(user.email.value).toBe('test@example.com');
    expect(user.role).toBe(UserRoleEnum.USER); // デフォルトロール
  });

  it('should not create user with invalid name', () => {
    // 準備
    const emailOrError = Email.create('test@example.com');
    const email = emailOrError.getValue();
    const passwordHash = PasswordHash.create('hashed_password').getValue();

    // 実行: 名前が短すぎる (UserName値オブジェクトの責務)
    const nameOrError = UserName.create('A');
    expect(nameOrError.isFailure()).toBeTruthy();

    // User.create に渡す前に失敗する
    // const userOrError = User.create({ email, name: nameOrError.getValue(), passwordHash });
    // expect(userOrError.isFailure()).toBeTruthy();
  });

  it('should change role correctly', () => {
    // 準備: ユーザー作成
    const email = Email.create('test@example.com').getValue();
    const name = UserName.create('Test User').getValue();
    const passwordHash = PasswordHash.create('hashed_password').getValue();
    const user = User.create({ email, name, passwordHash }).getValue();
    expect(user.role).toBe(UserRoleEnum.USER);

    // 実行
    const changeRoleResult = user.changeRole(UserRoleEnum.ADMIN);

    // 検証
    expect(changeRoleResult.isSuccess()).toBeTruthy();
    expect(user.role).toBe(UserRoleEnum.ADMIN);
  });

  it('should not change to invalid role', () => {
    // 準備
    const user = User.create({ /* ... */ } as any).getValue(); // 簡略化

    // 実行
    const changeRoleResult = user.changeRole('INVALID_ROLE' as UserRoleEnum);

    // 検証
    expect(changeRoleResult.isFailure()).toBeTruthy();
    expect(changeRoleResult.getError().message).toContain('無効なロール');
  });
});
```

### ユーザーロール列挙型のテスト例

```typescript
// @core/user/domain/enums/__tests__/user-role.enum.unit.test.ts
import { UserRoleEnum } from '../user-role.enum';

describe('UserRoleEnum', () => {
  it('should have the correct values', () => {
    expect(UserRoleEnum.ADMIN).toBe('ADMIN');
    expect(UserRoleEnum.USER).toBe('USER');
    expect(UserRoleEnum.GUEST).toBe('GUEST');
  });

  it('should check if role is valid', () => {
    expect(UserRoleEnum.isValid(UserRoleEnum.ADMIN)).toBeTruthy();
    expect(UserRoleEnum.isValid(UserRoleEnum.USER)).toBeTruthy();
    expect(UserRoleEnum.isValid(UserRoleEnum.GUEST)).toBeTruthy();
    expect(UserRoleEnum.isValid('INVALID_ROLE')).toBeFalsy();
  });

  it('should check if role is admin', () => {
    expect(UserRoleEnum.isAdmin(UserRoleEnum.ADMIN)).toBeTruthy();
    expect(UserRoleEnum.isAdmin(UserRoleEnum.USER)).toBeFalsy();
  });

  it('should return all roles', () => {
    const allRoles = UserRoleEnum.getAll();
    expect(allRoles).toHaveLength(3);
    expect(allRoles).toContain(UserRoleEnum.ADMIN);
    expect(allRoles).toContain(UserRoleEnum.USER);
    expect(allRoles).toContain(UserRoleEnum.GUEST);
  });
});
```

### ユーザー作成ユースケースのテスト例 (単体テスト)

```typescript
// @core/user/application/usecases/__tests__/create-user.usecase.unit.test.ts
import { CreateUserUseCase } from '../create-user.usecase';
import { UserRepositoryInterface } from '../../domain/repositories/user.repository.interface';
import { CreateUserDto } from '../dtos/create-user.dto';
import { Result } from '@core/shared/result';
import { PasswordService } from '@core/infrastructure/auth';
import { UserMapper } from '../../infrastructure/mappers/user.mapper';

// モックの作成
jest.mock('@core/infrastructure/auth/password.service'); // PasswordServiceのモック
jest.mock('../../infrastructure/mappers/user.mapper'); // UserMapperのモック

describe('CreateUserUseCase - Unit Tests', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<UserRepositoryInterface>;
  let mockPasswordService: jest.Mocked<PasswordService>;
  let mockUserMapper: jest.Mocked<UserMapper>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(), // BaseRepositoryからのメソッドもモック
      findAll: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<UserRepositoryInterface>;

    // モックインスタンスを取得
    mockPasswordService = new PasswordService() as jest.Mocked<PasswordService>;
    mockUserMapper = new UserMapper() as jest.Mocked<UserMapper>;

    // 実際の PasswordService のメソッドをモック実装に置き換え
    mockPasswordService.hashPassword.mockResolvedValue('hashed_password');

    // UserMapper のメソッドをモック実装に置き換え (仮)
    mockUserMapper.toDto.mockImplementation((user) => ({
        id: user.id.value,
        email: user.email.value,
        name: user.name.value,
        role: user.role,
    }));

    useCase = new CreateUserUseCase(
      mockUserRepository,
      mockPasswordService,
      mockUserMapper
    );
  });

  it('should create a user successfully', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password123!',
    };

    mockUserRepository.findByEmail.mockResolvedValue(Result.ok(null));
    mockUserRepository.save.mockResolvedValue(Result.ok(undefined));

    // 実行
    const result = await useCase.execute(dto);

    // 検証
    expect(result.isSuccess()).toBeTruthy();
    expect(mockPasswordService.hashPassword).toHaveBeenCalledWith('Password123!');
    expect(mockUserRepository.findByEmail).toHaveBeenCalled();
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockUserMapper.toDto).toHaveBeenCalled();
  });

  it('should fail if email already exists', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'existing@example.com',
      name: 'Test User',
      password: 'Password123!',
    };

    // 既存ユーザーがいることをモック
    mockUserRepository.findByEmail.mockResolvedValue(Result.ok({ /* 既存ユーザーのモック */ } as any));

    // 実行
    const result = await useCase.execute(dto);

    // 検証
    expect(result.isFailure()).toBeTruthy();
    expect(result.getError().constructor.name).toBe('UserAlreadyExistsError');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });

  it('should fail if password is invalid', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'weak', // 弱いパスワード
    };

    mockUserRepository.findByEmail.mockResolvedValue(Result.ok(null));

    // 実行
    const result = await useCase.execute(dto);

    // 検証
    expect(result.isFailure()).toBeTruthy();
    expect(result.getError().constructor.name).toBe('InvalidPropertyError');
    expect(result.getError().message).toContain('パスワードは8文字以上');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
```

### ユーザー作成ユースケースのテスト例 (統合テスト)

```typescript
// @core/user/application/usecases/__tests__/create-user.usecase.integration.test.ts
import { CreateUserUseCase } from '../create-user.usecase';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { CreateUserDto } from '../dtos/create-user.dto';
import { PasswordService } from '@core/infrastructure/auth/password.service';
import { UserMapper } from '../../infrastructure/mappers/user.mapper';
import { db, schema } from '@core/infrastructure/database'; // 実際のDB接続とスキーマ
import { TestDatabase } from '@core/infrastructure/database/testing'; // テスト用DBヘルパー

describe('CreateUserUseCase - Integration Tests', () => {
  let useCase: CreateUserUseCase;
  let userRepository: UserRepository;
  const testDb = new TestDatabase(); // テストDBヘルパーインスタンス

  beforeAll(async () => {
    await testDb.start(); // テスト用DBコンテナ起動
  });

  beforeEach(async () => {
    await testDb.clearTables([schema.users]); // テーブルクリア

    // 実際のリポジトリ、サービス、マッパーを使用
    userRepository = new UserRepository(testDb.getClient(), new UserMapper());
    useCase = new CreateUserUseCase(userRepository, new PasswordService(), new UserMapper());
  });

  afterAll(async () => {
    await testDb.stop(); // テスト用DBコンテナ停止
  });

  it('should create a user and store in database', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'integration@example.com',
      name: 'Integration Test User',
      password: 'Integration123!',
    };

    // 実行
    const result = await useCase.execute(dto);

    // 検証
    expect(result.isSuccess()).toBeTruthy();
    const createdUserDto = result.getValue();
    expect(createdUserDto.email).toBe('integration@example.com');

    // DBから直接検証
    const userOrError = await userRepository.findByEmail(Email.create('integration@example.com').getValue());
    expect(userOrError.isSuccess()).toBeTruthy();
    const user = userOrError.getValue();
    expect(user).not.toBeNull();
    expect(user?.name.value).toBe('Integration Test User');

    // パスワードがハッシュ化されていることを確認
    const passwordMatch = await new PasswordService().comparePassword('Integration123!', user!.passwordHash.value);
    expect(passwordMatch).toBe(true);
  });

  it('should not allow duplicate emails', async () => {
    // 準備: 最初のユーザーを作成
    const firstUserDto: CreateUserDto = {
      email: 'duplicate@example.com',
      name: 'First User',
      password: 'Password123!',
    };
    await useCase.execute(firstUserDto);

    // 実行: 同じメールで2人目のユーザーを作成しようとする
    const secondUserDto: CreateUserDto = {
      email: 'duplicate@example.com',
      name: 'Second User',
      password: 'AnotherPass123!',
    };
    const result = await useCase.execute(secondUserDto);

    // 検証
    expect(result.isFailure()).toBeTruthy();
    expect(result.getError().constructor.name).toBe('UserAlreadyExistsError');

    // DBに1人だけ存在することを確認
    const usersResult = await userRepository.findAll();
    expect(usersResult.isSuccess()).toBeTruthy();
    expect(usersResult.getValue()).toHaveLength(1);
  });
});
```

### ユーザーリポジトリのテスト例 (統合テスト)

```typescript
// @core/user/infrastructure/repositories/__tests__/user.repository.integration.test.ts
import { UserRepository } from '../user.repository';
import { User } from '../../domain/entities/user.entity';
import { Email } from '@core/shared/value-objects/email.vo';
import { UserId, UserName, PasswordHash } from '../../domain/value-objects';
import { UserRoleEnum } from '../../domain/enums/user-role.enum';
import { UserMapper } from '../mappers/user.mapper';
import { db, schema } from '@core/infrastructure/database';
import { TestDatabase } from '@core/infrastructure/database/testing';
import { eq } from 'drizzle-orm';

describe('UserRepository - Integration Tests', () => {
  let repository: UserRepository;
  const testDb = new TestDatabase();
  const userMapper = new UserMapper();

  beforeAll(async () => {
    await testDb.start();
  });

  beforeEach(async () => {
    await testDb.clearTables([schema.users]);
    repository = new UserRepository(testDb.getClient(), userMapper);
  });

  afterAll(async () => {
    await testDb.stop();
  });

  const createTestUser = (emailValue: string, nameValue: string): User => {
      const email = Email.create(emailValue).getValue();
      const name = UserName.create(nameValue).getValue();
      const passwordHash = PasswordHash.create('hashed_password_' + emailValue).getValue();
      return User.create({ email, name, passwordHash }).getValue();
  };

  it('should save and retrieve user by ID', async () => {
    // 準備: ユーザーエンティティを作成
    const user = createTestUser('repo-test@example.com', 'Repository Test User');

    // 実行: 保存
    const saveResult = await repository.save(user);
    expect(saveResult.isSuccess()).toBeTruthy();

    // 実行: IDで取得
    const retrievedUserResult = await repository.findById(user.id);
    
    // 検証
    expect(retrievedUserResult.isSuccess()).toBeTruthy();
    const retrievedUser = retrievedUserResult.getValue();
    expect(retrievedUser).not.toBeNull();
    expect(retrievedUser?.id.equals(user.id)).toBeTruthy();
    expect(retrievedUser?.name.value).toBe('Repository Test User');
    expect(retrievedUser?.email.value).toBe('repo-test@example.com');
  });

  it('should find user by email', async () => {
    // 準備: ユーザーを保存
    const user = createTestUser('find-by-email@example.com', 'Find By Email User');
    await repository.save(user);

    // 実行
    const result = await repository.findByEmail(Email.create('find-by-email@example.com').getValue());
    
    // 検証
    expect(result.isSuccess()).toBeTruthy();
    const foundUser = result.getValue();
    expect(foundUser).not.toBeNull();
    expect(foundUser?.id.equals(user.id)).toBeTruthy();
    expect(foundUser?.name.value).toBe('Find By Email User');
  });

  it('should update existing user', async () => {
    // 準備: ユーザーを作成して保存
    const email = Email.create('update-test@example.com').getValue();
    const user = User.create({
      email,
      name: 'Original Name',
      status: UserStatusEnum.ACTIVE,
      passwordHash: 'original_hash',
    }).getValue();

    await repository.save(user);

    // 準備: 名前を更新
    user.updateName('Updated Name');
    
    // 実行: 更新を保存
    const updateResult = await repository.save(user);
    
    // 検証
    expect(updateResult.isSuccess()).toBeTruthy();
    
    // DBから直接確認
    const updatedUsers = await db.table('users').where({ id: user.id.toString() });
    expect(updatedUsers.length).toBe(1);
    expect(updatedUsers[0].name).toBe('Updated Name');
  });
});
```

### APIコントローラーのテスト例 (統合テスト)

```typescript
// @core/user/presentation/api/__tests__/user.controller.integration.test.ts
import { NextRequest, NextResponse } from 'next/server';
import { UserController } from '../user.controller';
import { CreateUserUseCase } from '../../../application/use-cases/create-user.use-case';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { PasswordService } from '@core/infrastructure/auth';
import { db } from '@core/infrastructure/database';

describe('UserController - Integration Tests', () => {
  let userController: UserController;

  beforeEach(() => {
    // 実際のリポジトリとユースケースを使用
    const userRepository = new UserRepository(db);
    const createUserUseCase = new CreateUserUseCase(userRepository, PasswordService);
    
    // コントローラをインスタンス化
    userController = new UserController(createUserUseCase);
  });

  it('should create a user via API', async () => {
    // 実行
    const response = await NextRequest.POST(new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'api-test@example.com',
        name: 'API Test User',
        password: 'ApiTest123!'
      }),
      headers: { 'Content-Type': 'application/json' }
    ));
    
    // 検証
    expect(response.status).toBe(201);
    expect(response.body.email).toBe('api-test@example.com');
    expect(response.body.name).toBe('API Test User');
  });

  it('should return 400 for invalid input', async () => {
    // 実行: 無効なパスワードでリクエスト
    const response = await NextRequest.POST(new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid@example.com',
        name: 'Invalid User',
        password: 'weak'  // 弱すぎるパスワード
      }),
      headers: { 'Content-Type': 'application/json' }
    }));
    
    // 検証
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('パスワード');
  });

  it('should return 409 for duplicate email', async () => {
    // 準備: 最初のユーザーを作成
    await NextRequest.POST(new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        name: 'First User',
        password: 'Password123!'
      }),
      headers: { 'Content-Type': 'application/json' }
    }));
    
    // 実行: 同じメールで2人目のユーザーを作成しようとする
    const response = await NextRequest.POST(new NextRequest('http://localhost/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        name: 'Second User',
        password: 'Password123!'
      }),
      headers: { 'Content-Type': 'application/json' }
    }));
    
    // 検証
    expect(response.status).toBe(409);
    expect(response.body.error).toContain('既に使用されています');
  });
});
```

### E2Eテスト例 - ユーザー登録からログインまで

```typescript
// @core/user/presentation/e2e/__tests__/user-registration-flow.e2e.test.ts
import { test, expect } from '@playwright/test';
import { TestDatabase } from '@core/infrastructure/database/testing';
import { schema } from '@core/infrastructure/database';

const testDb = new TestDatabase();
const BASE_URL = 'http://localhost:3000'; // テスト対象のURL

test.describe('User Registration Flow', () => {
  test.beforeAll(async () => {
    await testDb.start();
  });

  test.beforeEach(async ({ page }) => {
    await testDb.clearTables([schema.users]);
    await page.goto(BASE_URL);
  });

  test.afterAll(async () => {
    await testDb.stop();
  });

  it('should allow user to register, login, and access profile', async ({ page }) => {
    // Step 1: ユーザー登録
    const registerResponse = await page.goto(`${BASE_URL}/register`);
    await expect(page).toHaveURL(`${BASE_URL}/register`);

    // Step 2: 登録フォーム入力・送信
    await page.fill('input[name="email"]', 'e2e-flow@example.com');
    await page.fill('input[name="name"]', 'E2E Test User');
    await page.fill('input[name="password"]', 'E2ETest123!');
    await page.click('button[type="submit"]');

    // Step 3: 登録成功後、ログインページへリダイレクトされることを確認 (または直接ダッシュボードへ)
    await expect(page).toHaveURL(`${BASE_URL}/login`); // 例: ログインページにリダイレクト
    // または: await expect(page).toHaveURL(`${BASE_URL}/dashboard`);

    // Step 4: ログインページでログイン
    await page.fill('input[name="email"]', 'e2e-flow@example.com');
    await page.fill('input[name="password"]', 'E2ETest123!');
    await page.click('button[type="submit"]');

    // Step 5: ダッシュボードにリダイレクトされ、特定の要素が表示されることを確認
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
    await expect(page.locator('h1')).toContainText('ダッシュボード'); // ダッシュボードのヘッダーなど
  });

  it('should show error for invalid login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(page.locator('[role="alert"]')).toContainText('メールアドレスまたはパスワードが違います');
    await expect(page).toHaveURL(`${BASE_URL}/login`); // ログインページのまま
  });
});
```

## 📊 テストカバレッジ目標

ユーザードメインでは以下のテストカバレッジ目標を設定します：

1. **ドメイン層**: 95%以上
2. **アプリケーション層**: 90%以上
3. **インフラストラクチャ層**: 85%以上
4. **プレゼンテーション層**: API/Server Actionsの統合テスト 80%以上、E2Eで主要フローカバー

## 🔍 テスト戦略まとめ

1. **単体テスト (Vitest)**:
   - ドメイン層（エンティティ、値オブジェクト、列挙型）
   - 純粋なロジック、外部依存なし

2. **統合テスト (Vitest + Testcontainers/テストDB)**:
   - ユースケース（モックなしでリポジトリ等と連携）
   - リポジトリ（実際のDBとの連携）
   - API Route/Server Action ハンドラ (DI利用)

3. **E2Eテスト (Playwright)**:
   - 主要なユーザーフロー（登録、ログイン、プロファイル更新など）
   - 実際のブラウザ操作をシミュレート

テストツールとして **Vitest** を単体・統合テストに、**Playwright** をE2Eテストに使用します。統合テストでは **Testcontainers** やローカルのテスト用DBを利用して実際のDBアクセスを検証します。

## 📚 参照

- 詳細設計については[理想設計書](./01_ideal_design.md)を参照
- 移行プロセスについては[移行計画書](./02_migration_plan.md)を参照
- 共通ベースドメインは[ベースドメイン実装指示書](./03_base_domain_guide.md)を参照
- 将来的な拡張計画は[将来展開計画書](./05_future_expansion_plan.md)を参照 