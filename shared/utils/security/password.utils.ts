import bcrypt from 'bcrypt';
import { Result, ok, err } from 'neverthrow';

// ソルトラウンド数（推奨値は10-12程度、CPU負荷とのトレードオフ）
const SALT_ROUNDS = 10;

/**
 * @function hashPassword
 * @description Hashes a plain text password using bcrypt.
 * @param {string} plainTextPassword The plain text password to hash.
 * @returns {Promise<Result<string, Error>>} A Result containing the hashed password or an Error.
 */
export async function hashPassword(plainTextPassword: string): Promise<Result<string, Error>> {
  try {
    if (!plainTextPassword) {
      return err(new Error('Password cannot be empty'));
    }
    const hashedPassword = await bcrypt.hash(plainTextPassword, SALT_ROUNDS);
    return ok(hashedPassword);
  } catch (error) {
    console.error('[PasswordUtils] Error hashing password:', error);
    return err(error instanceof Error ? error : new Error('Unknown error during password hashing'));
  }
}

/**
 * @function verifyPassword
 * @description Verifies a plain text password against a stored hash.
 * @param {string} plainTextPassword The plain text password to verify.
 * @param {string} storedHash The stored password hash.
 * @returns {Promise<Result<boolean, Error>>} A Result containing true if the password matches, false otherwise, or an Error.
 */
export async function verifyPassword(
  plainTextPassword: string,
  storedHash: string
): Promise<Result<boolean, Error>> {
  try {
    if (!plainTextPassword || !storedHash) {
      // Avoid comparing empty strings which might lead to unexpected results with some libraries
      return ok(false);
    }
    const match = await bcrypt.compare(plainTextPassword, storedHash);
    return ok(match);
  } catch (error) {
    console.error('[PasswordUtils] Error verifying password:', error);
    // bcrypt.compare can throw errors for malformed hashes etc.
    return err(
      error instanceof Error ? error : new Error('Unknown error during password verification')
    );
  }
}
