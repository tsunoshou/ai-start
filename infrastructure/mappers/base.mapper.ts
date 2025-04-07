import { Result, ok, err } from 'neverthrow';

import { InfrastructureError } from '@/shared/errors/infrastructure.error';

/**
 * エンティティーマッパーインターフェース
 * ドメインエンティティとデータベースレコードの間の変換を定義します
 *
 * @template TEntity - ドメインエンティティの型
 * @template TRecord - データベースレコード（select結果）の型
 * @template TData - データベース挿入/更新用データの型
 */
export interface EntityMapperInterface<TEntity, TRecord, TData> {
  /**
   * データベースレコードからドメインエンティティへ変換
   *
   * @param record - データベースから取得したレコード
   * @returns ドメインエンティティを含むResult、または変換エラー
   */
  toDomain(record: TRecord): Result<TEntity, InfrastructureError>;

  /**
   * ドメインエンティティからデータベースレコード形式へ変換
   *
   * @param entity - ドメインエンティティ
   * @returns データベース挿入/更新用レコードを含むResult、または変換エラー
   */
  toPersistence(entity: TEntity): Result<TData, InfrastructureError>;
}

/**
 * エンティティマッパーの基本実装を提供する抽象クラス
 *
 * ドメインエンティティとデータベースレコード間のマッピングに関する共通機能を実装します。
 * サブクラスは、具体的なエンティティ型に対応する実装をする必要があります。
 *
 * @template TEntity - ドメインエンティティの型
 * @template TRecord - データベースレコード（select結果）の型
 * @template TData - データベース挿入/更新用データの型
 * @template TDTO - DTOの型（オプション）
 */
export abstract class BaseEntityMapper<TEntity, TRecord, TData, TDTO = Record<string, unknown>>
  implements EntityMapperInterface<TEntity, TRecord, TData>
{
  /**
   * データベースレコードからドメインエンティティへ変換（サブクラスで実装）
   *
   * @param record - データベースから取得したレコード
   * @returns ドメインエンティティを含むResult、または変換エラー
   */
  abstract toDomain(record: TRecord): Result<TEntity, InfrastructureError>;

  /**
   * ドメインエンティティからデータベースレコード形式へ変換（サブクラスで実装）
   *
   * @param entity - ドメインエンティティ
   * @returns データベース挿入/更新用レコードを含むResult、または変換エラー
   */
  abstract toPersistence(entity: TEntity): Result<TData, InfrastructureError>;

  /**
   * ドメインエンティティからDTOへ変換（オプションでサブクラスがオーバーライド可能）
   *
   * @param entity - ドメインエンティティ
   * @returns DTOを含むResult、または変換エラー
   */
  toDTO(_entity: TEntity): Result<TDTO, InfrastructureError> {
    throw new Error('toDTO method not implemented for this entity');
  }

  /**
   * 複数のドメインエンティティからDTO配列へ変換
   *
   * @param entities - ドメインエンティティの配列
   * @returns DTO配列を含むResult、または変換エラー
   */
  toDTOs(entities: TEntity[]): Result<TDTO[], InfrastructureError> {
    try {
      const dtoResults = entities.map((entity) => this.toDTO(entity));
      return Result.combine(dtoResults);
    } catch (error) {
      return err(
        new InfrastructureError('エンティティ配列のDTO変換に失敗しました', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * データベースレコード配列からドメインエンティティ配列へ変換
   *
   * @param records - データベースレコード配列
   * @returns ドメインエンティティ配列を含むResult、または変換エラー
   */
  toDomainArray(records: TRecord[]): Result<TEntity[], InfrastructureError> {
    try {
      const entityResults = records.map((record) => this.toDomain(record));
      return Result.combine(entityResults);
    } catch (error) {
      return err(
        new InfrastructureError('レコード配列のドメインエンティティ変換に失敗しました', {
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

  /**
   * Date型をISO文字列に変換します
   *
   * @param date - 変換する日付オブジェクトまたは日付文字列
   * @returns ISO形式の日付文字列
   */
  protected dateToISOString(date: Date | string): string {
    return date instanceof Date ? date.toISOString() : date;
  }
}
