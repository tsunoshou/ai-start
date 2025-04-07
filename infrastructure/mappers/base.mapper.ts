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
 */
export abstract class BaseEntityMapper<TEntity, TRecord, TData>
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
