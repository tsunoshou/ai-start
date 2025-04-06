import { Result } from 'neverthrow';

import { UserId } from '@/domain/models/user/user-id.vo';
import { User } from '@/domain/models/user/user.entity';
import { AppError } from '@/shared/errors/app.error';
import { Email } from '@/shared/value-objects/email.vo';

import { BaseRepositoryInterface } from './base.repository.interface'; // Import base interface

/**
 * @interface UserRepositoryInterface
 * @extends BaseRepositoryInterface<UserId, User>
 * @description Interface defining the contract for user data persistence operations,
 * extending the base repository interface with user-specific methods.
 */
export interface UserRepositoryInterface extends BaseRepositoryInterface<UserId, User> {
  // findById, save, delete methods are inherited from BaseRepositoryInterface

  /**
   * Finds a user by their email address.
   * @param email The Email value object.
   * @returns A Result containing the User entity or null if not found, or an AppError.
   */
  findByEmail(email: Email): Promise<Result<User | null, AppError>>;

  // --- Add other necessary user-specific methods as required ---
}

/**
 * Dependency injection token for UserRepositoryInterface.
 */
export const UserRepositoryToken = Symbol('UserRepositoryInterface');
