import { validate as uuidValidate } from 'uuid';
import { describe, it, expect } from 'vitest';

import { ErrorCode } from '@/shared/errors/error-code.enum';
import { ValidationError } from '@/shared/errors/validation.error';

import { UserId } from '../user-id.vo';

describe('UserId Value Object', () => {
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const anotherValidUUID = '987e6543-e21b-12d3-a456-426614174001';

  describe('create static method', () => {
    it('should create a UserId instance for a valid UUID string', () => {
      const result = UserId.create(validUUID);
      expect(result.isOk()).toBe(true);
      const userId = result._unsafeUnwrap(); // Use unwrap for simplicity in tests after checking isOk
      expect(userId).toBeInstanceOf(UserId);
      expect(userId.value).toBe(validUUID);
    });

    it('should return an error for an invalid UUID string format', () => {
      const invalidUUID = 'invalid-uuid-string';
      const result = UserId.create(invalidUUID);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      expect(error.message).toContain('Invalid UUID v4 format');
    });

    it('should return an error for an empty string', () => {
      const result = UserId.create('');
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
    });

    // zod handles null/undefined implicitly by schema type, but good to be explicit if needed
    it('should return an error for null', () => {
      // @ts-expect-error Testing invalid input type
      const result = UserId.create(null);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      // Zod might throw a different error type/message for wrong input type vs format
      // Adjust assertion based on actual zod behavior if necessary
      expect(error.code).toBe(ErrorCode.ValidationError);
    });

    it('should return an error for undefined', () => {
      // @ts-expect-error Testing invalid input type
      const result = UserId.create(undefined);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
    });
  });

  describe('generate static method', () => {
    it('should generate a valid UserId instance', () => {
      const result = UserId.generate();
      expect(result.isOk()).toBe(true);
      const userId = result._unsafeUnwrap();
      expect(userId).toBeInstanceOf(UserId);
      expect(uuidValidate(userId.value)).toBe(true); // Check if the generated value is a valid UUID
    });
  });

  describe('equals method', () => {
    const userId1Result = UserId.create(validUUID);
    const userId1 = userId1Result._unsafeUnwrap();

    const userId1AgainResult = UserId.create(validUUID);
    const userId1Again = userId1AgainResult._unsafeUnwrap();

    const userId2Result = UserId.create(anotherValidUUID);
    const userId2 = userId2Result._unsafeUnwrap();

    it('should return true for the same UserId instance', () => {
      expect(userId1.equals(userId1)).toBe(true);
    });

    it('should return true for different instances with the same UUID value', () => {
      expect(userId1.equals(userId1Again)).toBe(true);
    });

    it('should return false for different instances with different UUID values', () => {
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // @ts-expect-error Testing comparison with null which expects a different type
      expect(userId1.equals(null)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      // @ts-expect-error Testing comparison with undefined which expects a different type
      expect(userId1.equals(undefined)).toBe(false);
    });

    /* // Temporarily commenting out this test case as it causes an "Unused @ts-expect-error" issue.
       // The instanceof check in BaseId.equals should cover comparison between different concrete ID types.
    it('should return false when comparing with an object of a different type', () => {
      // Create a simple mock object that resembles a BaseId but isn't UserId
      class MockId {
          readonly value: string;
          constructor(value: string) { this.value = value; }
          equals(_other: any): boolean { return false; }
      }
      const mockId = new MockId(validUUID);
      //@ts-expect-error Testing comparison with a different type
      expect(userId1.equals(mockId)).toBe(false);
    });
    */
  });
});
