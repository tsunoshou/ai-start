import 'reflect-metadata';
import { Result, ok, err } from 'neverthrow';
import { beforeEach, describe, it, expect } from 'vitest';

import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { AppError } from '@core/shared/errors/app.error';
import { InfrastructureError } from '@core/shared/errors/infrastructure.error';

import {
  BaseEntityMapper,
  DomainMappingConfig,
  PropertyMapping,
  ValueObjectMapping,
} from '../base.mapper';

// テスト用の値オブジェクト構造を定義
interface TestIdProps {
  value: string;
}

class TestId implements TestIdProps {
  private constructor(public readonly value: string) {}

  static create(value: string): Result<TestId, AppError> {
    if (!value) {
      return err(new AppError(ErrorCode.ValidationError, 'IDは必須です'));
    }
    return ok(new TestId(value));
  }
}

interface TestNameProps {
  value: string;
}

class TestName implements TestNameProps {
  private constructor(public readonly value: string) {}

  static create(value: string): Result<TestName, AppError> {
    if (!value || value.length < 3) {
      return err(new AppError(ErrorCode.ValidationError, '名前は3文字以上必要です'));
    }
    return ok(new TestName(value));
  }
}

// テスト用のドメインエンティティ
class TestEntity {
  constructor(
    public readonly id: TestId,
    public readonly name: TestName,
    public readonly createdAt: Date
  ) {}

  static reconstruct(props: { id: TestId; name: TestName; createdAt: Date }): TestEntity {
    return new TestEntity(props.id, props.name, props.createdAt);
  }
}

// テスト用のDBレコード型
interface TestDbRecord extends Record<string, unknown> {
  id: string;
  name: string;
  createdAt: Date;
}

// テスト用のDTO型
interface TestDTO {
  id: string;
  name: string;
  createdAtIso: string;
}

// テスト用のマッパークラス
class TestMapper extends BaseEntityMapper<TestEntity, TestDbRecord, TestDbRecord, TestDTO> {
  private readonly domainMappingConfig: DomainMappingConfig<TestEntity, TestDbRecord> = {
    valueObjects: {
      id: {
        valueObject: TestId as unknown as { create: (value: unknown) => Result<unknown, AppError> },
        sourceField: 'id',
      },
      name: {
        valueObject: TestName as unknown as {
          create: (value: unknown) => Result<unknown, AppError>;
        },
        sourceField: 'name',
      },
    },
    requiredFields: ['id', 'name', 'createdAt'],
    entityConstructor: (valueObjects, record) =>
      TestEntity.reconstruct({
        id: valueObjects.id as TestId,
        name: valueObjects.name as TestName,
        createdAt: record ? (record.createdAt as Date) : new Date(),
      }),
  };

  private readonly dtoPropMappings: Record<keyof TestDTO, PropertyMapping> = {
    id: { sourceField: 'id.value' },
    name: { sourceField: 'name.value' },
    createdAtIso: {
      sourceField: 'createdAt',
      transform: (date) => (date instanceof Date ? date.toISOString() : String(date)),
    },
  };

  private readonly persistencePropMappings: Record<keyof TestDbRecord, PropertyMapping> = {
    id: { sourceField: 'id.value' },
    name: { sourceField: 'name.value' },
    createdAt: { sourceField: 'createdAt' },
  };

  // メソッドの実装
  toDomain(record: TestDbRecord): Result<TestEntity, InfrastructureError> {
    return this.toDomainUsingDefinition(record, this.domainMappingConfig);
  }

  toDTO(entity: TestEntity): Result<TestDTO, InfrastructureError> {
    return this.toObjectUsingDefinition<TestDTO>(entity, this.dtoPropMappings);
  }

  toPersistence(entity: TestEntity): Result<TestDbRecord, InfrastructureError> {
    return this.toObjectUsingDefinition<TestDbRecord>(entity, this.persistencePropMappings);
  }

  // テスト用に保護メソッドを公開
  public testCreateValueObjects<T extends Record<string, unknown>>(
    record: T,
    definitions: Record<string, ValueObjectMapping>
  ) {
    return this.createValueObjects(record, definitions);
  }

  public testExtractValues<U>(
    entity: TestEntity,
    definitions: Record<keyof U, PropertyMapping<unknown>>
  ) {
    return this.extractValues<U>(entity, definitions);
  }
}

describe('BaseEntityMapper', () => {
  // テスト用のマッパーインスタンス
  let testMapper: TestMapper;

  // 各テスト前の準備
  beforeEach(() => {
    testMapper = new TestMapper();
  });

  describe('createValueObjects', () => {
    it('should successfully create value objects from record properties', () => {
      // テスト用のレコードを準備
      const record = {
        id: 'test-123',
        name: 'Test Name',
        extraField: 'extra',
      };

      // 値オブジェクト定義
      const definitions = {
        id: {
          valueObject: TestId as unknown as {
            create: (value: unknown) => Result<unknown, AppError>;
          },
          sourceField: 'id',
        },
        name: {
          valueObject: TestName as unknown as {
            create: (value: unknown) => Result<unknown, AppError>;
          },
          sourceField: 'name',
        },
      };

      // メソッドを実行
      const result = testMapper.testCreateValueObjects(record, definitions);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const valueObjects = result.value;
        expect((valueObjects.id as TestId).value).toBe('test-123');
        expect((valueObjects.name as TestName).value).toBe('Test Name');
      }
    });

    it('should return an error when value object creation fails', () => {
      // 無効なデータを持つレコード
      const record = {
        id: 'test-123',
        name: 'AB', // 3文字未満なので、TestName.create()が失敗する
      };

      // 値オブジェクト定義
      const definitions = {
        id: {
          valueObject: TestId as unknown as {
            create: (value: unknown) => Result<unknown, AppError>;
          },
          sourceField: 'id',
        },
        name: {
          valueObject: TestName as unknown as {
            create: (value: unknown) => Result<unknown, AppError>;
          },
          sourceField: 'name',
        },
      };

      // メソッドを実行
      const result = testMapper.testCreateValueObjects(record, definitions);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        // エラーが InfrastructureError であることを確認
        expect(result.error).toBeInstanceOf(InfrastructureError);
        // エラーコードが ValidationError であることを確認
        expect(result.error.code).toBe(ErrorCode.ValidationError);
        expect(result.error.message).toContain('値オブジェクトの作成に失敗しました。');
        // cause が undefined であることを確認
        expect(result.error.cause).toBeUndefined();
        // metadata に元エラーの情報が含まれていることを確認
        expect(result.error.metadata).toHaveProperty('aggregatedErrors');
        // aggregatedErrors が AppError の配列であることを確認
        const aggregatedErrors = result.error.metadata?.aggregatedErrors as AppError[];
        expect(aggregatedErrors).toBeInstanceOf(Array);
        expect(aggregatedErrors.length).toBeGreaterThan(0);
        // 最初の元エラーが AppError (または ValidationError) であることを確認
        expect(aggregatedErrors[0]).toBeInstanceOf(AppError);
        expect(aggregatedErrors[0].message).toContain('名前は3文字以上必要です');
        // 元エラーのコードが ValidationError であることを確認
        expect(aggregatedErrors[0].code).toBe(ErrorCode.ValidationError);
      }
    });

    it('should apply transformation function when provided', () => {
      // テスト用のレコードを準備
      const record = {
        id: 'test-123',
        nameWithPrefix: 'prefix_TestName',
      };

      // 値オブジェクト定義（変換関数付き）
      const definitions = {
        id: {
          valueObject: TestId as unknown as {
            create: (value: unknown) => Result<unknown, AppError>;
          },
          sourceField: 'id',
        },
        name: {
          valueObject: TestName as unknown as {
            create: (value: unknown) => Result<unknown, AppError>;
          },
          sourceField: 'nameWithPrefix',
          transform: (value: unknown) => String(value).replace('prefix_', ''),
        },
      };

      // メソッドを実行
      const result = testMapper.testCreateValueObjects(record, definitions);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const valueObjects = result.value;
        expect((valueObjects.name as TestName).value).toBe('TestName');
      }
    });
  });

  describe('extractValues', () => {
    it('should extract values from an entity', () => {
      // テスト用のエンティティを準備
      const id = TestId.create('test-123')._unsafeUnwrap();
      const name = TestName.create('Test Name')._unsafeUnwrap();
      const createdAt = new Date('2024-01-01T10:00:00.000Z');
      const entity = new TestEntity(id, name, createdAt);

      // プロパティ定義
      const definitions = {
        entityId: { sourceField: 'id.value' },
        displayName: { sourceField: 'name.value' },
        creationDate: { sourceField: 'createdAt' },
      };

      // メソッドを実行
      const result = testMapper.testExtractValues(entity, definitions);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const values = result.value;
        expect(values).toEqual({
          entityId: 'test-123',
          displayName: 'Test Name',
          creationDate: createdAt,
        });
      }
    });

    it('should apply transformation function to extracted values', () => {
      // テスト用のエンティティを準備
      const id = TestId.create('entity-123')._unsafeUnwrap();
      const name = TestName.create('Entity Name')._unsafeUnwrap();
      const createdAt = new Date('2024-01-03T14:00:00.000Z');
      const entity = new TestEntity(id, name, createdAt);

      // プロパティ定義（変換関数付き）
      const definitions = {
        entityId: { sourceField: 'id.value' },
        displayName: {
          sourceField: 'name.value',
          transform: (value: unknown) => String(value).toUpperCase(),
        },
        creationDate: {
          sourceField: 'createdAt',
          transform: (date: unknown) => (date instanceof Date ? date.toISOString() : String(date)),
        },
      };

      // メソッドを実行
      const result = testMapper.testExtractValues(entity, definitions);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const values = result.value;
        expect(values).toEqual({
          entityId: 'entity-123',
          displayName: 'ENTITY NAME',
          creationDate: '2024-01-03T14:00:00.000Z',
        });
      }
    });

    it('should return an error when a source field path does not exist', () => {
      // テスト用のエンティティを準備
      const id = TestId.create('test-123')._unsafeUnwrap();
      const name = TestName.create('Test Name')._unsafeUnwrap();
      const createdAt = new Date('2024-01-01T10:00:00.000Z');
      const entity = new TestEntity(id, name, createdAt);

      // 存在しないパスを含むプロパティ定義
      const definitions = {
        entityId: { sourceField: 'id.value' },
        nonExistent: { sourceField: 'nonExistent.property' },
      };

      // メソッドを実行
      const result = testMapper.testExtractValues(entity, definitions);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('パスが存在しません');
        expect(result.error.message).toContain('nonExistent.property');
      }
    });
  });

  describe('toDomain', () => {
    it('should convert a database record to an entity', () => {
      // テスト用のDBレコードを準備
      const record: TestDbRecord = {
        id: 'db-123',
        name: 'Database Name',
        createdAt: new Date('2024-01-02T12:00:00.000Z'),
      };

      // toDomainメソッドを実行
      const result = testMapper.toDomain(record);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const entity = result.value;
        expect(entity).toBeInstanceOf(TestEntity);
        expect(entity.id.value).toBe('db-123');
        expect(entity.name.value).toBe('Database Name');
        // Date型はそのまま比較すると時刻が変わる可能性があるため、型のみをチェック
        expect(entity.createdAt).toBeInstanceOf(Date);
      }
    });

    it('should return an error when required fields are missing', () => {
      // 必須フィールドが欠けているレコード
      const incompleteRecord: Partial<TestDbRecord> = {
        id: 'db-123',
        // nameフィールドが欠けている
        createdAt: new Date(),
      };

      // toDomainメソッドを実行
      const result = testMapper.toDomain(incompleteRecord as TestDbRecord);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toContain('必須プロパティ');
        expect(result.error.message).toContain('name');
      }
    });
  });

  describe('toDTO', () => {
    it('should convert an entity to a DTO', () => {
      // テスト用のエンティティを準備
      const id = TestId.create('entity-123')._unsafeUnwrap();
      const name = TestName.create('Entity Name')._unsafeUnwrap();
      const createdAt = new Date('2024-01-03T14:00:00.000Z');
      const entity = new TestEntity(id, name, createdAt);

      // toDTOメソッドを実行
      const result = testMapper.toDTO(entity);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dto = result.value;
        expect(dto).toEqual({
          id: 'entity-123',
          name: 'Entity Name',
          createdAtIso: '2024-01-03T14:00:00.000Z',
        });
      }
    });
  });

  describe('toPersistence', () => {
    it('should convert an entity to a database record', () => {
      // テスト用のエンティティを準備
      const id = TestId.create('persist-123')._unsafeUnwrap();
      const name = TestName.create('Persistence Name')._unsafeUnwrap();
      const createdAt = new Date('2024-01-04T16:00:00.000Z');
      const entity = new TestEntity(id, name, createdAt);

      // toPersistenceメソッドを実行
      const result = testMapper.toPersistence(entity);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dbRecord = result.value;
        expect(dbRecord).toEqual({
          id: 'persist-123',
          name: 'Persistence Name',
          createdAt,
        });
      }
    });
  });
});
