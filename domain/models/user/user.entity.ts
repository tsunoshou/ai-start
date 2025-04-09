import { Result, ok, err } from 'neverthrow';

import { BaseError } from '@/shared/errors/base.error';
import { EntityBase } from '@/shared/types/entity-base.interface';
import * as DateTimeStringModule from '@/shared/value-objects/date-time-string.vo';
import { Email } from '@/shared/value-objects/email.vo';
import { PasswordHash } from '@/shared/value-objects/password-hash.vo';

import { UserId } from './user-id.vo';
import { UserName } from './user-name.vo';

/**
 * @class User
 * @description Represents a user entity within the system.
 * Contains user identification, credentials, and metadata.
 * Ensures immutability through private readonly properties and controlled creation via static factory method.
 *
 * @property {UserId} id - The unique identifier for the user.
 * @property {Email} email - The user's email address.
 * @property {UserName} name - The user's display name.
 * @property {PasswordHash} passwordHash - The hashed password for the user.
 * @property {DateTimeString} createdAt - Timestamp when the user was created.
 * @property {DateTimeString} updatedAt - Timestamp when the user was last updated.
 *
 * @example
 * // Example of creating a new user
 * const newUserResult = User.create({
 *   email: Email.create('test@example.com')._unsafeUnwrap(),
 *   name: UserName.create('Test User')._unsafeUnwrap(),
 *   passwordHash: PasswordHash.create('hashedPassword123')._unsafeUnwrap()
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
 *   name: UserName.create('Existing User')._unsafeUnwrap(),
 *   passwordHash: PasswordHash.create('existingHashedPassword')._unsafeUnwrap(),
 *   createdAt: DateTimeString.create('2023-01-01T00:00:00.000Z')._unsafeUnwrap(),
 *   updatedAt: DateTimeString.create('2023-01-10T12:00:00.000Z')._unsafeUnwrap(),
 * });
 */
export class User implements EntityBase<UserId> {
  /**
   * Private constructor to enforce object creation through static factory methods.
   * @param {UserId} id - User ID.
   * @param {Email} email - User email.
   * @param {UserName} name - User name.
   * @param {PasswordHash} passwordHash - Hashed password.
   * @param {DateTimeString} createdAt - Creation timestamp.
   * @param {DateTimeString} updatedAt - Last update timestamp.
   * @private
   */
  private constructor(
    public readonly id: UserId,
    public readonly email: Email,
    public readonly name: UserName,
    public readonly passwordHash: PasswordHash,
    public readonly createdAt: DateTimeStringModule.DateTimeString,
    public readonly updatedAt: DateTimeStringModule.DateTimeString
  ) {}

  /**
   * Creates a new User instance.
   * Generates a new UUID for the user ID and sets creation/update timestamps.
   * Performs basic validation (e.g., non-empty name).
   * @param {object} props - Properties for the new user.
   * @param {Email} props.email - User's email address.
   * @param {UserName} props.name - User's name.
   * @param {PasswordHash} props.passwordHash - User's hashed password.
   * @returns {Result<User, BaseError>} A Result containing the new User instance or an Error.
   */
  public static create(props: {
    email: Email;
    name: UserName;
    passwordHash: PasswordHash;
  }): Result<User, BaseError> {
    const now = DateTimeStringModule.DateTimeString.now();
    const userIdResult = UserId.generate();
    if (userIdResult.isErr()) {
      return err(userIdResult.error);
    }

    const user = new User(
      userIdResult.value,
      props.email,
      props.name,
      props.passwordHash,
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
   * @param {UserName} props.name - Existing user name.
   * @param {PasswordHash} props.passwordHash - Existing hashed password.
   * @param {DateTimeString} props.createdAt - Existing creation timestamp.
   * @param {DateTimeString} props.updatedAt - Existing update timestamp.
   * @returns {User} The reconstructed User instance.
   */
  public static reconstruct(props: {
    id: UserId;
    email: Email;
    name: UserName;
    passwordHash: PasswordHash;
    createdAt: DateTimeStringModule.DateTimeString;
    updatedAt: DateTimeStringModule.DateTimeString;
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
   * @param {User | null | undefined} other - The other User entity to compare against.
   *   Should accept any EntityBase with the same ID type, plus null/undefined.
   * @returns {boolean} True if the entities have the same ID, false otherwise.
   */
  public equals(other: EntityBase<UserId> | null | undefined): boolean {
    if (other === null || other === undefined) {
      return false;
    }
    if (!(other instanceof User)) {
      return false;
    }
    return this.id.equals(other.id);
  }

  // --- Potential future methods ---
  // public changeEmail(newEmail: Email): Result<User, Error> { ... }
  // public changePassword(newPasswordHash: PasswordHash): Result<User, Error> { ... }
  // public updateProfile(props: { name?: UserName }): Result<User, Error> { ... }
}
