import { Result } from 'neverthrow';
import { injectable } from 'tsyringe';

import { UserDTO } from '@/application/dtos/user.dto';
import { UserId } from '@/domain/models/user/user-id.vo';
import { UserName } from '@/domain/models/user/user-name.vo';
import { User } from '@/domain/models/user/user.entity';
import { users } from '@/infrastructure/database/schema/users.schema';
import { InfrastructureError } from '@/shared/errors/infrastructure.error';
import * as DateTimeStringModule from '@/shared/value-objects/date-time-string.vo';
import { Email } from '@/shared/value-objects/email.vo';
import { PasswordHash } from '@/shared/value-objects/password-hash.vo';

import { BaseEntityMapper, DomainMappingConfig, PropertyMapping } from './base.mapper';

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
        valueObject: UserId as unknown as { create: (value: unknown) => Result<unknown, Error> },
        sourceField: 'id',
      },
      email: {
        valueObject: Email as unknown as { create: (value: unknown) => Result<unknown, Error> },
        sourceField: 'email',
      },
      name: {
        valueObject: UserName as unknown as { create: (value: unknown) => Result<unknown, Error> },
        sourceField: 'name',
      },
      passwordHash: {
        valueObject: PasswordHash as unknown as {
          create: (value: unknown) => Result<unknown, Error>;
        },
        sourceField: 'passwordHash',
      },
      createdAt: {
        valueObject: DateTimeStringModule.DateTimeString as unknown as {
          create: (value: unknown) => Result<unknown, Error>;
        },
        sourceField: 'createdAt',
        transform: (value) => this.dateToISOString(value as Date | string),
      },
      updatedAt: {
        valueObject: DateTimeStringModule.DateTimeString as unknown as {
          create: (value: unknown) => Result<unknown, Error>;
        },
        sourceField: 'updatedAt',
        transform: (value) => this.dateToISOString(value as Date | string),
      },
    },
    requiredFields: ['id', 'email', 'name', 'passwordHash', 'createdAt', 'updatedAt'],
    entityConstructor: (valueObjects) =>
      User.reconstruct({
        id: valueObjects.id as UserId,
        email: valueObjects.email as Email,
        name: valueObjects.name as UserName,
        passwordHash: valueObjects.passwordHash as PasswordHash,
        createdAt: valueObjects.createdAt as DateTimeStringModule.DateTimeString,
        updatedAt: valueObjects.updatedAt as DateTimeStringModule.DateTimeString,
      }),
  };

  /**
   * DTOへの変換に使用するプロパティマッピング
   */
  private readonly dtoPropMappings: Record<keyof UserDTO, PropertyMapping> = {
    id: { sourceField: 'id.value' },
    name: { sourceField: 'name.value' },
    email: { sourceField: 'email.value' },
    createdAt: { sourceField: 'createdAt.value' },
    updatedAt: { sourceField: 'updatedAt.value' },
  };

  /**
   * DBレコードへの変換に使用するプロパティマッピング
   * UserDbInsertには必須のフィールドのみ含める（createdAt、updatedAtはDBで自動管理）
   */
  private readonly persistencePropMappings: Record<string, PropertyMapping> = {
    id: { sourceField: 'id.value' },
    name: { sourceField: 'name.value' },
    email: { sourceField: 'email.value' },
    passwordHash: { sourceField: 'passwordHash.value' },
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
      name: entity.name.value,
      email: entity.email.value,
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
