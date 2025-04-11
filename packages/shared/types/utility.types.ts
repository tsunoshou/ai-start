/**
 * @fileoverview Utility type definitions for enhancing type safety and providing common type manipulations.
 * Adheres to the type definitions specified in docs/05_type_definitions.md.
 * @lastmodified 2025-04-04
 */

/**
 * Creates an Opaque Type, also known as Nominal Typing or Branded Type.
 * This utility allows distinguishing types that share the same underlying primitive type (e.g., string).
 * It helps prevent accidental assignment between different conceptual types (like UserId and ProductId).
 *
 * @template K The base type (e.g., string, number).
 * @template T A unique literal type (string) used as the brand name.
 *
 * @example
 * // Define a UserId type based on string
 * type UserId = Brand<string, "UserId">;
 *
 * // Define a ProductId type based on string
 * type ProductId = Brand<string, "ProductId">;
 *
 * // Usage:
 * let userId: UserId = "user-123" as UserId; // Requires explicit casting
 * let productId: ProductId = "prod-456" as ProductId;
 *
 * // Type error: Cannot assign ProductId to UserId
 * // userId = productId;
 *
 * function getUser(id: UserId) { // implementation }
 * // Type error: Cannot pass ProductId where UserId is expected
 * // getUser(productId);
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type Brand<K, T> = K & { __brand: T };
