# 3. ベースドメイン実装指示書

## 🎯 目的

この文書は、Core SaaS Frameworkの基盤となる共通ドメインの実装ガイドラインを提供します。全てのドメインで共通して使用される設計パターン、クラス、インターフェース、および命名規則を定義します。

## 📦 共通パッケージ構造

### @core/shared パッケージ

```
@core/shared/
├── src/
│   ├── base/              # 基本クラス・インターフェース
│   │   ├── entity.ts      # Entity基底クラス
│   │   ├── value-object.ts # ValueObject基底クラス
│   │   ├── aggregate-root.ts # AggregateRoot基底クラス
│   │   ├── repository.ts  # Repository基底インターフェース
│   │   ├── service.ts     # DomainService基底クラス
│   │   └── use-case.ts    # UseCase基底クラス
│   │
│   ├── errors/            # エラー定義
│   │   ├── application-error.ts # アプリケーションエラー基底クラス
│   │   ├── domain-error.ts # ドメインエラー基底クラス
│   │   ├── infrastructure-error.ts # インフラエラー基底クラス
│   │   └── index.ts       # エラーのエクスポート
│   │
│   ├── result/            # 結果型
│   │   ├── result.ts      # 成功/失敗を表現する Result<T, E> 型
│   │   ├── async-result.ts # 非同期結果を表現する AsyncResult<T, E> 型
│   │   └── index.ts       # Resultのエクスポート
│   │
│   ├── types/             # 共通型定義
│   │   ├── common.ts      # 共通型
│   │   ├── id.ts          # ID関連型
│   │   └── index.ts       # 型のエクスポート
│   │
│   ├── utils/             # ユーティリティ関数
│   │   ├── validation.ts  # バリデーション
│   │   ├── string.ts      # 文字列操作
│   │   ├── date.ts        # 日付操作
│   │   └── index.ts       # ユーティリティのエクスポート
│   │
│   └── value-objects/     # 共通値オブジェクト
│       ├── email.ts       # メールアドレス
│       ├── phone-number.ts # 電話番号
│       ├── password.ts    # パスワード
│       └── index.ts       # 値オブジェクトのエクスポート
│
├── package.json
├── tsconfig.json
└── README.md
```

### @core/infrastructure パッケージ

```
@core/infrastructure/
├── src/
│   ├── database/          # データベース
│   │   ├── client.ts      # DBクライアント (Drizzle)
│   │   ├── transaction.ts # トランザクション管理
│   │   └── index.ts       # DBエクスポート
│   │
│   ├── auth/              # 認証基盤
│   │   ├── jwt.ts         # JWT操作
│   │   ├── password.ts    # パスワードハッシュ
│   │   └── index.ts       # 認証エクスポート
│   │
│   ├── storage/           # ストレージ
│   │   ├── file-storage.ts # ファイルストレージ
│   │   └── index.ts       # ストレージエクスポート
│   │
│   ├── logger/            # ロギング
│   │   ├── logger.ts      # ロガー
│   │   └── index.ts       # ロガーエクスポート
│   │
│   └── http/              # HTTP/API連携
│       ├── client.ts      # HTTP/APIクライアント
│       └── index.ts       # HTTPエクスポート
│
├── package.json
├── tsconfig.json
└── README.md
```

## 🧠 ドメインパッケージの詳細構造

各ドメインパッケージは以下の構造を持ちます：

```
packages/[domain-name]/
├── domain/                  # ドメイン層
│   ├── entities/            # エンティティ
│   │   ├── __tests__/       # エンティティのテスト
│   │   │   └── user.entity.unit.test.ts
│   │   └── user.entity.ts
│   │
│   ├── value-objects/       # 値オブジェクト
│   │   ├── __tests__/       # 値オブジェクトのテスト
│   │   │   └── email.value-object.unit.test.ts
│   │   ├── user-id.value-object.ts
│   │   └── email.value-object.ts
│   │
│   ├── enums/               # 列挙型定義
│   │   ├── __tests__/       # 列挙型のテスト
│   │   │   └── user-status.enum.unit.test.ts
│   │   └── user-status.enum.ts
│   │
│   ├── repositories/        # リポジトリインターフェース
│   │   └── user-repository.interface.ts
│   │
│   └── services/            # ドメインサービス
│       ├── __tests__/       # ドメインサービスのテスト
│       │   └── authentication-service.unit.test.ts
│       └── authentication-service.ts
│
├── application/             # アプリケーション層
│   ├── use-cases/           # ユースケース
│   │   ├── __tests__/       # ユースケースのテスト
│   │   │   ├── create-user.use-case.unit.test.ts
│   │   │   └── create-user.use-case.integration.test.ts
│   │   ├── create-user.use-case.ts
│   │   └── authenticate-user.use-case.ts
│   │
│   └── dtos/                # データ転送オブジェクト
│       ├── user-dto.ts
│       └── authentication-dto.ts
│
├── infrastructure/          # インフラストラクチャ層
│   ├── repositories/        # リポジトリ実装
│   │   ├── __tests__/       # リポジトリ実装のテスト
│   │   │   └── user.repository.integration.test.ts
│   │   └── user.repository.ts  # Drizzleを使用した実装
│   │
│   └── mappers/             # マッパー
│       ├── __tests__/       # マッパーのテスト
│       │   └── user-mapper.unit.test.ts
│       └── user-mapper.ts
│
└── presentation/            # プレゼンテーション層
    ├── api/                 # API
    │   ├── __tests__/       # APIのテスト
    │   │   └── user.controller.integration.test.ts
    │   └── user.controller.ts
    │
    ├── hooks/               # React Hooks
    │   ├── __tests__/       # Hooksのテスト
    │   │   └── use-auth.unit.test.ts
    │   └── use-auth.ts
    │
    └── e2e/                 # E2Eテスト
        └── __tests__/
            └── user-registration.e2e.test.ts
```

## 🧩 基本構成要素の実装

### Entity 基底クラス

Entityはドメインの主要オブジェクトで、一意のIDを持ち、そのライフサイクルを通じて同一性が保たれます。

```typescript
// @core/shared/src/base/entity.ts
import { Result } from '../result';

export abstract class Entity<T> {
  protected readonly _id: T;
  protected props: Record<string, any>;

  constructor(id: T, props: Record<string, any>) {
    this._id = id;
    this.props = props;
  }

  get id(): T {
    return this._id;
  }

  public equals(entity?: Entity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }
    
    if (this === entity) {
      return true;
    }
    
    return this._id === entity._id;
  }
}
```

### Value Object 基底クラス

ValueObjectは属性の集合で、同一性ではなく値で比較されます。不変で副作用がないことが特徴です。

```typescript
// @core/shared/src/base/value-object.ts
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }
    
    if (vo.props === undefined) {
      return false;
    }
    
    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }
  
  public getProps(): T {
    return this.props;
  }
}
```

### Aggregate Root

AggregateRootはEntityの特別な形で、集約の一貫性境界を定義します。

```typescript
// @core/shared/src/base/aggregate-root.ts
import { Entity } from './entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
```

### Repository インターフェース

Repositoryはデータの永続化と取得のための抽象化レイヤーを提供します。

```typescript
// @core/shared/src/base/repository.ts
import { AggregateRoot } from './aggregate-root';
import { Result } from '../result';

export interface Repository<T extends AggregateRoot<any>> {
  save(aggregateRoot: T): Promise<Result<void, Error>>;
  findById(id: any): Promise<Result<T | null, Error>>;
}
```

### Result 型

操作の成功/失敗を表現するResult型を実装します。

```typescript
// @core/shared/src/result/result.ts
export class Result<T, E extends Error> {
  private readonly _value?: T;
  private readonly _error?: E;
  private readonly _isSuccess: boolean;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  public static ok<T, E extends Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  public static fail<T, E extends Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (!this._isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value!;
  }

  public getError(): E {
    if (this._isSuccess) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error!;
  }

  public static combine<T, E extends Error>(
    results: Result<T, E>[]
  ): Result<T[], E> {
    const values: T[] = [];
    
    for (const result of results) {
      if (result.isFailure()) {
        return Result.fail(result.getError());
      }
      values.push(result.getValue());
    }
    
    return Result.ok(values);
  }
}
```

### 基本エラークラス

エラー階層を定義します。

```typescript
// @core/shared/src/errors/application-error.ts
export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// @core/shared/src/errors/domain-error.ts
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// @core/shared/src/errors/infrastructure-error.ts
export abstract class InfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
```

## 📏 命名規則と設計パターン

### クラス命名規則

| 構成要素 | 命名パターン | 例 |
|---------|-------------|-----|
| Entity | 名詞 | `User`, `Product` |
| Value Object | 名詞 + 必要に応じて修飾語 | `Email`, `PhoneNumber` |
| Enum | 名詞 + `Enum` | `UserStatusEnum`, `RoleEnum` |
| Aggregate Root | 名詞 (基本的にEntityと同様) | `User`, `Order` |
| Repository Interface | エンティティ名 + `Repository` + `Interface` | `UserRepositoryInterface` |
| Repository Implementation | エンティティ名 + `Repository` | `UserRepository` |
| Use Case | 動詞 + 名詞 + `UseCase` | `CreateUserUseCase`, `UpdateProductUseCase` |
| DTO | 目的 + `Dto` | `UserResponseDto`, `CreateProductRequestDto` |
| Factory | エンティティ名 + `Factory` | `UserFactory`, `OrderFactory` |
| Domain Service | 目的 + `Service` | `AuthenticationService`, `PaymentService` |

### ファイル命名規則

* キャメルケースではなくケバブケースを使用
* パスカルケースのクラス名はケバブケースに変換
* 役割を示すサフィックスを追加

```
user.entity.ts
email.value-object.ts
user-status.enum.ts
user-repository.interface.ts
user.repository.ts  # 実装クラス
create-user.use-case.ts
user-response.dto.ts
```

### テストファイル命名規則

* 元のファイル名に、テストタイプを示すサフィックスを追加
* 単体テスト: `.unit.test.ts`
* 統合テスト: `.integration.test.ts`
* E2Eテスト: `.e2e.test.ts`

```
user.entity.unit.test.ts
user.repository.integration.test.ts
create-user.use-case.unit.test.ts
create-user.use-case.integration.test.ts
user-registration.e2e.test.ts
```

## 🧪 テスト戦略

### テスト方針

各レイヤーとコンポーネントに対する推奨テスト方法：

| レイヤー | コンポーネント | テスト種類 | モック対象 | 検証内容 |
|---------|--------------|-----------|-----------|---------|
| ドメイン | エンティティ | 単体 | なし | ビジネスルール、不変条件 |
| ドメイン | 値オブジェクト | 単体 | なし | バリデーション、等価性 |
| ドメイン | 列挙型 | 単体 | なし | 値の範囲、メソッド |
| ドメイン | ドメインサービス | 単体 | 依存オブジェクト | ビジネスロジック |
| アプリケーション | ユースケース | 単体 | リポジトリ、サービス | フロー、エラーハンドリング |
| アプリケーション | ユースケース | 統合 | 外部サービスのみ | リポジトリとの連携 |
| インフラ | リポジトリ | 統合 | なし(テストDB使用) | DB操作の正確性 |
| インフラ | マッパー | 単体 | なし | 変換ロジック |
| プレゼンテーション | コントローラ | 統合 | 外部APIのみ | API機能、レスポンス |
| プレゼンテーション | フック | 単体 | API呼び出し | 状態管理、UI連携 |
| エンドツーエンド | ユーザーフロー | E2E | なし(実環境) | 全体機能、統合 |

### テスト実装例 - ドメインエンティティ

```typescript
// @core/user/domain/entities/__tests__/user.entity.unit.test.ts
import { User } from '../user.entity';
import { Email } from '../../value-objects/email.value-object';
import { UserStatusEnum } from '../../enums/user-status.enum';
import { UniqueEntityID } from '@core/shared/types';

describe('User Entity', () => {
  it('should create a valid user', () => {
    // 準備
    const emailResult = Email.create('test@example.com');
    expect(emailResult.isSuccess()).toBeTruthy();
    
    // 実行
    const userResult = User.create({
      email: emailResult.getValue(),
      name: 'Test User',
      status: UserStatusEnum.ACTIVE
    });
    
    // 検証
    expect(userResult.isSuccess()).toBeTruthy();
    const user = userResult.getValue();
    expect(user.name).toBe('Test User');
    expect(user.email.value).toBe('test@example.com');
    expect(user.status).toBe(UserStatusEnum.ACTIVE);
  });
  
  it('should fail with invalid name', () => {
    // 準備
    const emailResult = Email.create('test@example.com');
    
    // 実行
    const userResult = User.create({
      email: emailResult.getValue(),
      name: '',  // 無効な名前
      status: UserStatusEnum.ACTIVE
    });
    
    // 検証
    expect(userResult.isFailure()).toBeTruthy();
    expect(userResult.getError().message).toContain('名前は2文字以上必要です');
  });
  
  it('should deactivate user correctly', () => {
    // 準備
    const emailResult = Email.create('test@example.com');
    const userResult = User.create({
      email: emailResult.getValue(),
      name: 'Test User',
      status: UserStatusEnum.ACTIVE
    });
    const user = userResult.getValue();
    
    // 実行
    user.deactivate();
    
    // 検証
    expect(user.status).toBe(UserStatusEnum.INACTIVE);
  });
});
```

### テスト実装例 - ユースケース (単体テスト)

```typescript
// @core/user/application/use-cases/__tests__/create-user.use-case.unit.test.ts
import { CreateUserUseCase } from '../create-user.use-case';
import { UserRepositoryInterface } from '../../../domain/repositories/user-repository.interface';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { Result } from '@core/shared/result';
import { User } from '../../../domain/entities/user.entity';
import { UserStatusEnum } from '../../../domain/enums/user-status.enum';

// リポジトリのモック
const mockUserRepository: jest.Mocked<UserRepositoryInterface> = {
  save: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  // ...他のメソッド
};

describe('CreateUserUseCase - Unit Tests', () => {
  let useCase: CreateUserUseCase;
  
  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateUserUseCase(mockUserRepository);
  });
  
  it('should create a user successfully', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'Password123!'
    };
    
    // 既存ユーザーがいないことを模擬
    mockUserRepository.findByEmail.mockResolvedValue(Result.ok(null));
    
    // 保存成功を模擬
    mockUserRepository.save.mockResolvedValue(Result.ok(undefined));
    
    // 実行
    const result = await useCase.execute(dto);
    
    // 検証
    expect(result.isSuccess()).toBeTruthy();
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockUserRepository.save).toHaveBeenCalled();
  });
  
  it('should fail if user already exists', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'existing@example.com',
      name: 'Existing User',
      password: 'Password123!'
    };
    
    // 既存ユーザーがいることを模擬
    const existingUser = User.create({
      email: { value: 'existing@example.com' },
      name: 'Existing User',
      status: UserStatusEnum.ACTIVE
    }).getValue();
    
    mockUserRepository.findByEmail.mockResolvedValue(Result.ok(existingUser));
    
    // 実行
    const result = await useCase.execute(dto);
    
    // 検証
    expect(result.isFailure()).toBeTruthy();
    expect(result.getError().message).toContain('メールアドレスは既に使用されています');
    expect(mockUserRepository.save).not.toHaveBeenCalled();
  });
});
```

### テスト実装例 - ユースケース (統合テスト)

```typescript
// @core/user/application/use-cases/__tests__/create-user.use-case.integration.test.ts
import { CreateUserUseCase } from '../create-user.use-case';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { CreateUserDto } from '../../dtos/create-user.dto';
import { db } from '@core/infrastructure/database';

// 実際のリポジトリとデータベースを使用
describe('CreateUserUseCase - Integration Tests', () => {
  let useCase: CreateUserUseCase;
  let userRepository: UserRepository;
  
  beforeAll(async () => {
    // テスト用DBの準備
    await db.migrate.latest();
  });
  
  beforeEach(async () => {
    // テスト間でのデータ分離
    await db.transaction(async (trx) => {
      await trx.table('users').delete();
    });
    
    userRepository = new UserRepository(db);
    useCase = new CreateUserUseCase(userRepository);
  });
  
  afterAll(async () => {
    await db.destroy();
  });
  
  it('should create a user in the database', async () => {
    // 準備
    const dto: CreateUserDto = {
      email: 'integration@example.com',
      name: 'Integration Test User',
      password: 'Password123!'
    };
    
    // 実行
    const result = await useCase.execute(dto);
    
    // 検証
    expect(result.isSuccess()).toBeTruthy();
    
    // DBから直接検証
    const savedUser = await userRepository.findByEmail('integration@example.com');
    expect(savedUser.isSuccess()).toBeTruthy();
    expect(savedUser.getValue()?.name).toBe('Integration Test User');
  });
});
```

### テスト実装例 - E2Eテスト

```typescript
// @core/user/presentation/e2e/__tests__/user-registration.e2e.test.ts
import request from 'supertest';
import { app } from '../../../../../apps/api/src/app';
import { db } from '@core/infrastructure/database';

describe('User Registration - E2E Tests', () => {
  beforeAll(async () => {
    // テスト用DBの準備
    await db.migrate.latest();
  });
  
  beforeEach(async () => {
    // テスト間でのデータ分離
    await db.transaction(async (trx) => {
      await trx.table('users').delete();
    });
  });
  
  afterAll(async () => {
    await db.destroy();
  });
  
  it('should register a new user and return success', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'e2e@example.com',
        name: 'E2E Test User',
        password: 'Password123!'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe('e2e@example.com');
    
    // 実際にログインできるか確認
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'e2e@example.com',
        password: 'Password123!'
      });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body).toHaveProperty('token');
  });
});
```

## 📖 実装フロー

### 新しいドメイン実装の基本フロー

1. **列挙型と値オブジェクトの定義**：ドメイン内の列挙型と値オブジェクトを特定し、実装する
2. **エンティティの定義**：ドメインのエンティティと集約ルートを定義する
3. **リポジトリインターフェースの定義**：ドメインのリポジトリインターフェースを定義する
4. **ドメインサービスの定義**：必要なドメインサービスを実装する
5. **ユースケースの実装**：アプリケーション層にユースケースを実装する
6. **DTOの定義**：アプリケーション層と外部のやり取りに必要なDTOを定義する
7. **リポジトリ実装**：インフラストラクチャ層にDrizzleを使用したリポジトリを実装する
8. **テストの実装**：各レイヤーの適切なテストを実装する
   - ドメイン層: 単体テスト
   - ユースケース: 単体テストと統合テスト
   - リポジトリ: 統合テスト
   - コントローラ: 統合テスト
   - 全体フロー: E2Eテスト

## 📚 参照

- 詳細設計については[理想設計書](./01_ideal_design.md)を参照
- 移行プロセスについては[移行計画書](./02_migration_plan.md)を参照
- Userドメインの具体的実装は[Userドメイン実装指示書](./04_user_domain_guide.md)を参照
- 将来的な拡張計画は[将来展開計画書](./05_future_expansion_plan.md)を参照 