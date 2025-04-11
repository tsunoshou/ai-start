import { describe, it, expect, beforeEach } from 'vitest';

import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { BaseError } from '@core/shared/errors/base.error';

import { UserName } from '../user-name.vo';

describe('UserName Value Object', () => {
  describe('create', () => {
    it('should create a UserName instance for valid names', () => {
      const validName = 'John Doe';
      const result = UserName.create(validName);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validName);
      }
    });

    it('should trim whitespace and create a UserName instance', () => {
      const nameWithWhitespace = '  Jane Smith  ';
      const trimmedName = 'Jane Smith';
      const result = UserName.create(nameWithWhitespace);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(trimmedName);
      }
    });

    it('should create a UserName instance for minimum length name (1 char)', () => {
      const minLengthName = 'A';
      const result = UserName.create(minLengthName);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(minLengthName);
      }
    });

    it('should create a UserName instance for maximum length name (50 chars)', () => {
      const maxLengthName = 'a'.repeat(50);
      const result = UserName.create(maxLengthName);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(maxLengthName);
      }
    });

    it('should return error for empty string name', () => {
      const result = UserName.create('');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.ValidationError);
      }
    });

    it('should return error for name consisting only of whitespace', () => {
      const result = UserName.create('   ');
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.ValidationError);
      }
    });

    it('should return error for name longer than 50 characters', () => {
      const longName = 'a'.repeat(51);
      const result = UserName.create(longName);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.ValidationError);
      }
    });

    it.each([
      [null, 'null'],
      [undefined, 'undefined'],
      [123, 'number'],
      [{}, 'object'],
      [[], 'array'],
    ])('should return error for non-string input type (%s)', (invalidInput, _description) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = UserName.create(invalidInput as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.ValidationError);
      }
    });
  });

  describe('equals', () => {
    const name1Result = UserName.create('Test Name');
    const name2Result = UserName.create('Test Name');
    const name3Result = UserName.create('Different Name');

    const name1 = name1Result.isOk() ? name1Result.value : null;
    const name2 = name2Result.isOk() ? name2Result.value : null;
    const name3 = name3Result.isOk() ? name3Result.value : null;

    beforeEach(() => {
      if (!name1 || !name2 || !name3) {
        throw new Error('Test setup failed: Could not create UserName instances for equals tests');
      }
    });
    it('should return true for instances with the same value', () => {
      expect(name1!.equals(name2!)).toBe(true);
    });

    it('should return false for instances with different values', () => {
      expect(name1!.equals(name3!)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(name1!.equals(null as any)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(name1!.equals(undefined as any)).toBe(false);
    });
  });

  describe('value getter', () => {
    it('should return the correct trimmed value', () => {
      const nameWithSpace = '  Value Test  ';
      const expectedValue = 'Value Test';
      const result = UserName.create(nameWithSpace);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(expectedValue);
      }
    });
  });
});
