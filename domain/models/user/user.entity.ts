import { Result, ok, err } from 'neverthrow';

import { BaseEntity } from '@/domain/models/base/base.entity';
import { BaseError } from '@/shared/errors/base.error';
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
 * Inherits common entity properties and behaviors from BaseEntity.
 *
 * @extends BaseEntity<UserId>
 *
 * @property {UserId} id - The unique identifier for the user (from BaseEntity).
 * @property {Email} email - The user's email address.
 * @property {UserName} name - The user's display name.
 * @property {PasswordHash} passwordHash - The hashed password for the user.
 * @property {DateTimeString} createdAt - Timestamp when the user was created (from BaseEntity).
 * @property {DateTimeString} updatedAt - Timestamp when the user was last updated (from BaseEntity).
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
export class User extends BaseEntity<UserId> {
  /**
   * User固有のプロパティ
   */
  public readonly email: Email;
  public readonly name: UserName;
  public readonly passwordHash: PasswordHash;

  /**
   * Private constructor to enforce object creation through static factory methods.
   * Calls the parent constructor of BaseEntity.
   * @param {UserId} id - User ID.
   * @param {Email} email - User email.
   * @param {UserName} name - User name.
   * @param {PasswordHash} passwordHash - Hashed password.
   * @param {DateTimeString} createdAt - Creation timestamp.
   * @param {DateTimeString} updatedAt - Last update timestamp.
   * @private
   */
  private constructor(
    id: UserId,
    email: Email,
    name: UserName,
    passwordHash: PasswordHash,
    createdAt: DateTimeStringModule.DateTimeString,
    updatedAt: DateTimeStringModule.DateTimeString
  ) {
    super(id, createdAt, updatedAt);
    this.email = email;
    this.name = name;
    this.passwordHash = passwordHash;
  }

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
   * ユーザー名を変更します。
   * 変更されたプロパティを持つ新しいUserインスタンスを返します。
   * @param {UserName} newName - 新しいユーザー名。
   * @returns {Result<User, BaseError>} 更新されたUserインスタンス、またはエラー。
   */
  public changeName(newName: UserName): Result<User, BaseError> {
    const updatedUser = new User(
      this.id,
      this.email,
      newName,
      this.passwordHash,
      this.createdAt,
      this.updatedAt
    );
    return ok(updatedUser);
  }

  /**
   * メールアドレスを変更します。
   * 変更されたプロパティを持つ新しいUserインスタンスを返します。
   * @param {Email} newEmail - 新しいメールアドレス。
   * @returns {Result<User, BaseError>} 更新されたUserインスタンス、またはエラー。
   */
  public changeEmail(newEmail: Email): Result<User, BaseError> {
    const updatedUser = new User(
      this.id,
      newEmail,
      this.name,
      this.passwordHash,
      this.createdAt,
      this.updatedAt
    );
    return ok(updatedUser);
  }

  /**
   * パスワードハッシュを更新します。
   * 変更されたプロパティを持つ新しいUserインスタンスを返します。
   * @param {PasswordHash} newPasswordHash - 新しいパスワードハッシュ。
   * @returns {Result<User, BaseError>} 更新されたUserインスタンス、またはエラー。
   */
  public changePassword(newPasswordHash: PasswordHash): Result<User, BaseError> {
    const updatedUser = new User(
      this.id,
      this.email,
      this.name,
      newPasswordHash,
      this.createdAt,
      this.updatedAt
    );
    return ok(updatedUser);
  }
}
