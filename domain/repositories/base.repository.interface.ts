import type { AppResult, Identifier } from '@/shared/types/common.types';
import type { EntityBase } from '@/shared/types/entity-base.interface';

/**
 * @interface BaseRepositoryInterface
 * @description Defines the basic CRUD operations common to all repositories.
 * @template TID The type of the entity's identifier, extending the Identifier interface.
 * @template TDomain The type of the domain entity, extending EntityBase.
 */
export interface BaseRepositoryInterface<
  // TID now extends the Identifier interface, specifically with string value
  TID extends Identifier<string>,
  TDomain extends EntityBase<TID>,
> {
  /**
   * Finds an entity by its ID.
   * @param id The ID value object.
   * @returns A Result containing the domain entity or null if not found, or an AppError.
   */
  findById(id: TID): Promise<AppResult<TDomain | null>>;

  /**
   * Saves (creates or updates) a domain entity.
   * @param entity The domain entity to save.
   * @returns A Result containing void or an AppError (or InfrastructureError converted to AppError).
   */
  save(entity: TDomain): Promise<AppResult<void>>;

  /**
   * Deletes an entity by its ID.
   * @param id The ID value object.
   * @returns A Result containing void or an AppError.
   */
  delete(id: TID): Promise<AppResult<void>>;
}
