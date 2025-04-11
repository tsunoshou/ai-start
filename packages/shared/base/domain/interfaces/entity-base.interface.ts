import { BaseId } from '@core/shared/base/domain/value-objects/base-id.vo';
import { DateTimeString } from '@core/shared/value-objects/date-time-string.vo';

/**
 * @interface EntityBase
 * @description Base interface for all entities in the domain.
 * Ensures that all entities have a unique identifier and timestamp fields.
 * @template TId - The type of the entity's unique identifier, extending BaseId.
 */
export interface EntityBase<TId extends BaseId = BaseId<string>> {
  // Specify string for default BaseId type
  /**
   * The unique identifier for the entity.
   * @readonly
   */
  readonly id: TId;

  /**
   * Timestamp indicating when the entity was created.
   * @readonly
   */
  readonly createdAt: DateTimeString;

  /**
   * Timestamp indicating when the entity was last updated.
   * @readonly
   */
  readonly updatedAt: DateTimeString;

  /**
   * Checks if this entity is equal to another entity based on their IDs.
   * @param {EntityBase<TId>} other - The other entity to compare against.
   * @returns {boolean} True if the entities have the same ID, false otherwise.
   */
  equals(other: EntityBase<TId>): boolean;
}
