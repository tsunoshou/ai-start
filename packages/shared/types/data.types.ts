/**
 * @fileoverview Type definitions related to data handling, such as pagination, sorting, and filtering.
 * These types are commonly used in API requests and responses, and for database query construction.
 * Adheres to the type definitions specified in docs/05_type_definitions.md.
 * @lastmodified 2025-04-04
 */

import type { FilterOperator, SortDirection } from './common.types';

/**
 * Defines the parameters for requesting paginated data.
 * Specifies the page number and the number of items per page.
 *
 * @example
 * const params: PaginationParams = {
 *   page: 2, // Requesting the second page
 *   limit: 20 // Requesting 20 items per page
 * };
 */
export interface PaginationParams {
  /** The page number being requested (typically 1-indexed). */
  page: number;
  /** The maximum number of items to return per page. */
  limit: number;
}

/**
 * Defines the structure for a paginated API response.
 * Contains the data items for the current page, along with metadata about the pagination state.
 *
 * @template T The type of the items included in the paginated response.
 *
 * @example
 * interface User {
 *   id: string;
 *   name: string;
 * }
 *
 * const userResponse: PaginatedResponse<User> = {
 *   items: [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }],
 *   totalItems: 100,
 *   totalPages: 5,
 *   currentPage: 1,
 *   itemsPerPage: 20,
 *   hasNextPage: true,
 *   hasPreviousPage: false,
 * };
 */
export interface PaginatedResponse<T> {
  /** An array of items for the current page. */
  items: T[];
  /** The total number of items available across all pages. */
  totalItems: number;
  /** The total number of pages available. */
  totalPages: number;
  /** The current page number (typically 1-indexed). */
  currentPage: number;
  /** The number of items requested per page (matches the request limit). */
  itemsPerPage: number;
  /** Indicates if there is a next page available. */
  hasNextPage: boolean;
  /** Indicates if there is a previous page available. */
  hasPreviousPage: boolean;
}

/**
 * Defines the parameters for specifying data sorting criteria.
 * Specifies the field to sort by and the direction (ascending or descending).
 *
 * @template T The type of the object being sorted, used to ensure the 'field' is a valid key.
 *
 * @example
 * interface Product {
 *   id: string;
 *   name: string;
 *   price: number;
 * }
 *
 * const sortByPriceDesc: SortParams<Product> = {
 *   field: 'price',
 *   direction: 'desc'
 * };
 *
 * const sortByNameAsc: SortParams<Product> = {
 *   field: 'name',
 *   direction: 'asc'
 * };
 */
export interface SortParams<T> {
  /** The key of the object T to sort by. */
  field: keyof T;
  /** The sorting direction ('asc' or 'desc'). */
  direction: SortDirection;
}

/**
 * Defines the parameters for specifying data filtering criteria.
 * Specifies the field to filter on, the operator to use, and the value(s) to compare against.
 *
 * @template T The type of the object being filtered, used to ensure the 'field' is a valid key.
 *
 * @example
 * interface Order {
 *   id: string;
 *   status: 'pending' | 'completed' | 'cancelled';
 *   amount: number;
 *   createdAt: Date;
 * }
 *
 * const filterByStatus: FilterParams<Order> = {
 *   field: 'status',
 *   operator: 'eq',
 *   value: 'completed'
 * };
 *
 * const filterByAmount: FilterParams<Order> = {
 *   field: 'amount',
 *   operator: 'gte',
 *   value: 100
 * };
 *
 * const filterByDate: FilterParams<Order> = {
 *   field: 'createdAt',
 *   operator: 'lt',
 *   value: new Date('2024-01-01')
 * };
 *
 * const filterByIds: FilterParams<Order> = {
 *    field: 'id',
 *    operator: 'in',
 *    value: ['order1', 'order2']
 * };
 *
 * const filterNotNull: FilterParams<Order> = {
 *   field: 'status', // Field is technically irrelevant for isNull/isNotNull
 *   operator: 'isNotNull'
 *   // value is not needed for isNull/isNotNull
 * };
 */
export interface FilterParams<T> {
  /** The key of the object T to filter by. */
  field: keyof T;
  /** The filtering operator to apply. */
  operator: FilterOperator;
  /** The value(s) to use for comparison. Type depends on the operator (e.g., array for 'in'/'nin'). Not used for 'isNull'/'isNotNull'. */
  value?: unknown;
}
