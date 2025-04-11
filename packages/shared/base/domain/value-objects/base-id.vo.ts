import { Identifier } from '@core/shared/types/common.types.ts';

/**
 * @abstract
 * @class BaseId
 * @implements Identifier<T>
 * @description Abstract base class for all identifier Value Objects.
 * Ensures consistent structure for IDs (value property and equals method).
 * @template T - The type of the underlying ID value (typically string or number).
 */
export abstract class BaseId<T = string> implements Identifier<T> {
  /**
   * The underlying value of the ID.
   * @public
   * @readonly
   */
  public readonly value: T;

  /**
   * Protected constructor to ensure subclasses handle value assignment.
   * @param {T} value - The value of the ID.
   * @protected
   */
  protected constructor(value: T) {
    this.value = value;
  }

  /**
   * Checks if this ID is equal to another ID based on their underlying values.
   * The parameter type is changed to match the Identifier interface.
   * @param {Identifier<T>} other - The other ID to compare against.
   * @returns {boolean} True if the IDs have the same value, false otherwise.
   */
  public equals(other: Identifier<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    // We can check the constructor if we know it must be the same type,
    // but comparing values is often sufficient for VOs.
    // if (!(other instanceof this.constructor)) {
    //   return false;
    // }
    return this.value === other.value;
  }
}
