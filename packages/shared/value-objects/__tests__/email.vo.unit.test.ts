import { describe, it, expect } from 'vitest';

import { Email } from '../email.vo'; // Adjust the import path as necessary

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create an Email instance for a valid email string', () => {
      const validEmail = 'test@example.com';
      const result = Email.create(validEmail);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().value).toBe(validEmail);
    });

    it('should trim whitespace from the email string', () => {
      const emailWithSpaces = '  test@example.com  ';
      const trimmedEmail = 'test@example.com';
      const result = Email.create(emailWithSpaces);

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap().value).toBe(trimmedEmail);
    });

    // Test cases for invalid email formats
    const invalidEmails: [string, string][] = [
      ['', 'empty string'],
      ['test', 'string without @'],
      ['test@', 'string without domain'],
      ['@example.com', 'string without local part'],
      ['test@example', 'string without top-level domain'],
      ['test@.com', 'string with invalid domain part'],
      ['test @example.com', 'string with space'],
      ['test..test@example.com', 'string with consecutive dots'],
      ['test@example..com', 'string with consecutive dots in domain'],
    ];

    invalidEmails.forEach(([invalidValue, description]) => {
      it(`should return an error for an invalid email (${description})`, () => {
        const result = Email.create(invalidValue);
        expect(result.isErr()).toBe(true);
        // Optionally check the error message if it's consistent
        // expect(result._unsafeUnwrapErr().message).toContain('Invalid email format');
      });
    });

    it('should return an error if input is not a string', () => {
      // Test with non-string inputs (like null, undefined, number)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultNull = Email.create(null as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultUndefined = Email.create(undefined as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const resultNumber = Email.create(123 as any);

      expect(resultNull.isErr()).toBe(true);
      expect(resultUndefined.isErr()).toBe(true);
      expect(resultNumber.isErr()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for Email instances with the same value', () => {
      const email1Result = Email.create('test@example.com');
      const email2Result = Email.create('test@example.com');

      // Ensure creation was successful before comparing
      expect(email1Result.isOk()).toBe(true);
      expect(email2Result.isOk()).toBe(true);

      const email1 = email1Result._unsafeUnwrap();
      const email2 = email2Result._unsafeUnwrap();

      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for Email instances with different values', () => {
      const email1Result = Email.create('test1@example.com');
      const email2Result = Email.create('test2@example.com');

      expect(email1Result.isOk()).toBe(true);
      expect(email2Result.isOk()).toBe(true);

      const email1 = email1Result._unsafeUnwrap();
      const email2 = email2Result._unsafeUnwrap();

      expect(email1.equals(email2)).toBe(false);
    });

    it('should return false when comparing with null or undefined', () => {
      const emailResult = Email.create('test@example.com');
      expect(emailResult.isOk()).toBe(true);
      const email1 = emailResult._unsafeUnwrap();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(email1.equals(null as any)).toBe(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(email1.equals(undefined as any)).toBe(false);
    });
  });

  // Test the getter
  describe('value getter', () => {
    it('should return the underlying email string', () => {
      const emailString = 'getter@example.com';
      const emailResult = Email.create(emailString);
      expect(emailResult.isOk()).toBe(true);
      const email = emailResult._unsafeUnwrap();

      expect(email.value).toBe(emailString);
    });
  });
});
