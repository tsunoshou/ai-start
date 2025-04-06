import { ok, err } from 'neverthrow';
import { describe, it, expect } from 'vitest';

import { BaseError } from '@/shared/errors/base.error';
import { ErrorCode } from '@/shared/errors/error-code.enum';

import { UserName } from '../user-name.vo';

describe('UserName Value Object', () => {
  describe('create', () => {
    it('should create a UserName instance for valid names', () => {
      const validName = 'John Doe';
      const result = UserName.create(validName);
      expect(result.isOk()).toBe(true);
      expect((result as ok<UserName, BaseError>).value.value).toBe(validName);
    });

    it('should trim whitespace and create a UserName instance', () => {
      const nameWithWhitespace = '  Jane Smith  ';
      const trimmedName = 'Jane Smith';
      const result = UserName.create(nameWithWhitespace);
      expect(result.isOk()).toBe(true);
      expect((result as ok<UserName, BaseError>).value.value).toBe(trimmedName);
    });

    it('should create a UserName instance for minimum length name (1 char)', () => {
      const minLengthName = 'A';
      const result = UserName.create(minLengthName);
      expect(result.isOk()).toBe(true);
      expect((result as ok<UserName, BaseError>).value.value).toBe(minLengthName);
    });

    it('should create a UserName instance for maximum length name (50 chars)', () => {
      const maxLengthName = 'a'.repeat(50);
      const result = UserName.create(maxLengthName);
      expect(result.isOk()).toBe(true);
      expect((result as ok<UserName, BaseError>).value.value).toBe(maxLengthName);
    });

    it('should return error for empty string name', () => {
      const result = UserName.create('');
      expect(result.isErr()).toBe(true);
      expect((result as err<UserName, BaseError>).error).toBeInstanceOf(BaseError);
      expect((result as err<UserName, BaseError>).error.code).toBe(ErrorCode.ValidationError);
    });

    it('should return error for name consisting only of whitespace', () => {
      const result = UserName.create('   ');
      expect(result.isErr()).toBe(true);
      expect((result as err<UserName, BaseError>).error).toBeInstanceOf(BaseError);
      expect((result as err<UserName, BaseError>).error.code).toBe(ErrorCode.ValidationError);
    });

    it('should return error for name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = UserName.create(longName);
      expect(result.isErr()).toBe(true);
      expect((result as err<UserName, BaseError>).error).toBeInstanceOf(BaseError);
      expect((result as err<UserName, BaseError>).error.code).toBe(ErrorCode.ValidationError);
    });

    it.each([
      [null, 'null'],
      [undefined, 'undefined'],
      [123, 'number'],
      [{}, 'object'],
      [[], 'array'],
    ])('should return error for non-string input type (%s)', (invalidInput) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = UserName.create(invalidInput as any);
      expect(result.isErr()).toBe(true);
      expect((result as err<UserName, BaseError>).error).toBeInstanceOf(BaseError);
      expect((result as err<UserName, BaseError>).error.code).toBe(ErrorCode.ValidationError);
    });
  });

  describe('equals', () => {
    const name1Result = UserName.create('Test Name');
    const name2Result = UserName.create('Test Name');
    const name3Result = UserName.create('Different Name');

    const name1 = name1Result.isOk() ? name1Result.value : null;
    const name2 = name2Result.isOk() ? name2Result.value : null;
    const name3 = name3Result.isOk() ? name3Result.value : null;

    it('should return true for instances with the same value', () => {
      expect(name1).not.toBeNull();
      expect(name2).not.toBeNull();
      if (name1 && name2) {
        expect(name1.equals(name2)).toBe(true);
      }
    });

    it('should return false for instances with different values', () => {
      expect(name1).not.toBeNull();
      expect(name3).not.toBeNull();
      if (name1 && name3) {
        expect(name1.equals(name3)).toBe(false);
      }
    });

    it('should return false when comparing with null', () => {
      expect(name1).not.toBeNull();
      if (name1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(name1.equals(null as any)).toBe(false);
      }
    });

    it('should return false when comparing with undefined', () => {
      expect(name1).not.toBeNull();
      if (name1) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(name1.equals(undefined as any)).toBe(false);
      }
    });
  });

  describe('value getter', () => {
    it('should return the correct trimmed value', () => {
      const nameWithSpace = '  Value Test  ';
      const expectedValue = 'Value Test';
      const result = UserName.create(nameWithSpace);
      expect(result.isOk()).toBe(true);
      expect((result as ok<UserName, BaseError>).value.value).toBe(expectedValue);
    });
  });
});
