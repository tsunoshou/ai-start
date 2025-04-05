/**
 * @abstract
 * @class BaseId
 * @description Abstract base class for all identifier Value Objects.
 * Ensures consistent structure for IDs (value property and equals method).
 * @template T - The type of the underlying ID value (typically string or number).
 */
export abstract class BaseId<T = string> {
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
   * @param {BaseId<T>} other - The other ID to compare against.
   * @returns {boolean} True if the IDs have the same value, false otherwise.
   */
  public equals(other: BaseId<T>): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return this.value === other.value;
  }
}
