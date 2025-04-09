import { z } from 'zod';

/**
 * @description Zod schema for User Data Transfer Object.
 * Defines the structure and validation rules for publicly safe user information.
 * Corresponds to the UserDTO type.
 * @property {string} id - User's unique identifier (UUID v4 format).
 * @property {string} name - User's name (1-50 characters).
 * @property {string} email - User's email address (valid email format).
 * @property {string} createdAt - The date and time the user was created (ISO 8601 string).
 * @property {string} updatedAt - The date and time the user was last updated (ISO 8601 string).
 */
export const userDtoSchema = z
  .object({
    id: z.string().uuid({ message: 'User ID must be a valid UUID.' }),
    name: z
      .string()
      .min(1, 'User name cannot be empty.')
      .max(50, 'User name must be 50 characters or less.'),
    email: z.string().email({ message: 'Invalid email format.' }),
    createdAt: z.string().datetime({ message: 'Invalid ISO 8601 format for createdAt.' }),
    updatedAt: z.string().datetime({ message: 'Invalid ISO 8601 format for updatedAt.' }),
    // Note: PasswordHash is intentionally excluded.
    // Other fields like role might be added depending on requirements.
  })
  .describe('Data Transfer Object for User entity');

/**
 * @type UserDTO
 * @description Data Transfer Object for User entity, derived from userDtoSchema.
 * Contains publicly safe user information suitable for API responses or client-side usage.
 * Does not include sensitive information like password hash.
 */
export type UserDTO = z.infer<typeof userDtoSchema>;

// Note: The original interface definition is removed and replaced by the type generated from the schema.
// export interface UserDTO {
//   /** @readonly User's unique identifier (UUID string). */
//   readonly id: string;
//
//   /** @readonly User's name. */
//   readonly name: string;
//
//   /** @readonly User's email address. */
//   readonly email: string;
//
//   /** @readonly The date and time the user was created (ISO 8601 string). */
//   readonly createdAt: string;
//
//   /** @readonly The date and time the user was last updated (ISO 8601 string). */
//   readonly updatedAt: string;
//
//   // Note: PasswordHash is intentionally excluded.
//   // Other fields like role might be added depending on requirements.
// }
