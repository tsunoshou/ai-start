import { BaseRepositoryInterface } from '@core/shared/base/domain/repositories/base.repository.interface'; // Import base interface
import { AppResult } from '@core/shared/types/common.types';
import { Email } from '@core/shared/value-objects/email.vo';
import { User } from '@core/user/domain/entities/user.entity';
import { UserId } from '@core/user/domain/value-objects/user-id.vo';

/**
 * @interface UserRepositoryInterface
 * @extends BaseRepositoryInterface<UserId, User>
 * @description Interface defining the contract for user data persistence operations,
 * extending the base repository interface with user-specific methods.
 */
export interface UserRepositoryInterface extends BaseRepositoryInterface<UserId, User> {
  // findById, save methods are inherited from BaseRepositoryInterface

  /**
   * Finds a user by their email address.
   * @param email The Email value object.
   * @returns A Result containing the User entity or null if not found, or an AppError.
   */
  findByEmail(email: Email): Promise<AppResult<User | null>>;

  /**
   * Deletes an entity by its ID.
   * Overrides the return type to be AppResult consistent with BaseRepository implementation.
   */
  delete(id: UserId): Promise<AppResult<void>>;

  /** Finds all user entities, possibly with pagination. */
  findAll(options?: { limit?: number; offset?: number }): Promise<AppResult<User[]>>;

  // --- Add other necessary user-specific methods as required ---
}

/**
 * Dependency injection token for UserRepositoryInterface.
 */
export const UserRepositoryToken = Symbol('UserRepositoryInterface');
