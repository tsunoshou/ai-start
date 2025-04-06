/**
 * @fileoverview Common basic type definitions used throughout the application.
 * This file defines fundamental types like date formats, identifiers, and numerical representations.
 * Adheres to the type definitions specified in docs/05_type_definitions.md.
 * @lastmodified 2025-04-04
 */

/**
 * Represents a date and time string in ISO 8601 format (e.g., "2023-10-27T10:00:00.000Z").
 * Used for standardized date-time exchange, especially in APIs and database storage (timezone required).
 *
 * @example
 * const eventStart: ISODateTimeString = "2024-07-15T09:00:00.000Z";
 * const apiResponse = { createdAt: new Date().toISOString() as ISODateTimeString };
 */
export type ISODateTimeString = string;

/**
 * Represents a date string in YYYY-MM-DD format (e.g., "2023-10-27").
 * Used when only the date part is relevant, without time or timezone information.
 *
 * @example
 * const birthDate: DateOnlyString = "1995-08-21";
 * const queryParams = { startDate: "2024-01-01" as DateOnlyString };
 */
export type DateOnlyString = string;

/**
 * Represents a JavaScript Date object.
 * Primarily used for internal date/time manipulations and calculations within the application logic.
 * Avoid using directly in APIs or persistent storage where string formats (ISODateTimeString) are preferred.
 *
 * @example
 * const now: Timestamp = new Date();
 * function calculateAge(birthDate: Timestamp): number {
 *   // ... implementation ...
 *   return age;
 * }
 */
export type Timestamp = Date;

/**
 * Represents a generic identifier with a value and an equality check method.
 * This interface ensures that identifier value objects have a consistent structure.
 * @template T The type of the underlying identifier value (e.g., string, number).
 */
export interface Identifier<T = string> {
  /** The underlying value of the identifier. */
  readonly value: T;
  /** Checks if this identifier is equal to another identifier. */
  equals(other: Identifier<T>): boolean;
}

/**
 * Represents a percentage value as a number, typically ranging from 0 to 100.
 * Used for representing progress, rates, discounts, etc.
 * Note: The type itself doesn't enforce the 0-100 range; validation should be done separately where necessary.
 *
 * @example
 * const progress: Percentage = 75.5;
 * const discountRate: Percentage = 10;
 * function applyDiscount(price: number, discount: Percentage): number {
 *   return price * (1 - discount / 100);
 * }
 */
export type Percentage = number;

/**
 * Represents the direction for sorting data.
 * 'asc' for ascending order, 'desc' for descending order.
 * Used in combination with SortParams.
 *
 * @example
 * const direction: SortDirection = 'desc';
 * const params: SortParams<{ name: string }> = { field: 'name', direction: 'asc' };
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Represents the available operators for filtering data.
 * Used in combination with FilterParams to define filtering criteria.
 *
 * - 'eq': Equal to
 * - 'neq': Not equal to
 * - 'gt': Greater than
 * - 'gte': Greater than or equal to
 * - 'lt': Less than
 * - 'lte': Less than or equal to
 * - 'in': Value is in the specified array
 * - 'nin': Value is not in the specified array
 * - 'like': Pattern matching (case-sensitive, depends on implementation)
 * - 'ilike': Pattern matching (case-insensitive, depends on implementation)
 * - 'isNull': Value is null or undefined
 * - 'isNotNull': Value is not null or undefined
 *
 * @example
 * const operatorEq: FilterOperator = 'eq';
 * const operatorLike: FilterOperator = 'like';
 * const params: FilterParams<{ status: string }> = { field: 'status', operator: 'in', value: ['active', 'pending'] };
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'
  | 'ilike'
  | 'isNull'
  | 'isNotNull';

/**
 * Represents the base properties common to many domain entities.
 * Includes read-only timestamps for creation and last update.
 * This interface serves as a foundation for domain entity definitions.
 * Note: The entity's specific ID (e.g., UserId) is defined within the entity itself, often using a Value Object.
 *
 * @example
 * import { Timestamp, Identifier } from './common.types';
 * import { Brand } from './utility.types';
 *
 * type ProductId = Brand<Identifier, 'ProductId'>;
 *
 * interface ProductProps extends BaseDomainEntity {
 *   readonly id: ProductId;
 *   name: string;
 *   price: number;
 * }
 *
 * class Product implements ProductProps {
 *   readonly id: ProductId;
 *   name: string;
 *   price: number;
 *   readonly createdAt: Timestamp;
 *   readonly updatedAt: Timestamp;
 *
 *   constructor(props: ProductProps) {
 *     this.id = props.id;
 *     this.name = props.name;
 *     this.price = props.price;
 *     this.createdAt = props.createdAt;
 *     this.updatedAt = props.updatedAt;
 *   }
 * }
 */
export interface BaseDomainEntity {
  /** The exact time when the entity was first created. Should be immutable. */
  readonly createdAt: Timestamp;
  /** The exact time when the entity was last modified. Should be updated on every change. */
  readonly updatedAt: Timestamp;
}
