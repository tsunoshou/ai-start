import { Result } from 'neverthrow';
import { injectable } from 'tsyringe';

import { UserDTO } from '@core/user/application/dtos/user.dto';
import { UserId } from '@core/user/domain/value-objects/user-id.vo';
import { UserName } from '@core/user/domain/value-objects/user-name.vo';
import { User } from '@core/user/domain/entities/user.entity';
import { users } from '@core/user/infrastructure/database/schema/users.schema';
import { InfrastructureError } from '@core/shared/errors/infrastructure.error';
import * as DateTimeStringModule from '@core/shared/value-objects/date-time-string.vo';
import { Email } from '@core/shared/value-objects/email.vo';
import { PasswordHash } from '@core/shared/value-objects/password-hash.vo';

import { BaseEntityMapper, DomainMappingConfig, PropertyMapping } from '@core/shared/base/infrastructure/mappers/base.mapper';
import { asValueObjectMapper, asType, toISOString } from '@core/shared/base/infrastructure/mappers/utils/mapping-helpers';

// DrizzleスキーマからDBの型を取得
export type UserDbSelect = typeof users.$inferSelect;
export type UserDbInsert = typeof users.$inferInsert;

/**
 * ユーザーエンティティとデータベースレコード間のマッピングを行うクラス
 *
 * BaseEntityMapperを継承し、ユーザー固有のマッピングロジックを実装します。
 * シングルトンとして利用されるため、injectableデコレータを使用しています。
 */
@injectable()
export class UserMapper extends BaseEntityMapper<User, UserDbSelect, UserDbInsert, UserDTO> {
  /**
   * ドメインエンティティへの変換に使用する設定
   */
  private readonly domainMappingConfig: DomainMappingConfig<User, UserDbSelect> = {
    valueObjects: {
      id: {
        valueObject: asValueObjectMapper(UserId),
        sourceField: 'id',
      },
      email: {
        valueObject: asValueObjectMapper(Email),
        sourceField: 'email',
      },
      name: {
        valueObject: asValueObjectMapper(UserName),
        sourceField: 'name',
      },
      passwordHash: {
        valueObject: asValueObjectMapper(PasswordHash),
        sourceField: 'passwordHash',
      },
      createdAt: {
        valueObject: asValueObjectMapper(DateTimeStringModule.DateTimeString),
        sourceField: 'createdAt',
        transform: (value) => toISOString(value),
      },
      updatedAt: {
        valueObject: asValueObjectMapper(DateTimeStringModule.DateTimeString),
        sourceField: 'updatedAt',
        transform: (value) => toISOString(value),
      },
    },
    requiredFields: ['id', 'email', 'name', 'passwordHash', 'createdAt', 'updatedAt'],
    entityConstructor: (valueObjects) =>
      User.reconstruct({
        id: asType<UserId>(valueObjects.id),
        email: asType<Email>(valueObjects.email),
        name: asType<UserName>(valueObjects.name),
        passwordHash: asType<PasswordHash>(valueObjects.passwordHash),
        createdAt: asType<DateTimeStringModule.DateTimeString>(valueObjects.createdAt),
        updatedAt: asType<DateTimeStringModule.DateTimeString>(valueObjects.updatedAt),
      }),
  };

  /**
   * DTOへの変換に使用するプロパティマッピング
   */
  private readonly dtoPropMappings: Record<keyof UserDTO, PropertyMapping> = {
    id: { sourceField: 'id.value' },
    email: { sourceField: 'email.value' },
    name: { sourceField: 'name.value' },
    createdAt: { sourceField: 'createdAt.value' },
    updatedAt: { sourceField: 'updatedAt.value' },
  };

  /**
   * DBレコードへの変換に使用するプロパティマッピング
   * UserDbInsertには必須のフィールドのみ含める（createdAt、updatedAtはDBで自動管理）
   */
  private readonly persistencePropMappings: Record<keyof UserDbSelect, PropertyMapping> = {
    id: { sourceField: 'id.value' },
    email: { sourceField: 'email.value' },
    name: { sourceField: 'name.value' },
    passwordHash: { sourceField: 'passwordHash.value' },
    createdAt: {
      sourceField: 'createdAt.value',
      transform: (value) => new Date(value as string),
    },
    updatedAt: {
      sourceField: 'updatedAt.value',
      transform: (value) => new Date(value as string),
    },
  };

  /**
   * ユーザーエンティティをUserDTOに変換するスタティックメソッド
   * 後方互換性のために残しています。
   *
   * @param entity - ユーザードメインエンティティ
   * @returns UserDTO - アプリケーション層で利用するDTO
   */
  static toDTO(entity: User): UserDTO {
    return {
      id: entity.id.value,
      email: entity.email.value,
      name: entity.name.value,
      createdAt: entity.createdAt.value,
      updatedAt: entity.updatedAt.value,
    };
  }

  /**
   * 複数のユーザーエンティティを配列でUserDTOに変換するスタティックメソッド
   * 後方互換性のために残しています。
   *
   * @param entities - ユーザードメインエンティティの配列
   * @returns UserDTO[] - アプリケーション層で利用するDTOの配列
   */
  static toDTOs(entities: User[]): UserDTO[] {
    return entities.map(UserMapper.toDTO);
  }

  /**
   * データベースレコードからユーザードメインエンティティへ変換します
   *
   * @param record - データベースから取得したユーザーレコード
   * @returns ユーザーエンティティを含むResult、または変換エラー
   */
  override toDomain(record: UserDbSelect): Result<User, InfrastructureError> {
    return this.toDomainUsingDefinition(record, this.domainMappingConfig);
  }

  /**
   * ユーザーエンティティをUserDTOに変換
   *
   * @param entity - ユーザードメインエンティティ
   * @returns UserDTOを含むResult、または変換エラー
   */
  override toDTO(entity: User): Result<UserDTO, InfrastructureError> {
    return this.toObjectUsingDefinition<UserDTO>(entity, this.dtoPropMappings);
  }

  /**
   * ユーザードメインエンティティからデータベースレコード形式へ変換します
   *
   * @param entity - ユーザードメインエンティティ
   * @returns データベース挿入/更新用レコードを含むResult、または変換エラー
   */
  override toPersistence(entity: User): Result<UserDbInsert, InfrastructureError> {
    return this.toObjectUsingDefinition<UserDbInsert>(entity, this.persistencePropMappings);
  }
}
