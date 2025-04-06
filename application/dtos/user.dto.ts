/**
 * @interface UserDTO
 * @description Data Transfer Object for User entity.
 * Contains publicly safe user information suitable for API responses or client-side usage.
 * Does not include sensitive information like password hash.
 */
export interface UserDTO {
  /** @readonly User's unique identifier (UUID string). */
  readonly id: string;

  /** @readonly User's name. */
  readonly name: string;

  /** @readonly User's email address. */
  readonly email: string;

  /** @readonly The date and time the user was created (ISO 8601 string). */
  readonly createdAt: string;

  /** @readonly The date and time the user was last updated (ISO 8601 string). */
  readonly updatedAt: string;

  // Note: PasswordHash is intentionally excluded.
  // Other fields like role might be added depending on requirements.
}
