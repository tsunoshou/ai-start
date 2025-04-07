import { Result, ok, err } from 'neverthrow';
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

import { BaseEntityMapper } from './base.mapper';

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
export class UserMapper extends BaseEntityMapper<User, UserDbSelect, UserDbInsert> {
  /**
   * ユーザーエンティティをUserDTOに変換するスタティックメソッド
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
  toDomain(record: UserDbSelect): Result<User, InfrastructureError> {
    try {
      // 必須プロパティのチェック
      const recordValidation = this.validateRequiredProperties(record, [
        'id',
        'email',
        'name',
        'passwordHash',
        'createdAt',
        'updatedAt',
      ]);

      if (recordValidation.isErr()) {
        return err(recordValidation.error);
      }

      // 値オブジェクトの作成
      const userIdResult = UserId.create(record.id);
      const emailResult = Email.create(record.email);
      const nameResult = UserName.create(record.name);
      const passwordHashResult = PasswordHash.create(record.passwordHash);

      // 日付の文字列への変換と値オブジェクト作成
      const createdAtStr =
        record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt;
      const updatedAtStr =
        record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt;

      const createdAtResult = DateTimeStringModule.DateTimeString.create(createdAtStr);
      const updatedAtResult = DateTimeStringModule.DateTimeString.create(updatedAtStr);

      // 全ての値オブジェクト作成結果を組み合わせる
      const combinedResult = Result.combine([
        userIdResult,
        emailResult,
        nameResult,
        passwordHashResult,
        createdAtResult,
        updatedAtResult,
      ]);

      if (combinedResult.isErr()) {
        return err(
          new InfrastructureError('ユーザーレコードから値オブジェクト作成に失敗しました', {
            cause: combinedResult.error,
          })
        );
      }

      // 成功した値オブジェクトを取り出す
      const [userId, email, name, passwordHash, createdAt, updatedAt] = combinedResult.value;

      // ユーザーエンティティの再構築
      const user = User.reconstruct({
        id: userId,
        email,
        name,
        passwordHash,
        createdAt,
        updatedAt,
      });

      return ok(user);
    } catch (error) {
      return err(
        new InfrastructureError('ユーザーレコードのドメインエンティティへの変換に失敗しました', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * ユーザードメインエンティティからデータベースレコード形式へ変換します
   *
   * @param entity - ユーザードメインエンティティ
   * @returns データベース挿入/更新用レコードを含むResult、または変換エラー
   */
  toPersistence(entity: User): Result<UserDbInsert, InfrastructureError> {
    try {
      // エンティティのnullチェック
      if (entity === null || entity === undefined) {
        return err(new InfrastructureError('ユーザーエンティティがnullまたはundefinedです'));
      }

      // 必須の値オブジェクトの存在チェック
      const idResult = this.safeGetValue(entity.id, 'id');
      const nameResult = this.safeGetValue(entity.name, 'name');
      const emailResult = this.safeGetValue(entity.email, 'email');
      const passwordHashResult = this.safeGetValue(entity.passwordHash, 'passwordHash');

      // すべての値取得結果を組み合わせる
      const combinedResult = Result.combine([
        idResult,
        nameResult,
        emailResult,
        passwordHashResult,
      ]);

      if (combinedResult.isErr()) {
        return err(combinedResult.error);
      }

      // 成功した値を取り出す
      const [id, name, email, passwordHash] = combinedResult.value;

      // データベースレコード形式へのマッピング
      const data: UserDbInsert = {
        id,
        name,
        email,
        passwordHash,
        // createdAtとupdatedAtはDB側で管理されるため含めない
      };

      return ok(data);
    } catch (error) {
      return err(
        new InfrastructureError('ユーザーエンティティのDBレコードへの変換に失敗しました', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * レコードに必須プロパティが存在するか検証します
   *
   * @param record - 検証するレコード
   * @param requiredProps - 必須プロパティ名の配列
   * @returns 成功または検証エラーを含むResult
   */
  protected validateRequiredProperties<T>(
    record: T,
    requiredProps: string[]
  ): Result<void, InfrastructureError> {
    const missingProps = requiredProps.filter(
      (prop) => record[prop as keyof T] === undefined || record[prop as keyof T] === null
    );

    if (missingProps.length > 0) {
      return err(
        new InfrastructureError(`レコードに必須プロパティがありません: ${missingProps.join(', ')}`)
      );
    }

    return ok(undefined);
  }

  /**
   * 値オブジェクトから安全に値を取得します
   *
   * nullチェックを行い、値オブジェクトがnullまたはundefinedの場合はエラーを返します。
   *
   * @param valueObject - 値を取得する値オブジェクト
   * @param propertyName - 値オブジェクトのプロパティ名（エラーメッセージ用）
   * @returns 値オブジェクトの値またはエラー
   */
  protected safeGetValue<T>(
    valueObject: { value: T } | null | undefined,
    propertyName: string
  ): Result<T, InfrastructureError> {
    if (valueObject === null || valueObject === undefined) {
      return err(
        new InfrastructureError(
          `エンティティの ${propertyName} プロパティがnullまたはundefinedです`
        )
      );
    }

    return ok(valueObject.value);
  }
}
