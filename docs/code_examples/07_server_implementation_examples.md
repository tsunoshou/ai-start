# サーバー側実装コード例

最終更新日: 2025-04-03

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
// domain/models/user/user.entity.ts (ファイルパス例)

import { v4 as uuidv4 } from 'uuid';
// import { Email } from '../value-objects/email.value-object'; ->
import { Email } from '@/domain/models/user/value-objects/email.vo'; // VOパス修正
// import { DomainEvent } from '../events/domain-event.interface'; ->
import { DomainEvent } from '@/domain/events/domain-event.interface'; // イベントパス修正
// import { UserCreatedEvent } from '../events/user-created.event'; ->
import { UserCreatedEvent } from '@/domain/events/user/user-created.event'; // イベントパス修正
// import { UserUpdatedEvent } from '../events/user-updated.event'; ->
import { UserUpdatedEvent } from '@/domain/events/user/user-updated.event'; // イベントパス修正
// import { UserRole } from '../enums/user-role.enum'; ->
import { UserRole } from '@/domain/models/user/user-role.enum'; // Enumパス修正
// import { AuthProvider } from '../enums/auth-provider.enum'; ->
import { AuthProvider } from '@/domain/models/user/auth-provider.enum'; // Enumパス修正
import { AggregateRoot } from '@/domain/models/aggregate-root'; // AggregateRoot基底クラス (例)
import { Result, ok, err } from 'neverthrow';

// Userエンティティのプロパティインターフェース (例)
export interface UserProps {
  id: string;
  email: Email;
  displayName: string;
  hashedPassword?: string;
  roles: UserRole[];
  provider: AuthProvider;
  providerId?: string | null; // スキーマに合わせてnull許容に
  preferences: Record<string, any>; // JSONB型などに対応
  createdAt: Date;
  updatedAt: Date;
}

// Userエンティティクラス (AggregateRootを継承する例)
export class User extends AggregateRoot<UserProps> {
  // プライベートコンストラクタ - ファクトリメソッド経由での生成を強制
  private constructor(props: UserProps) {
    super(props);
  }

  // IDゲッター
  get id(): string {
    return this.props.id;
  }

  // Emailゲッター (VOインスタンスを返す)
  get email(): Email {
    return this.props.email;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get roles(): UserRole[] {
    // 不変性を保つためにコピーを返す
    return [...this.props.roles];
  }

  get createdAt(): Date {
    return new Date(this.props.createdAt);
  }

  get updatedAt(): Date {
    return new Date(this.props.updatedAt);
  }

  get hashedPassword(): string | undefined {
    return this.props.hashedPassword;
  }

  get provider(): AuthProvider {
      return this.props.provider;
  }

  get providerId(): string | null | undefined {
      return this.props.providerId;
  }

  get preferences(): Record<string, any> {
      // 不変性を保つためにディープコピーが望ましい場合も
      return JSON.parse(JSON.stringify(this.props.preferences));
  }


  // ファクトリメソッド - 新規ユーザー作成
  public static create(
    props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt' | 'roles' | 'provider' | 'preferences'> & {
        roles?: UserRole[];
        provider?: AuthProvider;
        preferences?: Record<string, any>;
    }
  ): Result<User, Error> { // Result型を返すように変更
    const id = uuidv4();
    const now = new Date();

    const userProps: UserProps = {
      id,
      email: props.email,
      displayName: props.displayName,
      hashedPassword: props.hashedPassword,
      roles: props.roles ?? [UserRole.USER], // デフォルトロール設定
      provider: props.provider ?? AuthProvider.EMAIL, // デフォルトプロバイダー
      providerId: props.providerId,
      preferences: props.preferences ?? {}, // デフォルト設定
      createdAt: now,
      updatedAt: now,
    };

    // ここで基本的なバリデーションを行うことも可能
    // 例: if (!props.displayName) return err(new Error('Display name is required'));

    const user = new User(userProps);

    // ドメインイベント発行
    user.addDomainEvent(new UserCreatedEvent({
      userId: id,
      email: props.email.value,
      name: props.displayName,
      roles: userProps.roles,
      provider: userProps.provider,
    }));

    return ok(user);
  }

  // ユーザーの再構築（リポジトリからのロード時など）
  // DBから取得したデータでエンティティを復元
  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  // --- ビジネスロジックメソッド ---

  public updateEmail(newEmail: Email): Result<void, Error> {
    if (this.props.email.equals(newEmail)) {
      return ok(undefined); // 変更なし
    }

    // EmailのバリデーションはVO側で行われている想定
    this.props.email = newEmail;
    this.props.updatedAt = new Date();

    // ドメインイベント発行
    this.addDomainEvent(new UserUpdatedEvent({
      userId: this.id,
      email: newEmail.value,
      updatedAt: this.props.updatedAt,
    }));
    return ok(undefined);
  }

  public updateDisplayName(newName: string): Result<void, Error> {
    if (newName.length === 0) {
        return err(new Error('Display name cannot be empty'));
    }
    if (this.props.displayName === newName) {
      return ok(undefined); // 変更なし
    }

    this.props.displayName = newName;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new UserUpdatedEvent({
      userId: this.id,
      name: newName,
      updatedAt: this.props.updatedAt,
    }));
    return ok(undefined);
  }

  public updatePassword(newPasswordHash: string): Result<void, Error> {
    if (!newPasswordHash) {
        return err(new Error('Password hash cannot be empty'));
    }
    this.props.hashedPassword = newPasswordHash;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new UserUpdatedEvent({
      userId: this.id,
      passwordChanged: true, // パスワード変更フラグ
      updatedAt: this.props.updatedAt,
    }));
    return ok(undefined);
  }

  public updateRoles(newRoles: UserRole[]): Result<void, Error> {
    // 必要に応じてロールのバリデーションを行う
    const validRoles = newRoles.filter(role => Object.values(UserRole).includes(role));
    if (validRoles.length === 0) {
        // 最低１つのロールが必要な場合など
        // return err(new Error('At least one valid role is required'));
        validRoles.push(UserRole.USER); // デフォルトロールを付与
    }

    this.props.roles = [...new Set(validRoles)]; // 重複を除去
    this.props.updatedAt = new Date();

    this.addDomainEvent(new UserUpdatedEvent({
      userId: this.id,
      roles: this.props.roles,
      updatedAt: this.props.updatedAt,
    }));
    return ok(undefined);
  }

   public updatePreferences(newPreferences: Record<string, any>): Result<void, Error> {
       // ここで設定内容のバリデーションを行うことも可能
       this.props.preferences = { ...this.props.preferences, ...newPreferences };
       this.props.updatedAt = new Date();

       this.addDomainEvent(new UserUpdatedEvent({
         userId: this.id,
         preferencesUpdated: true,
         updatedAt: this.props.updatedAt,
       }));
       return ok(undefined);
   }

  // パスワード検証 (ハッシュ比較は通常認証サービス側で行う)
  public verifyPassword(passwordHashToCompare: string): boolean {
    // このメソッドはドメインエンティティには不要な場合が多い
    // 必要であれば、パスワードサービスなどを利用する
    return this.props.hashedPassword === passwordHashToCompare;
  }

  // ロール確認
  public hasRole(role: UserRole): boolean {
    return this.props.roles.includes(role);
  }

}
```

### 値オブジェクトの実装例

(変更なし - [05_type_definitions_examples.md](./05_type_definitions_examples.md) 参照)

### リポジトリインターフェース

以下は`User`エンティティのためのリポジトリインターフェースの例です。永続化技術に依存しないインターフェースを定義します。

```typescript
// domain/repositories/user.repository.ts (ファイルパス例)

import { User } from '@/domain/models/user/user.entity';
import { Email } from '@/domain/models/user/value-objects/email.vo';
import { Result } from 'neverthrow';
import { DomainError, NotFoundError } from '@/shared/errors/domain.error'; // ドメインエラーパス修正

// リポジトリ操作で発生しうるエラー型 (例)
export type UserRepositoryError = NotFoundError | DomainError;

export interface UserRepository {
  /**
   * ユーザーIDでユーザーを検索する
   * @param id ユーザーID
   * @returns Result<User, NotFoundError>
   */
  findById(id: string): Promise<Result<User, NotFoundError>>;

  /**
   * メールアドレスでユーザーを検索する
   * @param email メールアドレス (Value Object)
   * @returns Result<User, NotFoundError>
   */
  findByEmail(email: Email): Promise<Result<User, NotFoundError>>;

  /**
   * 新しいユーザーを永続化する
   * @param user 保存するユーザーエンティティ
   * @returns Result<void, DomainError> - 成功時はvoid、失敗時はエラー
   */
  save(user: User): Promise<Result<void, DomainError>>;

  /**
   * 既存のユーザー情報を更新する
   * @param user 更新するユーザーエンティティ
   * @returns Result<void, UserRepositoryError>
   */
  update(user: User): Promise<Result<void, UserRepositoryError>>;

  /**
   * ユーザーを削除する
   * @param userId 削除するユーザーのID
   * @returns Result<void, UserRepositoryError>
   */
  delete(userId: string): Promise<Result<void, UserRepositoryError>>;

  // 必要に応じて他の検索メソッドを追加 (findByProviderId など)
  // findByProvider(provider: AuthProvider, providerId: string): Promise<Result<User, NotFoundError>>;
}
```

### ドメインサービスの実装

(変更なし - 必要に応じてパス修正)

## アプリケーション層の実装

*[07_server_implementation.md - アプリケーションサービス](../07_server_implementation.md#アプリケーションサービス)の実装例*\n
アプリケーション層は、ユースケースを実現するための処理フローを実装します。ドメイン層のオブジェクト（エンティティ、リポジトリ）を利用し、インフラストラクチャ層のサービス（メール送信など）を呼び出します。

### アプリケーションサービス

`UserService`はユーザー関連のユースケース（ユーザー作成、情報取得、更新）を担当します。

```typescript
// application/services/user.service.ts (ファイルパス例)

import { inject, injectable } from 'tsyringe'; // DIコンテナの例 (tsyringe)
import { UserRepository, UserRepositoryError } from '@/domain/repositories/user.repository';
import { User } from '@/domain/models/user/user.entity';
import { Email } from '@/domain/models/user/value-objects/email.vo';
import { UserRole } from '@/domain/models/user/user-role.enum';
import { CreateUserRequestDto } from '@/interfaces/http/rest/v1/dtos/user.dto'; // DTOパス修正
import { Result, ok, err } from 'neverthrow';
import { AppError } from '@/shared/errors/app.error'; // AppError基底クラス (例)
import { DomainError, NotFoundError, ConflictError } from '@/shared/errors/domain.error'; // ドメインエラーパス修正
import { PasswordService } from '@/application/services/password.service'; // パスワードサービス (例)
import { DomainEventDispatcher } from '@/domain/events/domain-event.dispatcher'; // イベントディスパッチャパス修正
import { logger } from '@/infrastructure/logger/logger'; // ロガーパス修正

// UserService が返す可能性のあるエラー型
type UserServiceError = UserRepositoryError | DomainError | AppError;

@injectable() // DIコンテナに登録可能にするデコレータ (例)
export class UserService {
  constructor(
    // DIコンテナから依存性を注入 (例)
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('PasswordService') private passwordService: PasswordService,
    @inject('DomainEventDispatcher') private eventDispatcher: DomainEventDispatcher
  ) {}

  /**
   * 新しいユーザーを作成するユースケース
   * @param dto ユーザー作成リクエストDTO
   * @returns Result<User, UserServiceError> 作成されたユーザーまたはエラー
   */
  async createUser(dto: CreateUserRequestDto): Promise<Result<User, UserServiceError>> {
    // 1. Email Value Object の作成
    const emailResult = Email.create(dto.email);
    if (emailResult.isErr()) {
      return err(new DomainError(`Invalid email format: ${emailResult.error.message}`));
    }
    const email = emailResult.value;

    // 2. メールアドレスの重複チェック
    const existingUserResult = await this.userRepository.findByEmail(email);
    if (existingUserResult.isOk()) {
      // 既に存在するユーザーがいる場合
      return err(new ConflictError(`User with email ${dto.email} already exists`));
    }
    // findByEmail で NotFoundError 以外のエラーが発生した場合も考慮
    if (existingUserResult.isErr() && !(existingUserResult.error instanceof NotFoundError)) {
        return err(existingUserResult.error); // DBエラーなどをそのまま返す
    }

    // 3. パスワードのハッシュ化
    const passwordHashResult = await this.passwordService.hashPassword(dto.password);
    if (passwordHashResult.isErr()) {
      // パスワードハッシュ化失敗
      logger.error('Password hashing failed during user creation', { error: passwordHashResult.error });
      return err(new AppError('Failed to process password')); // 詳細を隠蔽したエラーを返す
    }
    const hashedPassword = passwordHashResult.value;

    // 4. User エンティティの作成
    const userResult = User.create({
      email: email,
      displayName: dto.name,
      hashedPassword: hashedPassword,
      roles: dto.roles, // DTO に roles がなければ User.create 内でデフォルト設定
      // provider や preferences も必要に応じて DTO から設定
    });

    if (userResult.isErr()) {
        return err(new DomainError(`Failed to create user entity: ${userResult.error.message}`));
    }
    const user = userResult.value;

    // 5. リポジトリで永続化
    const saveResult = await this.userRepository.save(user);
    if (saveResult.isErr()) {
      // 永続化失敗
      return err(saveResult.error);
    }

    // 6. ドメインイベントの発行 (非同期で行う場合が多い)
    this.eventDispatcher.dispatch(user.domainEvents); // イベントディスパッチャに委譲

    logger.info('User created successfully', { userId: user.id, email: user.email.value });
    return ok(user);
  }

  /**
   * ユーザーIDでユーザー情報を取得するユースケース
   * @param userId 取得するユーザーのID
   * @returns Result<User, NotFoundError | DomainError> ユーザー情報またはエラー
   */
  async getUserById(userId: string): Promise<Result<User, NotFoundError | DomainError>> {
    if (!userId) {
        return err(new DomainError('User ID cannot be empty'));
    }
    // リポジトリからユーザーを取得
    const userResult = await this.userRepository.findById(userId);

    // findById は Result<User, NotFoundError> を返す想定
    if (userResult.isErr()) {
        // NotFoundError 以外は DomainError として扱うか、そのまま返す
        if (!(userResult.error instanceof NotFoundError)) {
            logger.error('Failed to get user by ID from repository', { userId, error: userResult.error });
            return err(new DomainError('Failed to retrieve user data'));
        }
        return err(userResult.error); // NotFoundError を返す
    }

    return ok(userResult.value);
  }

  // 他のユースケースメソッド (updateUser, deleteUser など) も同様に実装
  // 例: updateUser(userId: string, updateDto: UpdateUserDto): Promise<Result<User, UserServiceError>>;
}
```

### コマンド・クエリハンドラー (CQRS パターン)

(変更なし - 必要に応じてパス修正)

## インフラストラクチャ層の実装

*[07_server_implementation.md - 永続化](../07_server_implementation.md#永続化)の実装例*\n
インフラストラクチャ層は、データベースアクセス、外部サービス連携、ロギング、認証など、技術的な詳細を実装します。

### リポジトリ実装 (Drizzle ORM)

`UserRepository`インターフェースの Drizzle ORM を使用した実装例です。

```typescript
// infrastructure/database/drizzle/repositories/user.repository.ts (ファイルパス例)

import { drizzle } from 'drizzle-orm/node-postgres'; // 使用するDBアダプタに合わせて変更
import { eq } from 'drizzle-orm';
import { inject, injectable } from 'tsyringe';
import { Client } from 'pg'; // 使用するDBクライアント (例: pg)
import { UserRepository, UserRepositoryError } from '@/domain/repositories/user.repository';
import { User } from '@/domain/models/user/user.entity';
import { Email } from '@/domain/models/user/value-objects/email.vo';
import * as schema from '@/infrastructure/database/drizzle/schema'; // 生成されたスキーマをインポート
import { PersistenceUser } from '@/infrastructure/database/drizzle/schema'; // 型エイリアス (例)
import { persistenceUserToDomain, userDomainToPersistence } from '@/shared/utils/conversion/user.mapper'; // マッパーパス修正
import { Result, ok, err } from 'neverthrow';
import { DomainError, NotFoundError, InfrastructureError } from '@/shared/errors/domain.error'; // エラーパス修正 (InfrastructureErrorを追加)
import { logger } from '@/infrastructure/logger/logger'; // ロガーパス修正

// Drizzle DB クライアントの型定義 (例)
type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

@injectable()
export class DrizzleUserRepository implements UserRepository {
  private db: DrizzleDB;

  constructor(@inject('DatabaseClient') dbClient: Client) { // DIコンテナからDBクライアントを取得 (例)
    this.db = drizzle(dbClient, { schema }); // Drizzleインスタンスを初期化
  }

  /**
   * ユーザーIDでユーザーを検索する
   */
  async findById(id: string): Promise<Result<User, NotFoundError>> {
    try {
      // Drizzle で users テーブルから id が一致するレコードを検索
      const result: PersistenceUser[] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError(`User not found with id: ${id}`));
      }

      // 永続化モデルをドメインモデルに変換
      const userResult = persistenceUserToDomain(result[0]);
      if (userResult.isErr()) {
          // マッピングエラーはインフラエラーとして扱う
          logger.error('Failed to map persistence user to domain', { userId: id, error: userResult.error });
          // NotFound ではないので別のエラーを返すか？ここでは便宜上 NotFoundError を流用しない
          // ドメイン層のインターフェース定義を見直す必要があるかもしれない
          // return err(new InfrastructureError('Failed to process user data'));
          // とりあえず NotFoundError を返す (要検討)
          return err(new NotFoundError(`Failed to process user data for id: ${id}`));
      }

      return ok(userResult.value);

    } catch (error) {
      logger.error('Database error finding user by id', { userId: id, error });
      // DBエラーは NotFound ではない
      // return err(new InfrastructureError('Database query failed'));
      return err(new NotFoundError(`Database error for id: ${id}`)); // 便宜上 NotFoundError を返す (要検討)
    }
  }

  /**
   * メールアドレスでユーザーを検索する
   */
  async findByEmail(email: Email): Promise<Result<User, NotFoundError>> {
    const emailValue = email.value; // Email VOから値を取得
    try {
      const result: PersistenceUser[] = await this.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, emailValue))
        .limit(1);

      if (result.length === 0) {
        return err(new NotFoundError(`User not found with email: ${emailValue}`));
      }

      const userResult = persistenceUserToDomain(result[0]);
       if (userResult.isErr()) {
           logger.error('Failed to map persistence user to domain by email', { email: emailValue, error: userResult.error });
           return err(new NotFoundError(`Failed to process user data for email: ${emailValue}`)); // 便宜上 (要検討)
       }

      return ok(userResult.value);

    } catch (error) {
      logger.error('Database error finding user by email', { email: emailValue, error });
      return err(new NotFoundError(`Database error for email: ${emailValue}`)); // 便宜上 (要検討)
    }
  }

  /**
   * 新しいユーザーを永続化する
   */
  async save(user: User): Promise<Result<void, DomainError>> {
    try {
      // ドメインモデルを永続化データに変換
      const persistenceData = userDomainToPersistence(user);

      // Drizzle で users テーブルにデータを挿入
      await this.db.insert(schema.users).values({
          id: user.id, // ID も含めて挿入
          ...persistenceData,
          createdAt: new Date(), // createdAt, updatedAt はここで設定 or DB default
          updatedAt: new Date(),
      });

      logger.debug('User saved successfully', { userId: user.id });
      return ok(undefined);

    } catch (error: any) {
      logger.error('Database error saving user', { userId: user.id, error });
      // 重複キーエラーなどのハンドリングが必要な場合
      if (error.code === '23505') { // PostgreSQL の unique violation エラーコード (例)
          return err(new ConflictError(`User save conflict: ${error.detail || error.message}`));
      }
      return err(new InfrastructureError('Failed to save user to database'));
    }
  }

  /**
   * 既存のユーザー情報を更新する
   */
  async update(user: User): Promise<Result<void, UserRepositoryError>> {
      const userId = user.id;
      try {
          const persistenceData = userDomainToPersistence(user);

          // Drizzle で users テーブルのデータを更新
          const result = await this.db
              .update(schema.users)
              .set({
                  ...persistenceData,
                  updatedAt: new Date(), // updatedAt を更新
              })
              .where(eq(schema.users.id, userId))
              .returning({ updatedId: schema.users.id }); // 更新された行のIDを返す (例)

          // 更新された行がない場合 (IDが存在しないなど)
          if (result.length === 0) {
              logger.warn('Attempted to update non-existent user', { userId });
              return err(new NotFoundError(`User not found for update with id: ${userId}`));
          }

          logger.debug('User updated successfully', { userId });
          return ok(undefined);

      } catch (error: any) {
          logger.error('Database error updating user', { userId, error });
           if (error.code === '23505') { // 重複キーエラー (email変更時など)
               return err(new ConflictError(`User update conflict: ${error.detail || error.message}`));
           }
          return err(new InfrastructureError('Failed to update user in database'));
      }
  }

  /**
   * ユーザーを削除する
   */
  async delete(userId: string): Promise<Result<void, UserRepositoryError>> {
      try {
          const result = await this.db
              .delete(schema.users)
              .where(eq(schema.users.id, userId))
              .returning({ deletedId: schema.users.id });

          if (result.length === 0) {
              logger.warn('Attempted to delete non-existent user', { userId });
              return err(new NotFoundError(`User not found for deletion with id: ${userId}`));
          }

          logger.debug('User deleted successfully', { userId });
          return ok(undefined);

      } catch (error) {
          logger.error('Database error deleting user', { userId, error });
          return err(new InfrastructureError('Failed to delete user from database'));
      }
  }
}
```

### データベースマイグレーション (Drizzle Kit)

(変更なし - [07_server_implementation.md](../07_server_implementation.md#データベースマイグレーション) 参照)

### 外部サービス連携 (メール送信など)

(変更なし - 必要に応じてパス修正)

### ロギング実装

(変更なし - [06_utility_functions_examples.md](./06_utility_functions_examples.md) 参照)

## API Routes実装

*[07_server_implementation.md - APIエンドポイント実装](../07_server_implementation.md#apiエンドポイント実装)の実装例*\n
Next.js の API Routes を使用して、HTTPリクエストを処理し、アプリケーションサービスを呼び出す例です。

```typescript
// pages/api/v1/users/index.ts や app/api/v1/users/route.ts (ファイルパス例)

import { NextApiRequest, NextApiResponse } from 'next'; // Next.js 依存
// import { AppRouteHandlerFnContext, AppRouteHandler } from 'next/dist/server/future/route-modules/app-route/module'; // App Router の場合 (例)
import { handleApiRequest } from '@/interfaces/http/rest/v1/api-handler'; // APIハンドラパス修正
import { CreateUserRequestSchema } from '@/interfaces/http/rest/v1/dtos/user.dto'; // DTOスキーマパス修正
import { userDomainToResponseDto } from '@/interfaces/http/rest/v1/users/user.converter'; // コンバーターパス修正 (例)
import { validateRequestData } from '@/application/validation/request.validator'; // バリデータパス修正
import { UserService } from '@/application/services/user.service'; // アプリケーションサービスパス修正
import { container } from '@/infrastructure/di/container'; // DIコンテナ (例)
import { ApiError, ValidationError, ConflictError } from '@/shared/errors/api.error'; // エラーパス修正

// DIコンテナから UserService インスタンスを取得 (リクエストごとに解決する方が良い場合も)
// const userService = container.resolve(UserService);
// --- またはリクエストハンドラ内で解決 ---

// Next.js Pages Router 用ハンドラ
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // リクエストごとに DI コンテナからサービスを取得する場合
  const userService = container.resolve(UserService);

  await handleApiRequest(req, res, {
    // --- POST /api/v1/users ---
    POST: async () => {
      // 1. リクエストボディの検証
      const validationResult = validateRequestData(CreateUserRequestSchema, req.body);
      if (validationResult.isErr()) {
        // ValidationError は handleApiRequest が 400 を返す
        throw validationResult.error;
      }
      const createUserDto = validationResult.value;

      // 2. アプリケーションサービスの呼び出し
      const userResult = await userService.createUser(createUserDto);

      // 3. 結果の処理
      if (userResult.isErr()) {
        const error = userResult.error;
        // アプリケーション層のエラーを適切な HTTP エラーにマッピング
        if (error instanceof ConflictError) {
          throw new ApiError('ConflictError', 409, error.message, error.details);
        }
        // その他のドメイン/インフラエラーは 500 Internal Server Error に
        throw new ApiError('InternalServerError', 500, 'Failed to create user', { cause: error.message });
      }

      // 4. 成功レスポンス (201 Created を返す方が適切かも)
      //    ドメインモデルをレスポンスDTOに変換
      const userResponseDto = userDomainToResponseDto(userResult.value);
      // handleApiRequest はデフォルトで 200 OK を返す。
      // ステータスコードをカスタマイズしたい場合は res を直接操作するか、
      // handleApiRequest がタプル [status, body] を返せるように拡張する。
      // 例: res.status(201).json(userResponseDto); return; // handleApiRequest に処理させない
      return userResponseDto; // handleApiRequest が 200 で返す
    },

    // --- GET /api/v1/users ---
    GET: async () => {
      // ページネーションやフィルタリングのパラメータを取得 (req.query)
      // const page = parseInt(req.query.page as string || '1');
      // const limit = parseInt(req.query.limit as string || '10');
      // ... フィルタ条件 ...

      // UserService にユーザー一覧取得メソッドがある想定
      // const usersResult = await userService.findUsers({ page, limit, ...filters });
      // if (usersResult.isErr()) { ... エラー処理 ... }
      // const { users, pagination } = usersResult.value;
      // return {
      //    data: users.map(userDomainToResponseDto),
      //    pagination: paginationMetadataToDto(pagination)
      // };
      throw new ApiError('NotImplemented', 501, 'GET /users not implemented');
    },
    // 他のHTTPメソッド (GET /users/{id}, PUT /users/{id}, DELETE /users/{id}) は
    // pages/api/v1/users/[userId].ts など別のファイルで定義
  }, { requireAuth: ['GET'] }); // GET は認証が必要な例
}

// --- App Router 用ハンドラ (例) ---
/*
import { type NextRequest } from 'next/server';

export async function POST(request: NextRequest, context: AppRouteHandlerFnContext): Promise<Response> {
    const userService = container.resolve(UserService);
    try {
        const body = await request.json();
        const validationResult = validateRequestData(CreateUserRequestSchema, body);
        // ... (上記 POST ハンドラと同様のロジック) ...
        // App Router では Response オブジェクトを返す
        // return Response.json(userResponseDto, { status: 201 });
    } catch (error) {
        // handleApiRequest 相当のエラーハンドリング
        // const apiError = convertToApiError(error); // エラー変換ヘルパー
        // return Response.json(apiError.toJson(), { status: apiError.statusCode });
    }
}
*/
```

## CQRS実装

(変更なし - 必要に応じてパス修正)

## ドメインイベント実装

(変更なし - 必要に応じてパス修正、イベントディスパッチャの実装例を確認)

```typescript
// infrastructure/events/in-memory-event.dispatcher.ts (インメモリディスパッチャ例)

import { DomainEvent } from '@/domain/events/domain-event.interface';
import { DomainEventHandler } from '@/domain/events/domain-event.handler';
import { DomainEventDispatcher } from '@/domain/events/domain-event.dispatcher';
import { injectable } from 'tsyringe';
import { logger } from '@/infrastructure/logger/logger'; // ロガーパス修正

@injectable() // DI 可能にする
export class InMemoryEventDispatcher implements DomainEventDispatcher {
    // イベント名とハンドラのマップ
    private handlersMap: Map<string, DomainEventHandler<any>[]> = new Map();

    /**
     * イベントハンドラを登録する
     * @param eventName イベント名 (例: UserCreatedEvent.name)
     * @param handler イベントハンドラインスタンス
     */
    register<T extends DomainEvent>(eventName: string, handler: DomainEventHandler<T>): void {
        const handlers = this.handlersMap.get(eventName) || [];
        if (!handlers.includes(handler)) {
            handlers.push(handler);
            this.handlersMap.set(eventName, handlers);
            logger.debug(`Event handler registered`, { eventName, handlerName: handler.constructor.name });
        }
    }

    /**
     * ドメインイベントを発行し、登録されたハンドラを呼び出す
     * @param events 発行するドメインイベントの配列
     */
    dispatch(events: DomainEvent[]): void {
        for (const event of events) {
            const eventName = event.constructor.name;
            const handlers = this.handlersMap.get(eventName);

            if (handlers && handlers.length > 0) {
                logger.info(`Dispatching event`, { eventName, handlerCount: handlers.length });
                for (const handler of handlers) {
                    try {
                        // 非同期でハンドラを実行 (エラーを捕捉)
                        Promise.resolve(handler.handle(event)).catch(error => {
                            logger.error(`Error in event handler`, {
                                eventName,
                                handlerName: handler.constructor.name,
                                error
                            });
                        });
                    } catch (error) {
                         logger.error(`Synchronous error in event handler registration/dispatch logic`, {
                             eventName,
                             handlerName: handler.constructor.name,
                             error
                         });
                    }
                }
            } else {
                logger.debug(`No handlers registered for event`, { eventName });
            }
        }
    }
}

// --- イベントハンドラの例 ---
// application/event-handlers/send-welcome-email.handler.ts (ファイルパス例)
/*
import { DomainEventHandler } from '@/domain/events/domain-event.handler';
import { UserCreatedEvent } from '@/domain/events/user/user-created.event';
import { EmailService } from '@/infrastructure/email/email.service'; // Emailサービス (例)
import { injectable, inject } from 'tsyringe';
import { logger } from '@/infrastructure/logger/logger';

@injectable()
export class SendWelcomeEmailHandler implements DomainEventHandler<UserCreatedEvent> {
    constructor(@inject('EmailService') private emailService: EmailService) {}

    async handle(event: UserCreatedEvent): Promise<void> {
        logger.info(`Handling UserCreatedEvent for ${event.payload.email}`);
        try {
            await this.emailService.sendEmail({
                to: event.payload.email,
                subject: 'AiStartへようこそ！',
                body: `こんにちは ${event.payload.name}さん、AiStartへの登録ありがとうございます！`,
            });
            logger.info(`Welcome email sent successfully`, { userId: event.payload.userId });
        } catch (error) {
            logger.error(`Failed to send welcome email`, { userId: event.payload.userId, error });
            // ここでリトライ処理やエラー通知を行うことも可能
        }
    }
}
*/

// DIコンテナでの登録 (例: infrastructure/di/container.ts)
/*
import { container } from 'tsyringe';
import { InMemoryEventDispatcher } from '@/infrastructure/events/in-memory-event.dispatcher';
import { SendWelcomeEmailHandler } from '@/application/event-handlers/send-welcome-email.handler';
import { UserCreatedEvent } from '@/domain/events/user/user-created.event';

// ディスパッチャをシングルトンとして登録
container.registerSingleton('DomainEventDispatcher', InMemoryEventDispatcher);

// ハンドラを登録
const dispatcher = container.resolve<InMemoryEventDispatcher>('DomainEventDispatcher');
const welcomeEmailHandler = container.resolve(SendWelcomeEmailHandler);
dispatcher.register(UserCreatedEvent.name, welcomeEmailHandler);

// 他のハンドラも同様に登録...
*/
```

## 認証・認可実装

(変更なし - [06_utility_functions_examples.md](./06_utility_functions_examples.md) のトークン関連ユーティリティと、`handleApiRequest` 内の認証チェック例を参照)

## エラーハンドリング

(変更なし - [06_utility_functions_examples.md](./06_utility_functions_examples.md) のエラー型定義と `handleApiRequest` のエラー処理例を参照)

## WebSocket実装

(変更なし - 必要に応じてパス修正、具体的な実装はプロジェクト要件による)

## 多言語対応

(変更なし - 実装は i18next などのライブラリ利用を想定)

## マルチクラウド対応

(変更なし - 実装は抽象化レイヤーや環境変数による設定切り替えを想定)