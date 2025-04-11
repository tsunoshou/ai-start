import { Result, ok, err } from 'neverthrow';

import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { AppError } from '@core/shared/errors/app.error';
import { InfrastructureError } from '@core/shared/errors/infrastructure.error';

/**
 * 値オブジェクトマッピング定義
 *
 * @template TInput - 値オブジェクト作成時の入力型
 * @template TOutput - 値オブジェクトの出力型
 */
export interface ValueObjectMapping<TInput = unknown, TOutput = unknown> {
  /** 値オブジェクトのファクトリー関数を持つクラス参照 */
  valueObject: { create: (value: TInput) => Result<TOutput, AppError> };

  /** 変換元のフィールド名（省略時はキー名を使用） */
  sourceField?: string;

  /** 値オブジェクト作成前に適用する変換関数（オプション） */
  transform?: (value: unknown) => TInput;
}

/**
 * プロパティマッピング定義
 *
 * @template TOutput - 変換後の出力型
 */
export interface PropertyMapping<TOutput = unknown> {
  /** 変換元のフィールドパス（ドット区切りでネスト参照可能） */
  sourceField: string;

  /** 変換時に適用する関数（オプション） */
  transform?: (value: unknown) => TOutput;
}

/**
 * ドメインエンティティ構築のための設定
 *
 * @template TEntity - 構築するドメインエンティティの型
 * @template TRecord - 変換元のデータベースレコード型
 */
export interface DomainMappingConfig<TEntity, TRecord> {
  /** 値オブジェクト定義マップ */
  valueObjects: Record<string, ValueObjectMapping>;

  /** 必須フィールド */
  requiredFields: readonly string[];

  /** エンティティコンストラクタ関数 */
  entityConstructor: (valueObjects: Record<string, unknown>, record?: TRecord) => TEntity;
}

/**
 * エンティティーマッパーインターフェース
 * ドメインエンティティとデータベースレコードの間の変換を定義します
 *
 * @template TEntity - ドメインエンティティの型
 * @template TRecord - データベースレコード（select結果）の型
 * @template TData - データベース挿入/更新用データの型
 */
export interface EntityMapperInterface<TEntity, TRecord extends Record<string, unknown>, TData> {
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
 * 宣言的マッピングパターンを実装し、サブクラスでのコード重複を減らします。
 *
 * @template TEntity - ドメインエンティティの型
 * @template TRecord - データベースレコード（select結果）の型
 * @template TData - データベース挿入/更新用データの型
 * @template TDTO - DTOの型（オプション）
 */
export abstract class BaseEntityMapper<
  TEntity,
  TRecord extends Record<string, unknown>,
  TData,
  TDTO = Record<string, unknown>,
> implements EntityMapperInterface<TEntity, TRecord, TData>
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
        new InfrastructureError(
          ErrorCode.InternalServerError,
          'エンティティ配列のDTO変換に失敗しました',
          {
            cause: error instanceof Error ? error : undefined,
          }
        )
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
        new InfrastructureError(
          ErrorCode.InternalServerError,
          'レコード配列のドメインエンティティ変換に失敗しました',
          {
            cause: error instanceof Error ? error : undefined,
          }
        )
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
    requiredProps: readonly string[]
  ): Result<void, InfrastructureError> {
    const missingProps = requiredProps.filter(
      (prop) => record[prop as keyof T] === undefined || record[prop as keyof T] === null
    );

    if (missingProps.length > 0) {
      return err(
        new InfrastructureError(
          ErrorCode.InternalServerError,
          `レコードに必須プロパティがありません: ${missingProps.join(', ')}`
        )
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
          ErrorCode.InternalServerError,
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

  // ===== 以下に宣言的マッピングのための共通メソッドを追加 =====

  /**
   * 値オブジェクトを宣言的に作成するヘルパーメソッド
   *
   * @param record - 変換元のレコード
   * @param definitions - 値オブジェクト定義のマップ
   * @returns 作成された値オブジェクトのマップ
   */
  protected createValueObjects<T extends Record<string, unknown>>(
    record: T,
    definitions: Record<string, ValueObjectMapping>
  ): Result<Record<string, unknown>, InfrastructureError> {
    try {
      const results: Record<string, Result<unknown, AppError>> = {};

      for (const [key, def] of Object.entries(definitions)) {
        const sourceField = def.sourceField || key;
        const value = record[sourceField];
        const transformedValue = def.transform ? def.transform(value) : value;
        results[key] = def.valueObject.create(transformedValue);
      }

      const errors: AppError[] = [];

      for (const [_key, result] of Object.entries(results)) {
        if (result.isErr()) {
          errors.push(result.error);
        }
      }

      if (errors.length > 0) {
        return err(
          new InfrastructureError(
            ErrorCode.ValidationError,
            `値オブジェクトの作成に失敗しました。`,
            {
              metadata: { aggregatedErrors: errors },
            }
          )
        );
      }

      const createdValueObjects = Object.fromEntries(
        Object.entries(results).map(([key, result]) => [key, result._unsafeUnwrap()])
      );

      return ok(createdValueObjects);
    } catch (error) {
      return err(
        new InfrastructureError(
          ErrorCode.InternalServerError,
          '値オブジェクト作成中に予期せぬエラーが発生しました',
          { cause: error instanceof Error ? error : undefined }
        )
      );
    }
  }

  /**
   * エンティティから値オブジェクトの値を宣言的に抽出するヘルパーメソッド
   *
   * @param entity - 変換元のエンティティ
   * @param definitions - プロパティ定義のマップ
   * @returns 抽出された値のマップ
   */
  protected extractValues<U>(
    entity: TEntity,
    definitions: Record<keyof U, PropertyMapping>
  ): Result<U, InfrastructureError> {
    try {
      const result = {} as U;

      for (const [targetKey, def] of Object.entries(definitions) as [keyof U, PropertyMapping][]) {
        // ネストされたプロパティパスを解決（例: 'id.value'）
        const pathParts = def.sourceField.split('.');
        let currentObject: unknown = entity;
        let currentValue: unknown;

        // プロパティパスを辿る
        for (const part of pathParts) {
          if (currentObject === null || currentObject === undefined) {
            return err(
              new InfrastructureError(
                ErrorCode.InternalServerError,
                `エンティティの ${def.sourceField} パスが存在しません`
              )
            );
          }
          currentValue = (currentObject as Record<string, unknown>)[part];
          currentObject = currentValue;
        }

        // 変換関数があれば適用
        const transformedValue = def.transform ? def.transform(currentValue) : currentValue;
        // 型安全性を考慮したキャスト
        (result as Record<keyof U, unknown>)[targetKey] = transformedValue;
      }

      return ok(result);
    } catch (error) {
      return err(
        new InfrastructureError(ErrorCode.InternalServerError, 'プロパティ抽出に失敗しました', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }

  /**
   * 宣言的定義を使用してデータベースレコードからドメインエンティティへ変換する共通メソッド
   * このメソッドをサブクラスで利用して、toDomainメソッドを簡潔に実装できます
   *
   * @param record - データベースレコード
   * @param config - ドメイン変換の設定
   * @returns ドメインエンティティを含むResult
   */
  protected toDomainUsingDefinition<T extends TRecord>(
    record: T,
    config: DomainMappingConfig<TEntity, T>
  ): Result<TEntity, InfrastructureError> {
    try {
      // 必須プロパティのチェック
      const recordValidation = this.validateRequiredProperties(record, config.requiredFields);
      if (recordValidation.isErr()) {
        return err(recordValidation.error);
      }

      // 宣言的な定義を使って値オブジェクトを作成
      return this.createValueObjects(record, config.valueObjects).andThen((valueObjects) => {
        try {
          // エンティティの再構築
          const entity = config.entityConstructor(valueObjects, record);
          return ok(entity);
        } catch (error) {
          return err(
            new InfrastructureError(
              ErrorCode.InternalServerError,
              'エンティティの再構築に失敗しました',
              {
                cause: error instanceof Error ? error : undefined,
              }
            )
          );
        }
      });
    } catch (error) {
      return err(
        new InfrastructureError(
          ErrorCode.InternalServerError,
          'レコードのドメインエンティティへの変換に失敗しました',
          {
            cause: error instanceof Error ? error : undefined,
          }
        )
      );
    }
  }

  /**
   * 宣言的定義を使用してエンティティからDTO/DBレコードへ変換する共通メソッド
   * このメソッドをサブクラスで利用して、toDTOやtoPersistenceメソッドを簡潔に実装できます
   *
   * @param entity - ドメインエンティティ
   * @param definitions - プロパティ定義のマップ
   * @returns 変換された結果を含むResult
   */
  protected toObjectUsingDefinition<U>(
    entity: TEntity,
    definitions: Record<keyof U, PropertyMapping>
  ): Result<U, InfrastructureError> {
    try {
      if (entity === null || entity === undefined) {
        return err(
          new InfrastructureError(
            ErrorCode.ValidationError,
            'エンティティがnullまたはundefinedです'
          )
        );
      }

      return this.extractValues<U>(entity, definitions);
    } catch (error) {
      return err(
        new InfrastructureError(ErrorCode.InternalServerError, 'エンティティの変換に失敗しました', {
          cause: error instanceof Error ? error : undefined,
        })
      );
    }
  }
}
