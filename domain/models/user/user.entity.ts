import { Result, ok, err } from 'neverthrow';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';
import { EntityBase } from '@/shared/types/entity-base.interface';
import { DateTimeString } from '@/shared/value-objects/date-time-string.vo';
import { Email } from '@/shared/value-objects/email.vo';

import { UserId } from './user-id.vo';

/**
 * @class User
 * @description Represents a user entity within the system.
 * Contains user identification, credentials, and metadata.
 * Ensures immutability through private readonly properties and controlled creation via static factory method.
 *
 * @property {UserId} id - The unique identifier for the user.
 * @property {Email} email - The user's email address.
 * @property {string} name - The user's display name.
 * @property {string} passwordHash - The hashed password for the user.
 * @property {DateTimeString} createdAt - Timestamp when the user was created.
 * @property {DateTimeString} updatedAt - Timestamp when the user was last updated.
 *
 * @example
 * // Example of creating a new user
 * const newUserResult = User.create({
 *   email: Email.create('test@example.com')._unsafeUnwrap(),
 *   name: 'Test User',
 *   passwordHash: 'hashedPassword123'
 * });
 * if (newUserResult.isOk()) {
 *   const user = newUserResult.value;
 *   console.log(user.id.value);
 * } else {
 *  console.error(newUserResult.error);
 * }
 *
 * @example
 * // Example of reconstructing a user from data
 * const existingUserResult = User.reconstruct({
 *   id: UserId.create('existing-uuid-string')._unsafeUnwrap(),
 *   email: Email.create('existing@example.com')._unsafeUnwrap(),
 *   name: 'Existing User',
 *   passwordHash: 'existingHashedPassword',
 *   createdAt: DateTimeString.create('2023-01-01T00:00:00.000Z')._unsafeUnwrap(),
 *   updatedAt: DateTimeString.create('2023-01-10T12:00:00.000Z')._unsafeUnwrap(),
 * });
 */
export class User implements EntityBase {
  /**
   * Private constructor to enforce object creation through static factory methods.
   * @param {UserId} id - User ID.
   * @param {Email} email - User email.
   * @param {string} name - User name.
   * @param {string} passwordHash - Hashed password.
   * @param {DateTimeString} createdAt - Creation timestamp.
   * @param {DateTimeString} updatedAt - Last update timestamp.
   * @private
   */
  private constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly name: string,
    public readonly passwordHash: string,
    public readonly createdAt: DateTimeString,
    public readonly updatedAt: DateTimeString
  ) {}

  /**
   * Creates a new User instance.
   * Generates a new UUID for the user ID and sets creation/update timestamps.
   * Performs basic validation (e.g., non-empty name).
   * @param {object} props - Properties for the new user.
   * @param {Email} props.email - User's email address.
   * @param {string} props.name - User's name. Must not be empty.
   * @param {string} props.passwordHash - User's hashed password. Must not be empty.
   * @returns {Result<User, Error>} A Result containing the new User instance or an Error.
   */
  public static create(props: {
    email: Email;
    name: string;
    passwordHash: string;
  }): Result<User, BaseError> {
    if (!props.name || props.name.trim().length === 0) {
      return err(new BaseError(ErrorCode.ValidationError, 'User name cannot be empty.'));
    }
    if (!props.passwordHash || props.passwordHash.trim().length === 0) {
      // In a real scenario, password hash validation might be more complex
      return err(new BaseError(ErrorCode.ValidationError, 'Password hash cannot be empty.'));
    }

    const now = DateTimeString.now();
    const userIdResult = UserId.generate();
    if (userIdResult.isErr()) {
      // This should theoretically not happen if generateUUID is correct
      return err(userIdResult.error);
    }

    const user = new User(
      userIdResult.value,
      props.email,
      props.name.trim(),
      props.passwordHash, // Assuming hash is already computed and valid
      now,
      now
    );
    return ok(user);
  }

  /**
   * Reconstructs an existing User instance from data (e.g., from a database).
   * Assumes data is valid as it comes from a trusted source.
   * @param {object} props - Properties for reconstructing the user.
   * @param {UserId} props.id - Existing user ID.
   * @param {Email} props.email - Existing user email.
   * @param {string} props.name - Existing user name.
   * @param {string} props.passwordHash - Existing hashed password.
   * @param {DateTimeString} props.createdAt - Existing creation timestamp.
   * @param {DateTimeString} props.updatedAt - Existing update timestamp.
   * @returns {User} The reconstructed User instance.
   */
  public static reconstruct(props: {
    id: UserId;
    email: Email;
    name: string;
    passwordHash: string;
    createdAt: DateTimeString;
    updatedAt: DateTimeString;
  }): User {
    return new User(
      props.id,
      props.email,
      props.name,
      props.passwordHash,
      props.createdAt,
      props.updatedAt
    );
  }

  /**
   * Checks if this User entity is equal to another User entity based on their IDs.
   * @param {User} other - The other User entity to compare against.
   * @returns {boolean} True if the entities have the same ID, false otherwise.
   */
  public equals(other: User): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    return this.id.equals(other.id);
  }

  // --- Potential future methods ---
  // public changeEmail(newEmail: Email): Result<User, Error> { ... }
  // public changePassword(newPasswordHash: string): Result<User, Error> { ... }
  // public updateProfile(props: { name?: string }): Result<User, Error> { ... }
}
