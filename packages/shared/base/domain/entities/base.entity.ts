import { EntityBase } from '@core/shared/base/domain/interfaces/entity-base.interface.ts';
import { BaseId } from '@core/shared/base/domain/value-objects/base-id.vo.ts';
import { DateTimeString } from '@core/shared/value-objects/date-time-string.vo.ts';

/**
 * @abstract
 * @class BaseEntity
 * @implements {EntityBase<TId>}
 * @description ドメインエンティティの基底クラス。
 * ID、作成日時、更新日時のプロパティと、基本的な等価性比較を提供します。
 * 更新日時は主にリポジトリ層で永続化時に更新されることを想定しています。
 * @template TId - エンティティのIDの型。BaseIdを継承している必要があります。
 */
export abstract class BaseEntity<TId extends BaseId = BaseId<string>> implements EntityBase<TId> {
  /**
   * エンティティのユニークな識別子。
   * @readonly
   */
  public readonly id: TId;

  /**
   * エンティティが作成された日時。
   * @readonly
   */
  public readonly createdAt: DateTimeString;

  /**
   * エンティティが最後に更新された日時。
   * リポジトリ層での永続化時に更新されることを想定しています。
   * @readonly
   */
  public readonly updatedAt: DateTimeString;

  /**
   * 継承クラスから呼び出されるコンストラクタ。
   * ID、作成日時、更新日時を初期化します。
   * @param {TId} id - エンティティID。
   * @param {DateTimeString} createdAt - 作成日時。
   * @param {DateTimeString} updatedAt - 更新日時。
   * @protected
   */
  protected constructor(id: TId, createdAt: DateTimeString, updatedAt: DateTimeString) {
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * このエンティティが別のエンティティと等しいか、IDに基づいて比較します。
   * @param {EntityBase<TId> | null | undefined} other - 比較対象の他のエンティティ。
   * @returns {boolean} IDが等しい場合は true、それ以外は false。
   */
  public equals(other: EntityBase<TId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.id.equals(other.id);
  }
}
