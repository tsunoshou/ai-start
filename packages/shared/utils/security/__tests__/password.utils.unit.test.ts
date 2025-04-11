import bcrypt from 'bcrypt';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AppError } from '@core/shared/errors/app.error';
import { ErrorCode } from '@core/shared/enums/error-code.enum';

import { hashPassword, verifyPassword } from '../password.utils';

// Mock the bcrypt library
vi.mock('bcrypt', () => ({
  default: {
    // Assuming bcrypt is used as default import
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

describe('Password Utils', () => {
  const plainPassword = 'password123';
  const hashedPassword = 'hashedPasswordValue';
  const saltRounds = 10; // Match the value used in the actual utility

  // Type assertion for mocked functions
  const mockBcryptHash = bcrypt.hash as ReturnType<typeof vi.fn>;
  const mockBcryptCompare = bcrypt.compare as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should return Ok with hashed password on successful hashing', async () => {
      // Arrange
      mockBcryptHash.mockResolvedValue(hashedPassword);

      // Act
      const result = await hashPassword(plainPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, saltRounds);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(hashedPassword);
    });

    it('should return Err if password is empty', async () => {
      // Arrange
      const emptyPassword = '';

      // Act
      const result = await hashPassword(emptyPassword);

      // Assert
      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
      expect((result._unsafeUnwrapErr() as AppError).code).toBe(ErrorCode.ValidationError);
      expect(result._unsafeUnwrapErr().message).toBe('Password cannot be empty');
    });

    it('should return Err on hashing failure', async () => {
      // Arrange
      const hashingError = new Error('bcrypt hashing failed');
      mockBcryptHash.mockRejectedValue(hashingError);

      // Act
      const result = await hashPassword(plainPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, saltRounds);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
      expect((result._unsafeUnwrapErr() as AppError).code).toBe(ErrorCode.PasswordHashingFailed);
      expect((result._unsafeUnwrapErr() as AppError).cause).toBe(hashingError);
    });

    it('should wrap non-Error thrown object into Error', async () => {
      // Arrange
      const nonErrorObject = { message: 'something went wrong' };
      mockBcryptHash.mockRejectedValue(nonErrorObject);

      // Act
      const result = await hashPassword(plainPassword);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(plainPassword, saltRounds);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
      expect((result._unsafeUnwrapErr() as AppError).code).toBe(ErrorCode.PasswordHashingFailed);
      expect(result._unsafeUnwrapErr().message).toBe('Error during password hashing');
      expect((result._unsafeUnwrapErr() as AppError).cause).toBeInstanceOf(Error);
      expect(((result._unsafeUnwrapErr() as AppError).cause as Error).message).toBe(
        String(nonErrorObject)
      );
    });
  });

  describe('verifyPassword', () => {
    it('should return Ok with true on successful verification (match)', async () => {
      // Arrange
      mockBcryptCompare.mockResolvedValue(true);

      // Act
      const result = await verifyPassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(true);
    });

    it('should return Ok with false on successful verification (no match)', async () => {
      // Arrange
      mockBcryptCompare.mockResolvedValue(false);

      // Act
      const result = await verifyPassword('wrongPassword', hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', hashedPassword);
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should return Ok with false if plain password is empty', async () => {
      // Arrange

      // Act
      const result = await verifyPassword('', hashedPassword);

      // Assert
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should return Ok with false if stored hash is empty', async () => {
      // Arrange

      // Act
      const result = await verifyPassword(plainPassword, '');

      // Assert
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toBe(false);
    });

    it('should return Err on verification failure', async () => {
      // Arrange
      const verificationError = new Error('bcrypt comparison failed');
      mockBcryptCompare.mockRejectedValue(verificationError);

      // Act
      const result = await verifyPassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
      expect((result._unsafeUnwrapErr() as AppError).code).toBe(
        ErrorCode.PasswordVerificationFailed
      );
      expect((result._unsafeUnwrapErr() as AppError).cause).toBe(verificationError);
    });

    it('should wrap non-Error thrown object into Error', async () => {
      // Arrange
      const nonErrorObject = { message: 'something went wrong' };
      mockBcryptCompare.mockRejectedValue(nonErrorObject);

      // Act
      const result = await verifyPassword(plainPassword, hashedPassword);

      // Assert
      expect(bcrypt.compare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
      expect((result._unsafeUnwrapErr() as AppError).code).toBe(
        ErrorCode.PasswordVerificationFailed
      );
      expect(result._unsafeUnwrapErr().message).toBe('Error during password verification');
      expect((result._unsafeUnwrapErr() as AppError).cause).toBeInstanceOf(Error);
      expect(((result._unsafeUnwrapErr() as AppError).cause as Error).message).toBe(
        String(nonErrorObject)
      );
    });
  });
});
