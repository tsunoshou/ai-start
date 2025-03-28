# サーバー側実装コード例

最終更新日: 2025-03-26

## 概要

このドキュメントは、[07_server_implementation.md](../07_server_implementation.md)で定義されているサーバー側実装に関する具体的なコード例を提供します。以下のセクションでは、AiStartプロジェクトのサーバー側実装において重要な実装パターンと具体的なコードサンプルを示します。

このドキュメントの目的は、実装時の参考となる具体的なコード例を提供することであり、すべてのコードを網羅するものではありません。実際の実装にあたっては、[01_requirements_definition.md](../01_requirements_definition.md)から[06_utility_functions.md](../06_utility_functions.md)までの各ドキュメントも併せて参照してください。

各コード例は[04_implementation_rules.md](../04_implementation_rules.md)と[05_component_design.md](../05_component_design.md)で定義された命名規則と実装パターンに厳密に従っています。

## コードサンプルのナビゲーション

- [ドメイン層の実装](#ドメイン層の実装)
- [アプリケーション層の実装](#アプリケーション層の実装)
- [インフラストラクチャ層の実装](#インフラストラクチャ層の実装)
- [API Routes実装](#api-routes実装)
- [CQRS実装](#cqrs実装)
- [ドメインイベント実装](#ドメインイベント実装)
- [認証・認可実装](#認証認可実装)
- [エラーハンドリング](#エラーハンドリング)
- [WebSocket実装](#websocket実装)
- [多言語対応](#多言語対応)
- [マルチクラウド対応](#マルチクラウド対応)

## ドメイン層の実装

*[07_server_implementation.md - ビジネスロジックアーキテクチャパターン](../07_server_implementation.md#ビジネスロジックアーキテクチャパターン)の実装例*

ドメイン層は、ビジネスのコアロジックと規則を実装する層です。ここでは、エンティティ、値オブジェクト、ドメインサービス、リポジトリインターフェースなどの実装例を示します。

### エンティティの実装

以下は`User`エンティティの実装例です：

```typescript
// src/domain/entities/user.entity.ts

import { v4 as uuidv4 } from 'uuid';
import { Email } from '../value-objects/email.value-object';
import { DomainEvent } from '../events/domain-event.interface';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserUpdatedEvent } from '../events/user-updated.event';
import { UserRole } from '../enums/user-role.enum';
import { AuthProvider } from '../enums/auth-provider.enum';

export class User {
  private events: DomainEvent[] = [];
  
  // プライベートコンストラクタ - ファクトリメソッドを使用して作成を強制
  private constructor(
    private _id: string,
    private _email: Email,
    private _name: string,
    private _passwordHash?: string,
    private _roles: UserRole[] = [UserRole.USER],
    private _provider: AuthProvider = AuthProvider.EMAIL,
    private _providerId?: string,
    private _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {}

  // ID取得
  get id(): string {
    return this._id;
  }

  // 名前取得
  get name(): string {
    return this._name;
  }

  // メールアドレス取得
  get email(): Email {
    return this._email;
  }

  // ロール取得
  get roles(): UserRole[] {
    return [...this._roles];
  }

  // 作成日時取得
  get createdAt(): Date {
    return new Date(this._createdAt);
  }

  // 更新日時取得
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  // パスワードハッシュ取得
  get passwordHash(): string | undefined {
    return this._passwordHash;
  }

  // 認証プロバイダー取得
  get provider(): AuthProvider {
    return this._provider;
  }

  // プロバイダーID取得
  get providerId(): string | undefined {
    return this._providerId;
  }

  // ファクトリメソッド - 新規ユーザー作成
  public static create(
    email: Email,
    name: string,
    passwordHash?: string,
    roles: UserRole[] = [UserRole.USER],
    provider: AuthProvider = AuthProvider.EMAIL,
    providerId?: string
  ): User {
    const id = uuidv4();
    const user = new User(
      id,
      email,
      name,
      passwordHash,
      roles,
      provider,
      providerId
    );
    
    // ドメインイベント発行
    user.addEvent(new UserCreatedEvent({
      userId: id,
      email: email.value,
      name,
      roles,
      provider
    }));
    
    return user;
  }

  // ユーザーの再構築（リポジトリからのロード時など）
  public static reconstitute(
    id: string,
    email: Email,
    name: string,
    passwordHash?: string,
    roles: UserRole[] = [UserRole.USER],
    provider: AuthProvider = AuthProvider.EMAIL,
    providerId?: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): User {
    return new User(
      id,
      email,
      name,
      passwordHash,
      roles,
      provider,
      providerId,
      createdAt,
      updatedAt
    );
  }

  // メールアドレス更新
  public updateEmail(email: Email): void {
    if (this._email.equals(email)) {
      return;
    }
    
    this._email = email;
    this._updatedAt = new Date();
    
    // ドメインイベント発行
    this.addEvent(new UserUpdatedEvent({
      userId: this._id,
      email: email.value,
      name: this._name,
      updatedAt: this._updatedAt
    }));
  }

  // 名前更新
  public updateName(name: string): void {
    if (this._name === name) {
      return;
    }
    
    this._name = name;
    this._updatedAt = new Date();
    
    // ドメインイベント発行
    this.addEvent(new UserUpdatedEvent({
      userId: this._id,
      email: this._email.value,
      name: this._name,
      updatedAt: this._updatedAt
    }));
  }

  // パスワードハッシュ更新
  public updatePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this._updatedAt = new Date();
    
    // ドメインイベント発行
    this.addEvent(new UserUpdatedEvent({
      userId: this._id,
      email: this._email.value,
      name: this._name,
      updatedAt: this._updatedAt,
      passwordChanged: true
    }));
  }

  // ロール更新
  public updateRoles(roles: UserRole[]): void {
    this._roles = [...roles];
    this._updatedAt = new Date();
    
    // ドメインイベント発行
    this.addEvent(new UserUpdatedEvent({
      userId: this._id,
      email: this._email.value,
      name: this._name,
      roles: this._roles,
      updatedAt: this._updatedAt
    }));
  }

  // パスワード確認
  public verifyPassword(passwordHash: string): boolean {
    return this._passwordHash === passwordHash;
  }

  // ロール確認
  public hasRole(role: UserRole): boolean {
    return this._roles.includes(role);
  }

  // ドメインイベント追加
  private addEvent(event: DomainEvent): void {
    this.events.push(event);
  }

  // ドメインイベント取得・クリア
  public getEvents(): DomainEvent[] {
    return [...this.events];
  }

  public clearEvents(): void {
    this.events = [];
  }
}
```

### 値オブジェクトの実装

以下は`Email`値オブジェクトの実装例です：

```typescript
// src/domain/value-objects/email.value-object.ts

export class Email {
  private constructor(private readonly _value: string) {
    this.validate();
  }

  // 値取得
  get value(): string {
    return this._value;
  }

  // ファクトリメソッド
  public static create(email: string): Email {
    return new Email(email);
  }

  // メールアドレスの検証
  private validate(): void {
    if (!this._value) {
      throw new Error('メールアドレスは必須です');
    }
    
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this._value)) {
      throw new Error('無効なメールアドレス形式です');
    }
  }

  // 等価性比較
  public equals(other?: Email): boolean {
    if (!other) {
      return false;
    }
    return this._value.toLowerCase() === other.value.toLowerCase();
  }

  // シリアライズ
  public toString(): string {
    return this._value;
  }

  // JSON変換
  public toJSON(): string {
    return this._value;
  }
}
```

### リポジトリインターフェースの定義

[07_server_implementation.md - リポジトリパターン](../07_server_implementation.md#リポジトリパターン)で定義されているインターフェースの実装例です：

```typescript
// src/domain/repositories/user-repository.interface.ts

import { User } from '../entities/user.entity';
import { Email } from '../value-objects/email.value-object';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  create(user: User): Promise<void>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
```

### ドメインサービスの実装

```typescript
// src/domain/services/user.service.ts

import { Email } from '../value-objects/email.value-object';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user-repository.interface';
import { DomainEventPublisher } from '../events/domain-event-publisher.interface';
import { Result } from '../../shared/utils/result';
import { UserRole } from '../enums/user-role.enum';
import { AuthProvider } from '../enums/auth-provider.enum';

export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: DomainEventPublisher
  ) {}

  // 新規ユーザー登録
  async registerUser(
    email: Email,
    name: string,
    passwordHash: string
  ): Promise<Result<User>> {
    try {
      // メールアドレスの重複チェック
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        return Result.fail('このメールアドレスは既に登録されています');
      }

      // ユーザー作成
      const user = User.create(
        email,
        name,
        passwordHash,
        [UserRole.USER],
        AuthProvider.EMAIL
      );

      // リポジトリに保存
      await this.userRepository.create(user);

      // ドメインイベント発行
      const events = user.getEvents();
      await this.eventPublisher.publishAll(events);
      user.clearEvents();

      return Result.ok(user);
    } catch (error) {
      return Result.fail((error as Error).message);
    }
  }

  // パスワード変更
  async changePassword(
    userId: string,
    newPasswordHash: string
  ): Promise<Result<void>> {
    try {
      // ユーザー取得
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return Result.fail('ユーザーが見つかりません');
      }

      // パスワード更新
      user.updatePassword(newPasswordHash);

      // リポジトリに保存
      await this.userRepository.update(user);

      // ドメインイベント発行
      const events = user.getEvents();
      await this.eventPublisher.publishAll(events);
      user.clearEvents();

      return Result.ok();
    } catch (error) {
      return Result.fail((error as Error).message);
    }
  }
}
```

## アプリケーション層の実装

*[07_server_implementation.md - アプリケーション層の実装](../07_server_implementation.md#アプリケーション層)の実装例*

アプリケーション層は、ドメイン層とインフラストラクチャ層の橋渡しを行い、ユースケースを実装する層です。ここでは、ユースケースとDTOの実装例を示します。

### ユースケースの実装

```typescript
// src/application/usecases/user/register-user.usecase.ts

import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../../../domain/repositories/user-repository.interface';
import { DomainEventPublisher } from '../../../domain/events/domain-event-publisher.interface';
import { UserService } from '../../../domain/services/user.service';
import { Email } from '../../../domain/value-objects/email.value-object';
import { RegisterUserDto } from '../../dtos/user/register-user.dto';
import { UserResponseDto } from '../../dtos/user/user-response.dto';
import { Result } from '../../../shared/utils/result';
import { IPasswordHasher } from '../../../domain/services/password-hasher.interface';
import { logger } from '../../../config/logger';

@injectable()
export class RegisterUserUseCase {
  private userService: UserService;

  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('DomainEventPublisher') private eventPublisher: DomainEventPublisher,
    @inject('IPasswordHasher') private passwordHasher: IPasswordHasher
  ) {
    this.userService = new UserService(userRepository, eventPublisher);
  }

  async execute(dto: RegisterUserDto): Promise<Result<UserResponseDto>> {
    try {
      logger.debug('ユーザー登録ユースケース実行', { email: dto.email });

      // 入力検証（DTOによって既に検証済みの前提）
      
      // パスワードのハッシュ化
      const passwordHash = await this.passwordHasher.hash(dto.password);
      
      // メールアドレス値オブジェクト作成
      let emailVo: Email;
      try {
        emailVo = Email.create(dto.email);
      } catch (error) {
        return Result.fail((error as Error).message);
      }
      
      // ドメインサービスを使用したユーザー登録
      const result = await this.userService.registerUser(
        emailVo,
        dto.name,
        passwordHash
      );
      
      if (result.isFailure) {
        return Result.fail<UserResponseDto>(result.error);
      }
      
      const user = result.getValue();
      
      // レスポンスDTOへの変換
      const responseDto: UserResponseDto = {
        id: user.id,
        email: user.email.value,
        name: user.name,
        roles: user.roles,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString()
      };
      
      return Result.ok(responseDto);
    } catch (error) {
      logger.error('ユーザー登録処理でエラーが発生しました', { error });
      return Result.fail((error as Error).message);
    }
  }
}
```

### DTOの実装

```typescript
// src/application/dtos/user/register-user.dto.ts

import { z } from 'zod';

// Zodスキーマ定義
export const registerUserSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  name: z.string().min(2, '名前は2文字以上で入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword']
});

// 型定義
export type RegisterUserDto = z.infer<typeof registerUserSchema>;
```

```typescript
// src/application/dtos/user/user-response.dto.ts

import { UserRole } from '../../../domain/enums/user-role.enum';

export interface UserResponseDto {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}
```

## インフラストラクチャ層の実装

*[07_server_implementation.md - インフラストラクチャ層の実装](../07_server_implementation.md#インフラストラクチャ層)の実装例*

インフラストラクチャ層は、外部システムとの連携や永続化などの実装を担当する層です。ここでは、リポジトリ実装、データマッパー、外部サービス連携などの実装例を示します。

### リポジトリの実装

```typescript
// src/infrastructure/repositories/user.repository.ts

import { injectable, inject } from 'tsyringe';
import { db } from '../database/db-client';
import { eq } from 'drizzle-orm';
import { users } from '../database/schema/users';
import { UserRepository } from '../../domain/repositories/user-repository.interface';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { UserMapper } from '../mappers/user.mapper';
import { logger } from '../../config/logger';

@injectable()
export class UserRepository implements UserRepository {
  constructor(
    @inject(UserMapper) private mapper: UserMapper
  ) {}

  async findById(id: string): Promise<User | null> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.id, id)
      });
      
      if (!result) {
        return null;
      }
      
      return this.mapper.toDomain(result);
    } catch (error) {
      logger.error('ユーザーIDによる検索でエラーが発生しました', { error, id });
      throw new Error(`ユーザー検索エラー: ${(error as Error).message}`);
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.email, email.value)
      });
      
      if (!result) {
        return null;
      }
      
      return this.mapper.toDomain(result);
    } catch (error) {
      logger.error('メールアドレスによるユーザー検索でエラーが発生しました', { error, email: email.value });
      throw new Error(`ユーザー検索エラー: ${(error as Error).message}`);
    }
  }

  async create(user: User): Promise<void> {
    try {
      const data = this.mapper.toPersistence(user);
      
      await db.insert(users).values(data);
    } catch (error) {
      logger.error('ユーザー作成でエラーが発生しました', { error, userId: user.id });
      throw new Error(`ユーザー作成エラー: ${(error as Error).message}`);
    }
  }

  async update(user: User): Promise<void> {
    try {
      const data = this.mapper.toPersistence(user);
      
      await db.update(users)
        .set(data)
        .where(eq(users.id, user.id));
    } catch (error) {
      logger.error('ユーザー更新でエラーが発生しました', { error, userId: user.id });
      throw new Error(`ユーザー更新エラー: ${(error as Error).message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await db.delete(users).where(eq(users.id, id));
    } catch (error) {
      logger.error('ユーザー削除でエラーが発生しました', { error, id });
      throw new Error(`ユーザー削除エラー: ${(error as Error).message}`);
    }
  }
}
```

### マッパーの実装

```typescript
// src/infrastructure/mappers/user.mapper.ts

import { injectable } from 'tsyringe';
import { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.value-object';
import { UserRole } from '../../domain/enums/user-role.enum';
import { AuthProvider } from '../../domain/enums/auth-provider.enum';
import { users } from '../database/schema/users';
import type { User as UserModel } from '../database/schema/users';

@injectable()
export class UserMapper {
  // データベースモデルからドメインモデルへの変換
  toDomain(persistenceModel: UserModel): User {
    return User.reconstitute(
      persistenceModel.id,
      Email.create(persistenceModel.email),
      persistenceModel.name,
      persistenceModel.passwordHash,
      persistenceModel.roles as UserRole[],
      persistenceModel.provider as AuthProvider,
      persistenceModel.providerId,
      new Date(persistenceModel.createdAt),
      new Date(persistenceModel.updatedAt)
    );
  }

  // ドメインモデルからデータベースモデルへの変換
  toPersistence(domainModel: User): Omit<UserModel, 'createdAt' | 'updatedAt'> {
    return {
      id: domainModel.id,
      email: domainModel.email.value,
      name: domainModel.name,
      passwordHash: domainModel.passwordHash,
      roles: domainModel.roles,
      provider: domainModel.provider,
      providerId: domainModel.providerId
    };
  }
}
```

## API Routes実装

*[07_server_implementation.md - API実装パターン](../07_server_implementation.md#api実装パターン)の実装例*

Next.jsのApp Routerを使用したAPI実装例を示します。これらのAPIは、[07_server_implementation.md - REST API規約](../07_server_implementation.md#rest-api規約)に準拠しています。

### APIルートの実装

```typescript
// src/app/api/v1/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { container } from '@/infrastructure/ioc/container';
import { RegisterUserUseCase } from '@/application/usecases/user/register-user.usecase';
import { GetUsersUseCase } from '@/application/usecases/user/get-users.usecase';
import { registerUserSchema } from '@/application/dtos/user/register-user.dto';
import { ApiResponse } from '@/shared/utils/api-response';
import { withAuth } from '@/shared/middleware/auth.middleware';
import { UserRole } from '@/domain/enums/user-role.enum';
import { logger } from '@/config/logger';

// POST /api/v1/users - ユーザー登録
export async function POST(req: NextRequest) {
  try {
    // リクエストボディのパース
    const body = await req.json();
    
    // DTOの検証
    const validationResult = registerUserSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('ユーザー登録リクエスト検証失敗', { errors: validationResult.error });
      return ApiResponse.badRequest(validationResult.error.format());
    }
    
    const dto = validationResult.data;
    
    // ユースケースの実行
    const registerUserUseCase = container.resolve(RegisterUserUseCase);
    const result = await registerUserUseCase.execute(dto);
    
    // 結果の処理
    if (result.isFailure) {
      return ApiResponse.badRequest(result.error);
    }
    
    // 成功レスポンス
    return ApiResponse.created(result.getValue());
  } catch (error) {
    logger.error('ユーザー登録処理でエラーが発生しました', { error });
    return ApiResponse.serverError('ユーザー登録処理中にエラーが発生しました');
  }
}

// GET /api/v1/users - ユーザー一覧取得（管理者専用）
export const GET = withAuth(
  [UserRole.ADMIN],
  async (req: NextRequest) => {
    try {
      // クエリパラメータの取得
      const { searchParams } = new URL(req.url);
      const page = Number(searchParams.get('page') || '1');
      const limit = Number(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const sort = searchParams.get('sort') || 'createdAt';
      const order = searchParams.get('order') || 'desc';
      
      // ユースケースの実行
      const getUsersUseCase = container.resolve(GetUsersUseCase);
      const result = await getUsersUseCase.execute({
        page,
        limit,
        search,
        sort,
        order
      });
      
      // 結果の処理
      if (result.isFailure) {
        return ApiResponse.badRequest(result.error);
      }
      
      // 成功レスポンス
      return ApiResponse.ok(result.getValue());
    } catch (error) {
      logger.error('ユーザー一覧取得処理でエラーが発生しました', { error });
      return ApiResponse.serverError('ユーザー一覧取得処理中にエラーが発生しました');
    }
  }
);
```

```typescript
// src/app/api/v1/users/[id]/route.ts

import { NextRequest } from 'next/server';
import { container } from '@/infrastructure/ioc/container';
import { GetUserByIdUseCase } from '@/application/usecases/user/get-user-by-id.usecase';
import { UpdateUserUseCase } from '@/application/usecases/user/update-user.usecase';
import { DeleteUserUseCase } from '@/application/usecases/user/delete-user.usecase';
import { updateUserSchema } from '@/application/dtos/user/update-user.dto';
import { ApiResponse } from '@/shared/utils/api-response';
import { withAuth } from '@/shared/middleware/auth.middleware';
import { UserRole } from '@/domain/enums/user-role.enum';
import { withResourceAuth } from '@/shared/middleware/resource-auth.middleware';
import { logger } from '@/config/logger';

// GET /api/v1/users/[id] - 特定ユーザー取得
export const GET = withAuth(
  [], // 全認証済みユーザーがアクセス可能
  withResourceAuth(
    async (req: NextRequest, { params, user }) => {
      try {
        const { id } = params;
        
        // 自分自身または管理者のみアクセス可能
        if (id !== user.id && !user.roles.includes(UserRole.ADMIN)) {
          return ApiResponse.forbidden('このリソースにアクセスする権限がありません');
        }
        
        // ユースケースの実行
        const getUserByIdUseCase = container.resolve(GetUserByIdUseCase);
        const result = await getUserByIdUseCase.execute({ id });
        
        // 結果の処理
        if (result.isFailure) {
          return ApiResponse.notFound(result.error);
        }
        
        // 成功レスポンス
        return ApiResponse.ok(result.getValue());
      } catch (error) {
        logger.error('ユーザー取得処理でエラーが発生しました', { error, userId: params.id });
        return ApiResponse.serverError('ユーザー取得処理中にエラーが発生しました');
      }
    }
  )
);

// PUT /api/v1/users/[id] - ユーザー更新
export const PUT = withAuth(
  [], // 全認証済みユーザーがアクセス可能
  withResourceAuth(
    async (req: NextRequest, { params, user }) => {
      try {
        const { id } = params;
        
        // 自分自身または管理者のみアクセス可能
        if (id !== user.id && !user.roles.includes(UserRole.ADMIN)) {
          return ApiResponse.forbidden('このリソースにアクセスする権限がありません');
        }
        
        // リクエストボディのパース
        const body = await req.json();
        
        // DTOの検証
        const validationResult = updateUserSchema.safeParse(body);
        if (!validationResult.success) {
          return ApiResponse.badRequest(validationResult.error.format());
        }
        
        const dto = { id, ...validationResult.data };
        
        // ユースケースの実行
        const updateUserUseCase = container.resolve(UpdateUserUseCase);
        const result = await updateUserUseCase.execute(dto);
        
        // 結果の処理
        if (result.isFailure) {
          return ApiResponse.badRequest(result.error);
        }
        
        // 成功レスポンス
        return ApiResponse.ok(result.getValue());
      } catch (error) {
        logger.error('ユーザー更新処理でエラーが発生しました', { error, userId: params.id });
        return ApiResponse.serverError('ユーザー更新処理中にエラーが発生しました');
      }
    }
  )
);

// DELETE /api/v1/users/[id] - ユーザー削除
export const DELETE = withAuth(
  [], // 全認証済みユーザーがアクセス可能
  withResourceAuth(
    async (req: NextRequest, { params, user }) => {
      try {
        const { id } = params;
        
        // 自分自身または管理者のみアクセス可能
        if (id !== user.id && !user.roles.includes(UserRole.ADMIN)) {
          return ApiResponse.forbidden('このリソースにアクセスする権限がありません');
        }
        
        // ユースケースの実行
        const deleteUserUseCase = container.resolve(DeleteUserUseCase);
        const result = await deleteUserUseCase.execute({ id });
        
        // 結果の処理
        if (result.isFailure) {
          return ApiResponse.badRequest(result.error);
        }
        
        // 成功レスポンス - 204 No Content
        return ApiResponse.noContent();
      } catch (error) {
        logger.error('ユーザー削除処理でエラーが発生しました', { error, userId: params.id });
        return ApiResponse.serverError('ユーザー削除処理中にエラーが発生しました');
      }
    }
  )
);
```

### APIレスポンスユーティリティ

```typescript
// src/shared/utils/api-response.ts

import { NextResponse } from 'next/server';

export class ApiResponse {
  // 200 OK
  static ok<T>(data: T) {
    return NextResponse.json({
      success: true,
      data
    }, { status: 200 });
  }
  
  // 201 Created
  static created<T>(data: T) {
    return NextResponse.json({
      success: true,
      data
    }, { status: 201 });
  }
  
  // 204 No Content
  static noContent() {
    return new NextResponse(null, { status: 204 });
  }
  
  // 400 Bad Request
  static badRequest(message: string | object) {
    return NextResponse.json({
      success: false,
      error: {
        message: typeof message === 'string' ? message : 'リクエストが不正です',
        details: typeof message !== 'string' ? message : undefined
      }
    }, { status: 400 });
  }
  
  // 401 Unauthorized
  static unauthorized(message = '認証が必要です') {
    return NextResponse.json({
      success: false,
      error: {
        message
      }
    }, { status: 401 });
  }
  
  // 403 Forbidden
  static forbidden(message = 'アクセス権限がありません') {
    return NextResponse.json({
      success: false,
      error: {
        message
      }
    }, { status: 403 });
  }
  
  // 404 Not Found
  static notFound(message = 'リソースが見つかりません') {
    return NextResponse.json({
      success: false,
      error: {
        message
      }
    }, { status: 404 });
  }
  
  // 500 Internal Server Error
  static serverError(message = 'サーバーエラーが発生しました') {
    return NextResponse.json({
      success: false,
      error: {
        message
      }
    }, { status: 500 });
  }
}
```

## CQRS実装

*[07_server_implementation.md - CQRS パターン](../07_server_implementation.md#cqrs-パターン)の実装例*

Command Query Responsibility Segregation（CQRS）パターンの実装例を示します。コマンド（状態変更）とクエリ（状態参照）の責務を分離し、それぞれを最適化した設計が特徴です。

### コマンドとコマンドハンドラー

```typescript
// src/application/commands/command.interface.ts

export interface Command<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly metadata: CommandMetadata;
}

export interface CommandMetadata {
  readonly timestamp: Date;
  readonly userId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
}

export interface CommandHandler<TCommand extends Command = Command, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
```

```typescript
// src/application/commands/project/create-project.command.ts

import { v4 as uuidv4 } from 'uuid';
import { Command, CommandMetadata } from '../command.interface';

export interface CreateProjectPayload {
  name: string;
  description: string;
  ownerId: string;
  programId?: string;
  isPublic: boolean;
  tags?: string[];
}

export class CreateProjectCommand implements Command<CreateProjectPayload> {
  readonly type = 'project.create';
  
  constructor(
    readonly payload: CreateProjectPayload,
    readonly metadata: CommandMetadata
  ) {}
  
  // ファクトリメソッド
  static create(
    payload: CreateProjectPayload,
    userId: string,
    correlationId?: string
  ): CreateProjectCommand {
    return new CreateProjectCommand(
      payload,
      {
        timestamp: new Date(),
        userId,
        correlationId: correlationId || uuidv4(),
        causationId: uuidv4()
      }
    );
  }
}
```

```typescript
// src/application/commands/project/create-project.handler.ts

import { injectable, inject } from 'tsyringe';
import { CommandHandler } from '../command.interface';
import { CreateProjectCommand } from './create-project.command';
import { ProjectRepository } from '@/domain/repositories/project.repository.interface';
import { UserRepository } from '@/domain/repositories/user.repository.interface';
import { DomainEventPublisher } from '@/domain/events/domain-event-publisher.interface';
import { Project } from '@/domain/entities/project.entity';
import { logger } from '@/config/logger';

@injectable()
export class CreateProjectCommandHandler implements CommandHandler<CreateProjectCommand, string> {
  constructor(
    @inject('ProjectRepository') private projectRepository: ProjectRepository,
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('DomainEventPublisher') private eventPublisher: DomainEventPublisher
  ) {}
  
  async execute(command: CreateProjectCommand): Promise<string> {
    const { payload, metadata } = command;
    
    logger.debug('プロジェクト作成コマンド実行', { 
      projectName: payload.name,
      userId: metadata.userId 
    });
    
    // コマンドの検証
    if (!payload.name || !payload.ownerId) {
      throw new Error('プロジェクト名とオーナーIDは必須です');
    }
    
    // ユーザーの存在確認
    const user = await this.userRepository.findById(payload.ownerId);
    if (!user) {
      throw new Error(`オーナーユーザー(${payload.ownerId})が見つかりません`);
    }
    
    // プロジェクトエンティティの作成
    const project = Project.create(
      payload.name,
      payload.description,
      payload.ownerId,
      payload.isPublic,
      payload.programId,
      payload.tags
    );
    
    // リポジトリに保存
    await this.projectRepository.create(project);
    
    // ドメインイベントの発行
    const events = project.getEvents();
    await this.eventPublisher.publishAll(events);
    project.clearEvents();
    
    return project.id;
  }
}
```

### コマンドバスの実装

```typescript
// src/application/commands/command-bus.interface.ts

import { Command } from './command.interface';

export interface CommandBus {
  execute<T extends Command, R>(command: T): Promise<R>;
  registerHandler<T extends Command, R>(
    commandType: string, 
    handler: (command: T) => Promise<R>
  ): void;
}
```

```typescript
// src/infrastructure/command-bus/command-bus.ts

import { injectable, inject, container } from 'tsyringe';
import { CommandBus } from '../../application/commands/command-bus.interface';
import { Command } from '../../application/commands/command.interface';
import { logger } from '../../config/logger';

@injectable()
export class CommandBus implements CommandBus {
  private handlers = new Map<string, (command: any) => Promise<any>>();
  
  registerHandler<T extends Command, R>(
    commandType: string, 
    handler: (command: T) => Promise<R>
  ): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`コマンドタイプ "${commandType}" のハンドラは既に登録されています`);
    }
    
    this.handlers.set(commandType, handler);
    logger.debug(`コマンドハンドラ登録: ${commandType}`);
  }
  
  async execute<T extends Command, R>(command: T): Promise<R> {
    const { type } = command;
    
    logger.debug(`コマンド実行: ${type}`, { 
      commandType: type, 
      correlationId: command.metadata.correlationId 
    });
    
    const handler = this.handlers.get(type);
    
    if (!handler) {
      throw new Error(`コマンドタイプ "${type}" のハンドラが見つかりません`);
    }
    
    try {
      return await handler(command);
    } catch (error) {
      logger.error(`コマンド実行エラー: ${type}`, { 
        error,
        commandType: type, 
        correlationId: command.metadata.correlationId 
      });
      throw error;
    }
  }
}
```

### クエリとクエリハンドラー

```typescript
// src/application/queries/query.interface.ts

export interface Query<T = unknown> {
  readonly type: string;
  readonly payload: T;
}

export interface QueryHandler<TQuery extends Query = Query, TResult = unknown> {
  execute(query: TQuery): Promise<TResult>;
}
```

```typescript
// src/application/queries/project/get-projects.query.ts

import { Query } from '../query.interface';

export interface GetProjectsPayload {
  page: number;
  limit: number;
  search?: string;
  ownerId?: string;
  programId?: string;
  tags?: string[];
  isPublic?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

export class GetProjectsQuery implements Query<GetProjectsPayload> {
  readonly type = 'project.getProjects';
  
  constructor(readonly payload: GetProjectsPayload) {}
  
  static create(payload: GetProjectsPayload): GetProjectsQuery {
    return new GetProjectsQuery({
      page: payload.page || 1,
      limit: payload.limit || 10,
      ...payload
    });
  }
}
```

```typescript
// src/application/queries/project/get-projects.handler.ts

import { injectable, inject } from 'tsyringe';
import { QueryHandler } from '../query.interface';
import { GetProjectsQuery } from './get-projects.query';
import { ProjectReadModel } from '../../../infrastructure/database/read-models/project-read-model.interface';
import { logger } from '../../../config/logger';

export interface ProjectsResult {
  items: Array<{
    id: string;
    name: string;
    description: string;
    ownerId: string;
    ownerName: string;
    programId?: string;
    programName?: string;
    isPublic: boolean;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@injectable()
export class GetProjectsQueryHandler implements QueryHandler<GetProjectsQuery, ProjectsResult> {
  constructor(
    @inject('ProjectReadModel') private projectReadModel: ProjectReadModel
  ) {}
  
  async execute(query: GetProjectsQuery): Promise<ProjectsResult> {
    const { payload } = query;
    
    logger.debug('プロジェクト検索クエリ実行', { 
      page: payload.page, 
      limit: payload.limit,
      search: payload.search
    });
    
    // 検索条件を構築
    const searchCriteria = {
      search: payload.search,
      ownerId: payload.ownerId,
      programId: payload.programId,
      tags: payload.tags,
      isPublic: payload.isPublic
    };
    
    // プロジェクト検索
    const projects = await this.projectReadModel.findProjects(
      searchCriteria,
      {
        page: payload.page,
        limit: payload.limit,
        sort: payload.sort || 'createdAt',
        order: payload.order || 'desc'
      }
    );
    
    // 総件数取得
    const total = await this.projectReadModel.countProjects(searchCriteria);
    
    // 総ページ数計算
    const totalPages = Math.ceil(total / payload.limit);
    
    return {
      items: projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        ownerId: project.ownerId,
        ownerName: project.ownerName,
        programId: project.programId,
        programName: project.programName,
        isPublic: project.isPublic,
        tags: project.tags,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      })),
      total,
      page: payload.page,
      limit: payload.limit,
      totalPages
    };
  }
}
```

### クエリバスの実装

```typescript
// src/application/queries/query-bus.interface.ts

import { Query } from './query.interface';

export interface QueryBus {
  execute<T extends Query, R>(query: T): Promise<R>;
  registerHandler<T extends Query, R>(
    queryType: string, 
    handler: (query: T) => Promise<R>
  ): void;
}
```

```typescript
// src/infrastructure/query-bus/query-bus.ts

import { injectable } from 'tsyringe';
import { QueryBus } from '../../application/queries/query-bus.interface';
import { Query } from '../../application/queries/query.interface';
import { logger } from '../../config/logger';

@injectable()
export class QueryBus implements QueryBus {
  private handlers = new Map<string, (query: any) => Promise<any>>();
  
  registerHandler<T extends Query, R>(
    queryType: string, 
    handler: (query: T) => Promise<R>
  ): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`クエリタイプ "${queryType}" のハンドラは既に登録されています`);
    }
    
    this.handlers.set(queryType, handler);
    logger.debug(`クエリハンドラ登録: ${queryType}`);
  }
  
  async execute<T extends Query, R>(query: T): Promise<R> {
    const { type } = query;
    
    logger.debug(`クエリ実行: ${type}`);
    
    const handler = this.handlers.get(type);
    
    if (!handler) {
      throw new Error(`クエリタイプ "${type}" のハンドラが見つかりません`);
    }
    
    try {
      return await handler(query);
    } catch (error) {
      logger.error(`クエリ実行エラー: ${type}`, { error });
      throw error;
    }
  }
}
```

### リードモデルの実装

```typescript
// src/infrastructure/database/read-models/project-read-model.interface.ts

export interface ProjectReadModel {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  programId?: string;
  programName?: string;
  isPublic: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectSearchCriteria {
  search?: string;
  ownerId?: string;
  programId?: string;
  tags?: string[];
  isPublic?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort: string;
  order: 'asc' | 'desc';
}

export interface IProjectReadModel {
  findProjectById(id: string): Promise<ProjectReadModel | null>;
  findProjects(
    criteria: ProjectSearchCriteria,
    pagination: PaginationOptions
  ): Promise<ProjectReadModel[]>;
  countProjects(criteria: ProjectSearchCriteria): Promise<number>;
}
```

```typescript
// src/infrastructure/database/read-models/project-read-model.ts

import { injectable } from 'tsyringe';
import { db } from '../db-client';
import { eq, and, like, asc, desc, sql } from 'drizzle-orm';
import { projects } from '../schema/projects';
import { users } from '../schema/users';
import { programs } from '../schema/programs';
import { 
  ProjectReadModel, 
  ProjectSearchCriteria, 
  PaginationOptions 
} from './project-read-model.interface';
import { logger } from '../../../config/logger';

@injectable()
export class ProjectReadModel implements ProjectReadModel {
  async findProjectById(id: string): Promise<ProjectReadModel | null> {
    try {
      // プロジェクト情報をユーザー名、プログラム名と一緒に取得
      const result = await db.select({
        project: projects,
        ownerName: users.name,
        programName: programs.name
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .leftJoin(programs, eq(projects.programId, programs.id))
      .where(eq(projects.id, id))
      .limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const row = result[0];
      
      return {
        id: row.project.id,
        name: row.project.name,
        description: row.project.description,
        ownerId: row.project.ownerId,
        ownerName: row.ownerName,
        programId: row.project.programId,
        programName: row.programName,
        isPublic: row.project.isPublic,
        tags: row.project.tags,
        createdAt: row.project.createdAt,
        updatedAt: row.project.updatedAt
      };
    } catch (error) {
      logger.error('プロジェクト検索エラー', { error, id });
      throw new Error(`プロジェクト検索エラー: ${(error as Error).message}`);
    }
  }

  async findProjects(
    criteria: ProjectSearchCriteria,
    pagination: PaginationOptions
  ): Promise<ProjectReadModel[]> {
    try {
      // 検索条件の構築
      const conditions = [];
      
      if (criteria.ownerId) {
        conditions.push(eq(projects.ownerId, criteria.ownerId));
      }
      
      if (criteria.programId) {
        conditions.push(eq(projects.programId, criteria.programId));
      }
      
      if (criteria.isPublic !== undefined) {
        conditions.push(eq(projects.isPublic, criteria.isPublic));
      }
      
      if (criteria.search) {
        conditions.push(
          like(projects.name, `%${criteria.search}%`)
        );
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        // PostgreSQLの配列演算子を使用してタグの包含検索
        conditions.push(
          sql`${projects.tags} && ${criteria.tags}`
        );
      }
      
      // ソート順の決定
      const sortDirection = pagination.order === 'asc' ? asc : desc;
      let sortColumn;
      
      switch (pagination.sort) {
        case 'name':
          sortColumn = sortDirection(projects.name);
          break;
        case 'updatedAt':
          sortColumn = sortDirection(projects.updatedAt);
          break;
        default:
          sortColumn = sortDirection(projects.createdAt);
      }
      
      // オフセットの計算
      const offset = (pagination.page - 1) * pagination.limit;
      
      // クエリの実行
      const query = db.select({
        project: projects,
        ownerName: users.name,
        programName: programs.name
      })
      .from(projects)
      .leftJoin(users, eq(projects.ownerId, users.id))
      .leftJoin(programs, eq(projects.programId, programs.id))
      .orderBy(sortColumn)
      .limit(pagination.limit)
      .offset(offset);
      
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      const result = await query;
      
      return result.map(row => ({
        id: row.project.id,
        name: row.project.name,
        description: row.project.description,
        ownerId: row.project.ownerId,
        ownerName: row.ownerName,
        programId: row.project.programId,
        programName: row.programName,
        isPublic: row.project.isPublic,
        tags: row.project.tags,
        createdAt: row.project.createdAt,
        updatedAt: row.project.updatedAt
      }));
    } catch (error) {
      logger.error('プロジェクト一覧検索エラー', { error, criteria });
      throw new Error(`プロジェクト一覧検索エラー: ${(error as Error).message}`);
    }
  }

  async countProjects(criteria: ProjectSearchCriteria): Promise<number> {
    try {
      // 検索条件の構築
      const conditions = [];
      
      if (criteria.ownerId) {
        conditions.push(eq(projects.ownerId, criteria.ownerId));
      }
      
      if (criteria.programId) {
        conditions.push(eq(projects.programId, criteria.programId));
      }
      
      if (criteria.isPublic !== undefined) {
        conditions.push(eq(projects.isPublic, criteria.isPublic));
      }
      
      if (criteria.search) {
        conditions.push(
          like(projects.name, `%${criteria.search}%`)
        );
      }
      
      if (criteria.tags && criteria.tags.length > 0) {
        // PostgreSQLの配列演算子を使用してタグの包含検索
        conditions.push(
          sql`${projects.tags} && ${criteria.tags}`
        );
      }
      
      // カウントクエリの実行
      const query = db.select({
        count: sql`count(*)`.mapWith(Number)
      })
      .from(projects);
      
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      const result = await query;
      
      return result[0].count;
    } catch (error) {
      logger.error('プロジェクト件数取得エラー', { error, criteria });
      throw new Error(`プロジェクト件数取得エラー: ${(error as Error).message}`);
    }
  }
} 
```

## ドメインイベント実装

ドメインイベントとイベント駆動アーキテクチャの実装例を示します。

### ドメインイベントインターフェース

```typescript
// src/domain/events/domain-event.interface.ts

export interface DomainEvent {
  readonly type: string;
  readonly payload: any;
  readonly metadata: EventMetadata;
  readonly occurredAt: Date;
}

export interface EventMetadata {
  eventId: string;
  correlationId?: string;
  causationId?: string;
  version: number;
}
```

### イベント発行インターフェース

```typescript
// src/domain/events/domain-event-publisher.interface.ts

import { DomainEvent } from './domain-event.interface';

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishAll(events: DomainEvent[]): Promise<void>;
}
```

### ドメインイベント実装例

```typescript
// src/domain/events/project-created.event.ts

import { DomainEvent, EventMetadata } from './domain-event.interface';

interface ProjectCreatedEventPayload {
  projectId: string;
  name: string;
  ownerId: string;
  createdAt: Date;
}

export class ProjectCreatedEvent implements DomainEvent {
  readonly type = 'PROJECT_CREATED';
  readonly payload: ProjectCreatedEventPayload;
  readonly metadata: EventMetadata;
  readonly occurredAt: Date;

  constructor(payload: ProjectCreatedEventPayload, metadata?: Partial<EventMetadata>) {
    this.payload = payload;
    this.occurredAt = new Date();
    this.metadata = {
      eventId: crypto.randomUUID(),
      version: 1,
      ...metadata
    };
  }
}
```

### イベントハンドラインターフェース

```typescript
// src/application/events/event-handler.interface.ts

import { DomainEvent } from '../../domain/events/domain-event.interface';

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}
```

### イベントバスの実装

```typescript
// src/infrastructure/events/event-bus.ts

import { injectable, container } from 'tsyringe';
import { DomainEventPublisher } from '../../domain/events/domain-event-publisher.interface';
import { DomainEvent } from '../../domain/events/domain-event.interface';
import { EventHandler } from '../../application/events/event-handler.interface';
import { logger } from '../../config/logger';

// イベントハンドラの登録情報
interface EventHandlerRegistration {
  eventType: string;
  handlerClass: new (...args: any[]) => EventHandler<any>;
}

@injectable()
export class EventBus implements DomainEventPublisher {
  private static handlers: EventHandlerRegistration[] = [];

  // イベントハンドラの登録
  static registerHandler(eventType: string, handlerClass: new (...args: any[]) => EventHandler<any>) {
    EventBus.handlers.push({ eventType, handlerClass });
    logger.debug(`イベントハンドラを登録しました: ${eventType} -> ${handlerClass.name}`);
  }

  // 単一イベントの発行
  async publish(event: DomainEvent): Promise<void> {
    logger.info('ドメインイベント発行', {
      eventType: event.type,
      eventId: event.metadata.eventId,
      correlationId: event.metadata.correlationId
    });

    const handlers = EventBus.handlers
      .filter(h => h.eventType === event.type)
      .map(h => container.resolve(h.handlerClass));

    if (handlers.length === 0) {
      logger.warn(`イベント ${event.type} に対するハンドラが登録されていません`);
      return;
    }

    try {
      // 全てのハンドラを並列実行
      await Promise.all(handlers.map(handler => 
        handler.handle(event).catch(error => {
          logger.error(`イベントハンドラ実行中にエラーが発生しました: ${handler.constructor.name}`, {
            error,
            eventType: event.type,
            eventId: event.metadata.eventId
          });
        })
      ));
    } catch (error) {
      logger.error('イベント処理中にエラーが発生しました', {
        error,
        eventType: event.type,
        eventId: event.metadata.eventId
      });
    }
  }

  // 複数イベントの発行
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

### イベントハンドラの実装例

```typescript
// src/application/events/handlers/project-created.handler.ts

import { injectable, inject } from 'tsyringe';
import { EventHandler } from '../event-handler.interface';
import { ProjectCreatedEvent } from '../../../domain/events/project-created.event';
import { NotificationService } from '../../../domain/services/notification.service';
import { logger } from '../../../config/logger';

@injectable()
export class ProjectCreatedNotificationHandler implements EventHandler<ProjectCreatedEvent> {
  constructor(
    @inject('NotificationService') private notificationService: NotificationService
  ) {}

  async handle(event: ProjectCreatedEvent): Promise<void> {
    try {
      logger.debug('プロジェクト作成通知ハンドラ実行', {
        eventId: event.metadata.eventId,
        projectId: event.payload.projectId
      });

      // プロジェクト作成通知の生成と送信
      await this.notificationService.createNotification({
        userId: event.payload.ownerId,
        type: 'PROJECT_CREATED',
        title: `プロジェクト「${event.payload.name}」が作成されました`,
        content: '新しいプロジェクトの作成が完了しました。今すぐメンバーを招待しましょう。',
        link: `/projects/${event.payload.projectId}`,
        metadata: {
          projectId: event.payload.projectId
        }
      });

      logger.debug('プロジェクト作成通知ハンドラ完了', {
        eventId: event.metadata.eventId,
        projectId: event.payload.projectId
      });
    } catch (error) {
      logger.error('プロジェクト作成通知ハンドラでエラーが発生しました', {
        error,
        eventId: event.metadata.eventId,
        projectId: event.payload.projectId
      });
    }
  }
}
```

### イベントハンドラの登録

```typescript
// src/infrastructure/events/register-handlers.ts

import { EventBus } from './event-bus';
import { ProjectCreatedNotificationHandler } from '../../application/events/handlers/project-created.handler';
import { ProjectUpdatedHandler } from '../../application/events/handlers/project-updated.handler';
import { UserCreatedHandler } from '../../application/events/handlers/user-created.handler';

export function registerEventHandlers() {
  // プロジェクト関連イベント
  EventBus.registerHandler('PROJECT_CREATED', ProjectCreatedNotificationHandler);
  EventBus.registerHandler('PROJECT_UPDATED', ProjectUpdatedHandler);
  
  // ユーザー関連イベント
  EventBus.registerHandler('USER_CREATED', UserCreatedHandler);
  
  // 他のイベントハンドラを登録...
}
```

### イベントストアの実装

```typescript
// src/infrastructure/events/event-store.ts

import { injectable } from 'tsyringe';
import { DomainEvent } from '../../domain/events/domain-event.interface';
import { db } from '../database/db';
import { domainEvents } from '../database/schema/domain-events';
import { sql } from 'drizzle-orm';
import { logger } from '../../config/logger';

@injectable()
export class EventStore {
  // イベントの保存
  async saveEvent(event: DomainEvent): Promise<void> {
    try {
      await db.insert(domainEvents).values({
        id: event.metadata.eventId,
        type: event.type,
        payload: JSON.stringify(event.payload),
        metadata: JSON.stringify(event.metadata),
        occurredAt: event.occurredAt
      });
      
      logger.debug('イベントをストアに保存しました', {
        eventId: event.metadata.eventId,
        eventType: event.type
      });
    } catch (error) {
      logger.error('イベント保存中にエラーが発生しました', {
        error,
        eventId: event.metadata.eventId,
        eventType: event.type
      });
      throw error;
    }
  }

  // イベントの取得
  async getEvents(
    options: {
      eventTypes?: string[];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DomainEvent[]> {
    try {
      // 検索条件の構築
      let conditions = [];
      const params: any[] = [];

      if (options.eventTypes && options.eventTypes.length > 0) {
        conditions.push('type IN (?)');
        params.push(options.eventTypes);
      }

      if (options.startDate) {
        conditions.push('occurred_at >= ?');
        params.push(options.startDate);
      }

      if (options.endDate) {
        conditions.push('occurred_at <= ?');
        params.push(options.endDate);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const limit = options.limit || 100;
      const offset = options.offset || 0;

      // クエリ実行
      const result = await db.execute(sql.raw(`
        SELECT *
        FROM domain_events
        ${whereClause}
        ORDER BY occurred_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `, ...params));

      // 結果の変換
      return result.rows.map(row => ({
        type: row.type,
        payload: JSON.parse(row.payload),
        metadata: JSON.parse(row.metadata),
        occurredAt: row.occurred_at
      }));
    } catch (error) {
      logger.error('イベント取得中にエラーが発生しました', { error, options });
      throw error;
    }
  }

  // 特定エンティティに関連するイベントの取得
  async getEventsByEntityId(
    entityType: string,
    entityId: string,
    options: {
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DomainEvent[]> {
    try {
      const limit = options.limit || 100;
      const offset = options.offset || 0;

      // JSONフィールド内の特定プロパティを検索するクエリ
      const result = await db.execute(sql.raw(`
        SELECT *
        FROM domain_events
        WHERE payload::jsonb @> '{"${entityType}Id": "${entityId}"}'
        ORDER BY occurred_at ASC
        LIMIT ${limit} OFFSET ${offset}
      `));

      // 結果の変換
      return result.rows.map(row => ({
        type: row.type,
        payload: JSON.parse(row.payload),
        metadata: JSON.parse(row.metadata),
        occurredAt: row.occurred_at
      }));
    } catch (error) {
      logger.error('エンティティIDによるイベント取得中にエラーが発生しました', {
        error,
        entityType,
        entityId
      });
      throw error;
    }
  }
}
```

## 認証・認可実装

Auth.jsを使用した認証・認可の実装例を示します。

### Auth.js構成

```typescript
// src/config/auth.ts

import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { db } from '@/infrastructure/database/db';
import { users } from '@/infrastructure/database/schema/users';
import { eq } from 'drizzle-orm';
import { UserService } from '@/domain/services/user.service';
import { container } from '@/infrastructure/ioc/container';
import { jwtHelpers } from '@/infrastructure/auth/jwt-helpers';
import { UserRole } from '@/domain/shared/enums/user-role.enum';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut
} = NextAuth({
  adapter: DrizzleAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 24 * 7, // 7日間
  },
  providers: [
    // 資格情報プロバイダー
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'メールアドレス', type: 'email' },
        password: { label: 'パスワード', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const userService = container.resolve(UserService);
          const result = await userService.authenticateUser(
            credentials.email,
            credentials.password
          );

          if (result.isFailure) {
            return null;
          }

          return result.getValue();
        } catch (error) {
          console.error('認証エラー:', error);
          return null;
        }
      }
    }),
    // Googleプロバイダー
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    // GitHubプロバイダー
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    })
  ],
  callbacks: {
    // JWTコールバック
    async jwt({ token, user }) {
      if (user) {
        // 初回サインイン時にユーザー情報をトークンに追加
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.roles = user.roles || [UserRole.USER];
      }

      // トークンの更新（最新ユーザー情報の反映）
      const userRecord = await db.query.users.findFirst({
        where: eq(users.email, token.email!)
      });

      if (userRecord) {
        token.roles = userRecord.roles as UserRole[];
      }

      return token;
    },
    // セッションコールバック
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as UserRole[];
      }
      return session;
    }
  },
  events: {
    async signIn({ user }) {
      // ログイン時の処理（最終ログイン日時の更新など）
      if (user.id) {
        await db
          .update(users)
          .set({ lastLoginAt: new Date() })
          .where(eq(users.id, user.id));
      }
    }
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify',
    newUser: '/auth/welcome'
  }
});
```

### 認証ミドルウェア

```typescript
// src/shared/middleware/auth.middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { UserRole } from '@/domain/shared/enums/user-role.enum';
import { ApiResponse } from '../utils/api-response';

// 認証ミドルウェアを生成する関数
export function withAuth(requiredRoles?: UserRole[]) {
  return function(handler: (req: NextRequest, params: any) => Promise<NextResponse>) {
    return async function(req: NextRequest, params: any): Promise<NextResponse> {
      // Auth.jsのセッション取得
      const session = await auth();
      
      // 未認証チェック
      if (!session || !session.user) {
        return ApiResponse.unauthorized();
      }

      // 必要な権限が指定されている場合、権限チェック
      if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = session.user.roles || [UserRole.USER];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        
        if (!hasRequiredRole) {
          return ApiResponse.forbidden();
        }
      }

      // 認証が成功したら、オリジナルのハンドラを実行
      return handler(req, params);
    };
  };
}
```

### リソース認可ミドルウェア

```typescript
// src/shared/middleware/resource-auth.middleware.ts

import { NextRequest } from 'next/server';
import { auth } from '@/config/auth';
import { UserRole } from '@/domain/shared/enums/user-role.enum';

type AuthUser = {
  id: string;
  roles: UserRole[];
  hasRole: (role: UserRole) => boolean;
};

type ResourceAuthFunction = (authUser: AuthUser) => Promise<boolean>;

// リソースベースの認可ミドルウェアを生成する関数
export function withResourceAuth(authFunction: ResourceAuthFunction) {
  return async function(req: NextRequest): Promise<boolean> {
    // Auth.jsのセッション取得
    const session = await auth();
    
    if (!session || !session.user) {
      return false;
    }

    const userRoles = session.user.roles || [UserRole.USER];
    
    // 認証済みユーザー情報の作成
    const authUser: AuthUser = {
      id: session.user.id,
      roles: userRoles,
      hasRole: (role: UserRole) => userRoles.includes(role)
    };

    // 認可チェック関数の実行
    return authFunction(authUser);
  };
}
```

### パスワードハッシュ

```typescript
// src/infrastructure/auth/password-helpers.ts

import { hash, compare } from 'bcrypt';

export const passwordHelpers = {
  // パスワードのハッシュ化
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return hash(password, saltRounds);
  },
  
  // パスワードの検証
  async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return compare(plainPassword, hashedPassword);
  },
  
  // パスワード強度の検証
  validatePasswordStrength(password: string): { isValid: boolean, message?: string } {
    // 最低8文字
    if (password.length < 8) {
      return { isValid: false, message: 'パスワードは8文字以上である必要があります' };
    }
    
    // 大文字を含む
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'パスワードには大文字を含める必要があります' };
    }
    
    // 小文字を含む
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'パスワードには小文字を含める必要があります' };
    }
    
    // 数字を含む
    if (!/\d/.test(password)) {
      return { isValid: false, message: 'パスワードには数字を含める必要があります' };
    }
    
    // 特殊文字を含む
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'パスワードには特殊文字を含める必要があります' };
    }
    
    return { isValid: true };
  }
};
```

### JWTヘルパー

```typescript
// src/infrastructure/auth/jwt-helpers.ts

import jwt from 'jsonwebtoken';
import { UserRole } from '@/domain/shared/enums/user-role.enum';

// トークンペイロードの型定義
interface TokenPayload {
  sub: string;  // ユーザーID
  email: string;
  roles: UserRole[];
  tenantId?: string;
  jti?: string;  // JWT ID
  iat?: number;  // 発行時刻
  exp?: number;  // 有効期限
}

export const jwtHelpers = {
  // アクセストークンの生成
  generateAccessToken(payload: Omit<TokenPayload, 'jti' | 'iat' | 'exp'>): string {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET環境変数が設定されていません');
    }
    
    // 15分の有効期限を持つアクセストークン
    return jwt.sign(
      {
        ...payload,
        jti: crypto.randomUUID()
      },
      jwtSecret,
      { expiresIn: '15m' }
    );
  },
  
  // リフレッシュトークンの生成
  generateRefreshToken(userId: string): string {
    const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_REFRESH_SECRET環境変数が設定されていません');
    }
    
    // 7日間の有効期限を持つリフレッシュトークン
    return jwt.sign(
      {
        sub: userId,
        jti: crypto.randomUUID()
      },
      jwtSecret,
      { expiresIn: '7d' }
    );
  },
  
  // トークンの検証
  verifyToken(token: string, isRefreshToken: boolean = false): TokenPayload {
    const jwtSecret = isRefreshToken
      ? (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)
      : process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET環境変数が設定されていません');
    }
    
    return jwt.verify(token, jwtSecret) as TokenPayload;
  },
  
  // トークンからペイロードを取得（検証なし）
  decodeToken(token: string): TokenPayload | null {
    return jwt.decode(token) as TokenPayload | null;
  }
};
```

## WebSocket実装

*[07_server_implementation.md - リアルタイムコミュニケーション](../07_server_implementation.md#リアルタイムコミュニケーション)の実装例*

この実装は、[01_requirements_definition.md - 非機能要件 - リアルタイム通信要件](../01_requirements_definition.md#非機能要件)で定義されているリアルタイム通信要件を満たすための実装例です。特に「メッセージングシステム」と「イベント駆動アーキテクチャ」を実現するための実装に焦点を当てています。

### WebSocketマネージャー

```typescript
// src/infrastructure/websocket/websocket-manager.ts

import { Server as HTTPServer } from 'http';
import { Server as WebSocketServer, Socket } from 'socket.io';
import { injectable } from 'tsyringe';
import { logger } from '../../config/logger';
import { verifyAccessToken } from '../../shared/utils/jwt-helpers';
import { UserSocketStore } from './user-socket-store';

/**
 * WebSocket接続とイベント発行を管理するマネージャークラス
 */
@injectable()
export class WebSocketManager {
  private io: WebSocketServer | null = null;
  private readonly userSocketStore: UserSocketStore;
  
  constructor() {
    this.userSocketStore = new UserSocketStore();
    logger.info('WebSocketManagerが初期化されました');
  }
  
  /**
   * WebSocketサーバーを初期化し、HTTPサーバーにアタッチする
   */
  initialize(httpServer: HTTPServer): void {
    if (this.io) {
      logger.warn('WebSocketマネージャーは既に初期化されています');
      return;
    }
    
    this.io = new WebSocketServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      path: '/api/ws'
    });
    
    // 認証ミドルウェア
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token as string;
        
        if (!token) {
          return next(new Error('認証トークンがありません'));
        }
        
        // JWTトークンを検証
        const decoded = await verifyAccessToken(token);
        
        if (!decoded) {
          return next(new Error('無効なトークンです'));
        }
        
        // ソケットにユーザー情報を設定
        socket.data.userId = decoded.sub;
        socket.data.userRole = decoded.role;
        
        return next();
      } catch (error) {
        logger.error('WebSocket認証エラー', { error });
        return next(new Error('認証に失敗しました'));
      }
    });
    
    // 接続イベントを処理
    this.io.on('connection', (socket: Socket) => this.handleConnection(socket));
    
    logger.info('WebSocketサーバーが初期化されました');
  }
  
  /**
   * ソケット接続を処理する
   */
  private handleConnection(socket: Socket): void {
    const userId = socket.data.userId as string;
    
    logger.info('新しいWebSocket接続が確立されました', { userId, socketId: socket.id });
    
    // ユーザーIDとソケットを関連付け
    this.userSocketStore.addUserSocket(userId, socket);
    
    // プロジェクトルームに参加
    socket.on('join:project', (projectId: string) => {
      logger.debug('ユーザーがプロジェクトルームに参加しました', { userId, projectId });
      socket.join(`project:${projectId}`);
    });
    
    // チャットルームに参加
    socket.on('join:chat', (chatId: string) => {
      logger.debug('ユーザーがチャットルームに参加しました', { userId, chatId });
      socket.join(`chat:${chatId}`);
    });
    
    // 切断イベントを処理
    socket.on('disconnect', () => {
      logger.info('WebSocket接続が切断されました', { userId, socketId: socket.id });
      this.userSocketStore.removeUserSocket(userId, socket.id);
    });
  }
  
  /**
   * 特定のユーザーにイベントを送信
   */
  emitToUser(userId: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.error('WebSocketマネージャーが初期化されていません');
      return;
    }
    
    const sockets = this.userSocketStore.getUserSockets(userId);
    
    if (sockets.length === 0) {
      logger.debug('ユーザーは接続していません', { userId, event });
      return;
    }
    
    logger.debug('ユーザーにイベントを送信します', { userId, event, socketCount: sockets.length });
    
    for (const socket of sockets) {
      socket.emit(event, data);
    }
  }
  
  /**
   * プロジェクトルームにイベントを送信
   */
  emitToProject(projectId: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.error('WebSocketマネージャーが初期化されていません');
      return;
    }
    
    logger.debug('プロジェクトルームにイベントを送信します', { projectId, event });
    this.io.to(`project:${projectId}`).emit(event, data);
  }
  
  /**
   * チャットルームにイベントを送信
   */
  emitToChat(chatId: string, event: string, data: unknown): void {
    if (!this.io) {
      logger.error('WebSocketマネージャーが初期化されていません');
      return;
    }
    
    logger.debug('チャットルームにイベントを送信します', { chatId, event });
    this.io.to(`chat:${chatId}`).emit(event, data);
  }
  
  /**
   * すべての接続クライアントにイベントを送信（管理者専用）
   */
  emitToAll(event: string, data: unknown): void {
    if (!this.io) {
      logger.error('WebSocketマネージャーが初期化されていません');
      return;
    }
    
    logger.debug('すべてのクライアントにイベントを送信します', { event });
    this.io.emit(event, data);
  }
}
```

### ユーザーソケットストア

```typescript
// src/infrastructure/websocket/user-socket-store.ts

import { Socket } from 'socket.io';
import { logger } from '../../config/logger';

/**
 * ユーザーIDとSocketインスタンスの関連付けを管理するストアクラス
 */
export class UserSocketStore {
  private readonly userSockets: Map<string, Map<string, Socket>> = new Map();
  
  /**
   * ユーザーとソケットを関連付ける
   */
  addUserSocket(userId: string, socket: Socket): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Map());
    }
    
    this.userSockets.get(userId)!.set(socket.id, socket);
    logger.debug('ユーザーソケットを追加しました', { userId, socketId: socket.id });
  }
  
  /**
   * ユーザーのソケットを削除する
   */
  removeUserSocket(userId: string, socketId: string): void {
    const userSocketMap = this.userSockets.get(userId);
    
    if (!userSocketMap) {
      return;
    }
    
    userSocketMap.delete(socketId);
    logger.debug('ユーザーソケットを削除しました', { userId, socketId });
    
    // ユーザーのソケットがすべて削除された場合はマップからユーザーを削除
    if (userSocketMap.size === 0) {
      this.userSockets.delete(userId);
      logger.debug('ユーザーのすべてのソケットが削除されました', { userId });
    }
  }
  
  /**
   * ユーザーの全ソケットを取得する
   */
  getUserSockets(userId: string): Socket[] {
    const userSocketMap = this.userSockets.get(userId);
    
    if (!userSocketMap) {
      return [];
    }
    
    return Array.from(userSocketMap.values());
  }
  
  /**
   * ユーザーのソケット数を取得する
   */
  getUserSocketCount(userId: string): number {
    const userSocketMap = this.userSockets.get(userId);
    
    if (!userSocketMap) {
      return 0;
    }
    
    return userSocketMap.size;
  }
  
  /**
   * すべての接続されているユーザーIDを取得する
   */
  getAllConnectedUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }
  
  /**
   * 接続されているすべてのソケットを取得する
   */
  getAllSockets(): Socket[] {
    const allSockets: Socket[] = [];
    
    for (const socketMap of this.userSockets.values()) {
      allSockets.push(...socketMap.values());
    }
    
    return allSockets;
  }
}
```

### WebSocketイベントの種類

```typescript
// src/infrastructure/websocket/websocket-events.ts

/**
 * WebSocketイベントの種類を定義する列挙型
 */
export enum WebSocketEvent {
  // プロジェクト関連
  PROJECT_CREATED = 'project:created',
  PROJECT_UPDATED = 'project:updated',
  PROJECT_DELETED = 'project:deleted',
  
  // タスク関連
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_DELETED = 'task:deleted',
  TASK_STATUS_CHANGED = 'task:statusChanged',
  TASK_ASSIGNED = 'task:assigned',
  
  // チャット関連
  CHAT_MESSAGE_RECEIVED = 'chat:messageReceived',
  CHAT_MESSAGE_UPDATED = 'chat:messageUpdated',
  CHAT_MESSAGE_DELETED = 'chat:messageDeleted',
  CHAT_TYPING = 'chat:typing',
  
  // AI関連
  AI_RESPONSE_STARTED = 'ai:responseStarted',
  AI_RESPONSE_CHUNK = 'ai:responseChunk',
  AI_RESPONSE_COMPLETED = 'ai:responseCompleted',
  AI_RESPONSE_ERROR = 'ai:responseError',
  
  // ユーザー関連
  USER_STATUS_CHANGED = 'user:statusChanged',
  USER_ACTIVITY = 'user:activity',
  
  // 通知関連
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
  
  // システム関連
  SYSTEM_ANNOUNCEMENT = 'system:announcement',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  SYSTEM_ERROR = 'system:error'
}
```

### AIレスポンスストリーミングサービス

```typescript
// src/infrastructure/ai/ai-response-streaming-service.ts

import { injectable } from 'tsyringe';
import { WebSocketManager } from '../websocket/websocket-manager';
import { WebSocketEvent } from '../websocket/websocket-events';
import { AIServiceError, AIServiceErrorType } from './ai-service-error';
import { logger } from '../../config/logger';
import { FallbackResponseGenerator } from './fallback-response-generator';
import { ConversationType } from '../../domain/enums/conversation-type.enum';

// src/shared/errors/validation-error.ts

import { ApplicationError } from './application-error';
import { ZodError } from 'zod';

/**
 * バリデーションエラー
 */
export class ValidationError extends ApplicationError {
  constructor(
    message: string,
    public readonly validationErrors: Record<string, string[]>,
```

## 多言語対応

*[07_server_implementation.md - 多言語対応](../07_server_implementation.md#多言語対応)の実装例*

この実装は、[01_requirements_definition.md - 非機能要件 - 多言語要件](../01_requirements_definition.md#非機能要件)で定義されている多言語要件を満たすための実装例です。特に「日本語と英語の完全サポート」と「動的言語切り替えと翻訳サービス」に焦点を当てています。

### 言語リソースの管理

```typescript
// src/infrastructure/localization/language-resource.ts

import { injectable } from 'tsyringe';
import { logger } from '../../config/logger';

/**
 * 言語リソース管理クラス
 */
@injectable()
export class LanguageResource {
  private readonly resources: Record<string, Record<string, string>> = {};

  constructor() {
    // 言語リソースの初期化
    this.initializeResources();
  }

  /**
   * 言語リソースの初期化
   */
  private initializeResources(): void {
    // ここに言語リソースの初期化処理を追加
    logger.info('言語リソースが初期化されました');
  }

  /**
   * 指定された言語のリソースを取得
   */
  getResource(language: string, key: string): string {
    const resource = this.resources[language];
    if (!resource) {
      logger.warn(`言語リソースが見つかりません: ${language}`);
      return key;
    }
    return resource[key] || key;
  }
}
```

### 言語切り替えミドルウェア

```typescript
// src/shared/middleware/language-middleware.ts

import { NextRequest, NextResponse } from 'next/server';
import { LanguageResource } from '../localization/language-resource';

// 言語切り替えミドルウェアを生成する関数
export function withLanguage(languageResource: LanguageResource) {
  return function(handler: (req: NextRequest, params: any) => Promise<NextResponse>) {
    return async function(req: NextRequest, params: any): Promise<NextResponse> {
      // リクエストヘッダーから言語を取得
      const language = req.headers['accept-language']?.split(',')[0] || 'en';
      
      // 言語リソースを使用してメッセージを取得
      req.languageResource = languageResource;
      
      // オリジナルのハンドラを実行
      return handler(req, params);
    };
  };
}
```

## マルチクラウド対応

*[07_server_implementation.md - クラウドサービス対応](../07_server_implementation.md#クラウドサービス対応)の実装例*

この実装は、[01_requirements_definition.md - 非機能要件 - クラウドサービス要件](../01_requirements_definition.md#非機能要件)で定義されているクラウドサービス要件を満たすための実装例です。特に「複数のクラウドAIプロバイダーのサポート」と「障害発生時の代替サービスへの切り替え」に焦点を当てています。

### クラウドプロバイダーの抽象化

```typescript
// src/infrastructure/cloud/cloud-provider.interface.ts

/**
 * クラウドプロバイダーインターフェース
 * 様々なクラウドサービスへの操作を抽象化
 */
export interface CloudProvider {
  /**
   * プロバイダー名
   */
  readonly name: string;
  
  /**
   * プロバイダーの利用可能状態
   */
  readonly isAvailable: boolean;
  
  /**
   * プロバイダーの健全性をチェック
   * @returns プロバイダーが正常に動作しているかどうか
   */
  checkHealth(): Promise<boolean>;
  
  /**
   * ファイルをストレージにアップロード
   * @param file アップロードするファイル
   * @param path 保存先のパス
   * @returns ファイルのURL
   */
  uploadFile(file: Buffer, path: string): Promise<string>;
  
  /**
   * ストレージからファイルをダウンロード
   * @param path ファイルのパス
   * @returns ファイルのバイナリデータ
   */
  downloadFile(path: string): Promise<Buffer>;
  
  /**
   * ファイルを削除
   * @param path 削除するファイルのパス
   */
  deleteFile(path: string): Promise<void>;
  
  /**
   * フォルダ内のすべてのファイル一覧を取得
   * @param folderPath フォルダのパス
   * @returns ファイルパスの配列
   */
  listFiles(folderPath: string): Promise<string[]>;
}
```

### AWS実装

```typescript
// src/infrastructure/cloud/aws-provider.ts

import { injectable } from 'tsyringe';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudProvider } from './cloud-provider.interface';
import { logger } from '../../config/logger';
import { withRetry } from '../../shared/utils/retry';

/**
 * AWSクラウドプロバイダー実装
 */
@injectable()
export class AWSProvider implements CloudProvider {
  readonly name = 'AWS';
  private _isAvailable = false;
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  
  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || '';
    
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    
    // 初期化時に健全性チェック
    this.checkHealth().catch(error => {
      logger.error('AWS プロバイダーの初期化中にエラーが発生しました', { error });
    });
  }
  
  get isAvailable(): boolean {
    return this._isAvailable;
  }
  
  /**
   * AWSサービスの健全性をチェック
   */
  async checkHealth(): Promise<boolean> {
    try {
      // S3バケットにテスト接続して健全性を確認
      await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1
        })
      );
      
      this._isAvailable = true;
      logger.info('AWS プロバイダーの健全性チェックに成功しました');
      return true;
    } catch (error) {
      this._isAvailable = false;
      logger.error('AWS プロバイダーの健全性チェックに失敗しました', { error });
      return false;
    }
  }
  
  /**
   * ファイルをS3にアップロード
   */
  async uploadFile(file: Buffer, path: string): Promise<string> {
    try {
      return await withRetry(async () => {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: path,
            Body: file,
            ContentType: this.getContentType(path)
          })
        );
        
        const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${path}`;
        logger.debug('ファイルをS3にアップロードしました', { path, fileUrl });
        
        return fileUrl;
      });
    } catch (error) {
      logger.error('S3へのファイルアップロード中にエラーが発生しました', { error, path });
      throw error;
    }
  }
  
  /**
   * S3からファイルをダウンロード
   */
  async downloadFile(path: string): Promise<Buffer> {
    try {
      return await withRetry(async () => {
        const response = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: path
          })
        );
        
        // レスポンスボディをBufferに変換
        const responseArrayBuffer = await response.Body?.transformToByteArray();
        
        if (!responseArrayBuffer) {
          throw new Error('ファイルの内容を取得できませんでした');
        }
        
        const fileBuffer = Buffer.from(responseArrayBuffer);
        logger.debug('ファイルをS3からダウンロードしました', { path, fileSize: fileBuffer.length });
        
        return fileBuffer;
      });
    } catch (error) {
      logger.error('S3からのファイルダウンロード中にエラーが発生しました', { error, path });
      throw error;
    }
  }
  
  /**
   * S3からファイルを削除
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await withRetry(async () => {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: path
          })
        );
        
        logger.debug('ファイルをS3から削除しました', { path });
      });
    } catch (error) {
      logger.error('S3からのファイル削除中にエラーが発生しました', { error, path });
      throw error;
    }
  }
  
  /**
   * S3フォルダ内のすべてのファイル一覧を取得
   */
  async listFiles(folderPath: string): Promise<string[]> {
    try {
      return await withRetry(async () => {
        const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
        
        const response = await this.s3Client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: normalizedFolderPath
          })
        );
        
        const files = response.Contents?.map(item => item.Key || '') || [];
        logger.debug('S3からファイル一覧を取得しました', {
          folderPath,
          fileCount: files.length
        });
        
        return files;
      });
    } catch (error) {
      logger.error('S3からのファイル一覧取得中にエラーが発生しました', { error, folderPath });
      throw error;
    }
  }
  
  /**
   * ファイル拡張子に基づいてContent-Typeを取得
   */
  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    
    return contentTypes[extension] || 'application/octet-stream';
  }
}
```

### Google Cloud実装

```typescript
// src/infrastructure/cloud/gcp-provider.ts

import { injectable } from 'tsyringe';
import { Storage } from '@google-cloud/storage';
import { CloudProvider } from './cloud-provider.interface';
import { logger } from '../../config/logger';
import { withRetry } from '../../shared/utils/retry';

/**
 * Google Cloudプロバイダー実装
 */
@injectable()
export class GCPProvider implements CloudProvider {
  readonly name = 'GCP';
  private _isAvailable = false;
  private readonly storage: Storage;
  private readonly bucketName: string;
  
  constructor() {
    this.bucketName = process.env.GCP_STORAGE_BUCKET_NAME || '';
    
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEY_FILE_PATH || undefined,
      credentials: process.env.GCP_CREDENTIALS
        ? JSON.parse(process.env.GCP_CREDENTIALS)
        : undefined
    });
    
    // 初期化時に健全性チェック
    this.checkHealth().catch(error => {
      logger.error('GCP プロバイダーの初期化中にエラーが発生しました', { error });
    });
  }
  
  get isAvailable(): boolean {
    return this._isAvailable;
  }
  
  /**
   * GCPサービスの健全性をチェック
   */
  async checkHealth(): Promise<boolean> {
    try {
      // バケットの存在を確認
      const [exists] = await this.storage.bucket(this.bucketName).exists();
      
      if (!exists) {
        logger.error('GCP Storageバケットが存在しません', { bucketName: this.bucketName });
        this._isAvailable = false;
        return false;
      }
      
      this._isAvailable = true;
      logger.info('GCP プロバイダーの健全性チェックに成功しました');
      return true;
    } catch (error) {
      this._isAvailable = false;
      logger.error('GCP プロバイダーの健全性チェックに失敗しました', { error });
      return false;
    }
  }
  
  /**
   * ファイルをGoogle Cloud Storageにアップロード
   */
  async uploadFile(file: Buffer, path: string): Promise<string> {
    try {
      return await withRetry(async () => {
        const bucket = this.storage.bucket(this.bucketName);
        const blob = bucket.file(path);
        
        await blob.save(file, {
          contentType: this.getContentType(path),
          public: true
        });
        
        const fileUrl = `https://storage.googleapis.com/${this.bucketName}/${path}`;
        logger.debug('ファイルをGCP Storageにアップロードしました', { path, fileUrl });
        
        return fileUrl;
      });
    } catch (error) {
      logger.error('GCP Storageへのファイルアップロード中にエラーが発生しました', { error, path });
      throw error;
    }
  }
  
  /**
   * Google Cloud Storageからファイルをダウンロード
   */
  async downloadFile(path: string): Promise<Buffer> {
    try {
      return await withRetry(async () => {
        const bucket = this.storage.bucket(this.bucketName);
        const blob = bucket.file(path);
        
        const [fileContent] = await blob.download();
        
        logger.debug('ファイルをGCP Storageからダウンロードしました', {
          path,
          fileSize: fileContent.length
        });
        
        return fileContent;
      });
    } catch (error) {
      logger.error('GCP Storageからのファイルダウンロード中にエラーが発生しました', { error, path });
      throw error;
    }
  }
  
  /**
   * Google Cloud Storageからファイルを削除
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await withRetry(async () => {
        const bucket = this.storage.bucket(this.bucketName);
        const blob = bucket.file(path);
        
        await blob.delete();
        
        logger.debug('ファイルをGCP Storageから削除しました', { path });
      });
    } catch (error) {
      logger.error('GCP Storageからのファイル削除中にエラーが発生しました', { error, path });
      throw error;
    }
  }
  
  /**
   * Google Cloud Storageフォルダ内のすべてのファイル一覧を取得
   */
  async listFiles(folderPath: string): Promise<string[]> {
    try {
      return await withRetry(async () => {
        const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
        
        const bucket = this.storage.bucket(this.bucketName);
        const [files] = await bucket.getFiles({
          prefix: normalizedFolderPath
        });
        
        const filePaths = files.map(file => file.name);
        
        logger.debug('GCP Storageからファイル一覧を取得しました', {
          folderPath,
          fileCount: filePaths.length
        });
        
        return filePaths;
      });
    } catch (error) {
      logger.error('GCP Storageからのファイル一覧取得中にエラーが発生しました', { error, folderPath });
      throw error;
    }
  }
  
  /**
   * ファイル拡張子に基づいてContent-Typeを取得
   */
  private getContentType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };
    
    return contentTypes[extension] || 'application/octet-stream';
  }
}
```

### クラウドプロバイダーファクトリー

```typescript
// src/infrastructure/cloud/cloud-provider-factory.ts

import { injectable } from 'tsyringe';
import { CloudProvider } from './cloud-provider.interface';
import { AWSProvider } from './aws-provider';
import { GCPProvider } from './gcp-provider';
import { logger } from '../../config/logger';

/**
 * クラウドプロバイダーの種類
 */
export enum CloudProviderType {
  AWS = 'aws',
  GCP = 'gcp'
}

/**
 * クラウドプロバイダーを作成するファクトリー
 */
@injectable()
export class CloudProviderFactory {
  private readonly providers: Map<CloudProviderType, CloudProvider> = new Map();
  
  constructor() {
    // 利用可能なプロバイダーを初期化
    this.initializeProviders();
  }
  
  /**
   * 指定したタイプのクラウドプロバイダーを取得
   */
  getProvider(type: CloudProviderType): CloudProvider {
    const provider = this.providers.get(type);
    
    if (!provider) {
      logger.error('指定されたクラウドプロバイダーが見つかりません', { type });
      throw new Error(`クラウドプロバイダー '${type}' は利用できません`);
    }
    
    return provider;
  }
  
  /**
   * 利用可能なプロバイダーを取得
   */
  getAvailableProviders(): CloudProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.isAvailable);
  }
  
  /**
   * 利用可能なプロバイダーのタイプを取得
   */
  getAvailableProviderTypes(): CloudProviderType[] {
    const availableTypes: CloudProviderType[] = [];
    
    for (const [type, provider] of this.providers.entries()) {
      if (provider.isAvailable) {
        availableTypes.push(type);
      }
    }
    
    return availableTypes;
  }
  
  /**
   * デフォルトのプロバイダーを取得
   * 優先順位: AWS > GCP
   */
  getDefaultProvider(): CloudProvider {
    const availableProviders = this.getAvailableProviders();
    
    if (availableProviders.length === 0) {
      logger.error('利用可能なクラウドプロバイダーがありません');
      throw new Error('利用可能なクラウドプロバイダーがありません');
    }
    
    // AWS が利用可能であれば優先的に使用
    const awsProvider = this.providers.get(CloudProviderType.AWS);
    if (awsProvider && awsProvider.isAvailable) {
      return awsProvider;
    }
    
    // それ以外は最初に利用可能なプロバイダーを返す
    return availableProviders[0];
  }
  
  /**
   * プロバイダーを初期化
   */
  private initializeProviders(): void {
    this.providers.set(CloudProviderType.AWS, new AWSProvider());
    this.providers.set(CloudProviderType.GCP, new GCPProvider());
    
    logger.info('クラウドプロバイダーを初期化しました', {
      providerCount: this.providers.size
    });
  }
}
```

### フォールバック対応ストレージサービス

```typescript
// src/infrastructure/storage/resilient-storage-service.ts

import { injectable } from 'tsyringe';
import { CloudProviderFactory, CloudProviderType } from '../cloud/cloud-provider-factory';
import { CloudProvider } from '../cloud/cloud-provider.interface';
import { logger } from '../../config/logger';

/**
 * 複数のクラウドプロバイダーを利用した耐障害性のあるストレージサービス
 */
@injectable()
export class ResilientStorageService {
  constructor(private readonly cloudProviderFactory: CloudProviderFactory) {}
  
  /**
   * ファイルをアップロード（フェイルオーバー対応）
   */
  async uploadFile(file: Buffer, path: string): Promise<string> {
    const primaryProvider = this.getPrimaryProvider();
    
    try {
      // プライマリプロバイダーでアップロード
      return await primaryProvider.uploadFile(file, path);
    } catch (error) {
      logger.error('プライマリプロバイダーでのファイルアップロードに失敗しました。バックアッププロバイダーを試行します', {
        error,
        primaryProvider: primaryProvider.name,
        path
      });
      
      // バックアッププロバイダーを取得
      const backupProvider = this.getBackupProvider(primaryProvider);
      
      if (!backupProvider) {
        logger.error('利用可能なバックアッププロバイダーがありません');
        throw error;
      }
      
      // バックアッププロバイダーでアップロード
      return await backupProvider.uploadFile(file, path);
    }
  }
  
  /**
   * ファイルをダウンロード（フェイルオーバー対応）
   */
  async downloadFile(path: string): Promise<Buffer> {
    const primaryProvider = this.getPrimaryProvider();
    
    try {
      // プライマリプロバイダーからダウンロード
      return await primaryProvider.downloadFile(path);
    } catch (error) {
      logger.error('プライマリプロバイダーからのファイルダウンロードに失敗しました。バックアッププロバイダーを試行します', {
        error,
        primaryProvider: primaryProvider.name,
        path
      });
      
      // バックアッププロバイダーを取得
      const backupProvider = this.getBackupProvider(primaryProvider);
      
      if (!backupProvider) {
        logger.error('利用可能なバックアッププロバイダーがありません');
        throw error;
      }
      
      // バックアッププロバイダーからダウンロード
      return await backupProvider.downloadFile(path);
    }
  }
  
  /**
   * ファイルを削除（すべてのプロバイダーから）
   */
  async deleteFile(path: string): Promise<void> {
    const providers = this.cloudProviderFactory.getAvailableProviders();
    const errors: Error[] = [];
    
    // すべてのプロバイダーから削除を試行
    for (const provider of providers) {
      try {
        await provider.deleteFile(path);
        logger.debug(`プロバイダー ${provider.name} からファイルを削除しました`, { path });
      } catch (error) {
        logger.error(`プロバイダー ${provider.name} からのファイル削除に失敗しました`, {
          error,
          path
        });
        errors.push(error as Error);
      }
    }
    
    // すべてのプロバイダーで失敗した場合はエラーをスロー
    if (errors.length === providers.length && providers.length > 0) {
      throw new Error('すべてのプロバイダーでファイル削除に失敗しました');
    }
  }
  
  /**
   * プライマリプロバイダーを取得
   */
  private getPrimaryProvider(): CloudProvider {
    // 環境変数で指定されたプライマリプロバイダーを使用
    const preferredProviderType = process.env.PRIMARY_CLOUD_PROVIDER as CloudProviderType;
    
    if (preferredProviderType) {
      try {
        const provider = this.cloudProviderFactory.getProvider(preferredProviderType);
        
        if (provider.isAvailable) {
          return provider;
        }
        
        logger.warn('指定されたプライマリクラウドプロバイダーは利用できません。デフォルトのプロバイダーを使用します', {
          preferredProviderType
        });
      } catch (error) {
        logger.warn('指定されたプライマリクラウドプロバイダーの取得に失敗しました。デフォルトのプロバイダーを使用します', {
          error,
          preferredProviderType
        });
      }
    }
    
    // デフォルトのプロバイダーを返す
    return this.cloudProviderFactory.getDefaultProvider();
  }
  
  /**
   * バックアッププロバイダーを取得
   */
  private getBackupProvider(primaryProvider: CloudProvider): CloudProvider | null {
    const availableProviders = this.cloudProviderFactory.getAvailableProviders();
    
    // プライマリ以外の利用可能なプロバイダーを探す
    for (const provider of availableProviders) {
      if (provider.name !== primaryProvider.name) {
        return provider;
      }
    }
    
    return null;
  }
}
```

## まとめ

本ドキュメントでは、サーバー実装の具体的なコード例を提供しました。これらの実装例は、[01_requirements_definition.md](../01_requirements_definition.md)で定義された要件を満たすことを目的としています。また、[04_implementation_rules.md](../04_implementation_rules.md)で定義された実装ルールと[05_component_design.md](../05_component_design.md)のコンポーネント設計に準拠しています。

実装例は以下の主要な領域をカバーしています：

1. **ドメイン駆動設計（DDD）に基づいた実装**
   - エンティティ、値オブジェクト、リポジトリ、ドメインサービスの実装
   - ドメインロジックのカプセル化と不変条件の維持

2. **クリーンアーキテクチャによるレイヤー分離**
   - ドメイン層、アプリケーション層、インフラストラクチャ層の明確な分離
   - 依存性の方向を内側に向けるための抽象化とDI

3. **CQRS（コマンド・クエリ責務分離）パターン**
   - コマンドとクエリの明確な分離によるスケーラビリティと保守性の向上
   - 読み取りモデルと書き込みモデルの分離

4. **堅牢なエラーハンドリング**
   - 構造化されたエラー階層と統一された例外処理
   - リトライロジックとフォールバックメカニズム

5. **リアルタイム通信（WebSocket）**
   - 双方向通信のための効率的なWebSocketの実装
   - イベント駆動型アーキテクチャによる非同期通知

6. **多言語対応**
   - 日本語と英語の完全サポート
   - 動的言語切り替えと翻訳サービス

7. **マルチクラウド対応**
   - 複数のクラウドプロバイダー（AWS、GCP）のサポート
   - 障害時の自動フェイルオーバー機能

これらの実装例は、実際の開発を開始する際の参考となるものです。実際のプロジェクトに適用する際には、具体的な要件や制約に合わせて調整してください。

### 注意点

- 本実装例はTypeScriptとNext.jsを使用していますが、他の言語やフレームワークでも同様の概念を適用できます。
- セキュリティ考慮事項（CSRF対策、XSS対策など）は実際の実装では更に強化する必要があります。
- パフォーマンス最適化はユースケースに応じて行ってください。
- 本実装例は教育目的であり、実際のプロダクション環境では追加のテストと検証が必要です。

### 次のステップ

- 単体テストと統合テストの実装
- CI/CDパイプラインの構築
- モニタリングとロギングの拡充
- パフォーマンスのベンチマークと最適化