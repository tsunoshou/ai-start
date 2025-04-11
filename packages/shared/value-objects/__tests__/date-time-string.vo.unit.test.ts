import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ErrorCode } from '@core/shared/enums/error-code.enum.ts';
import { ValidationError } from '@core/shared/errors/validation.error.ts';

import { DateTimeString } from '../date-time-string.vo';

describe('DateTimeString Value Object', () => {
  // Valid ISO 8601 Strings
  const validISOWithZ = '2023-10-27T10:00:00.123Z';
  const validISOWithOffset = '2023-10-27T12:00:00.456+02:00';
  const validISOWithoutMs = '2023-10-27T10:00:00Z';

  // Invalid Strings
  const invalidFormat = '2023-10-27 10:00:00';
  const invalidDate = '2023-13-01T10:00:00Z'; // Invalid month
  const invalidTime = '2023-10-27T25:00:00Z'; // Invalid hour
  const justDate = '2023-10-27';

  describe('create static method', () => {
    it('should create a DateTimeString instance for a valid ISO 8601 string with Z timezone', () => {
      const result = DateTimeString.create(validISOWithZ);
      expect(result.isOk()).toBe(true);
      const dtString = result._unsafeUnwrap();
      expect(dtString).toBeInstanceOf(DateTimeString);
      expect(dtString.value).toBe(validISOWithZ);
    });

    it('should create a DateTimeString instance for a valid ISO 8601 string with offset timezone', () => {
      const result = DateTimeString.create(validISOWithOffset);
      expect(result.isOk()).toBe(true);
      const dtString = result._unsafeUnwrap();
      expect(dtString.value).toBe(validISOWithOffset);
    });

    it('should create a DateTimeString instance for a valid ISO 8601 string without milliseconds', () => {
      const result = DateTimeString.create(validISOWithoutMs);
      expect(result.isOk()).toBe(true);
      const dtString = result._unsafeUnwrap();
      expect(dtString.value).toBe(validISOWithoutMs);
    });

    it.each([
      [invalidFormat, 'invalid format'],
      [invalidDate, 'invalid date components'],
      [invalidTime, 'invalid time components'],
      // [noTimezone, 'missing timezone offset'], // Zod's .datetime() might allow this depending on config
      [justDate, 'date only'],
      ['', 'empty string'],
    ])(
      'should return a ValidationError for an invalid string format: %s (%s)',
      (invalidValue, _description) => {
        const result = DateTimeString.create(invalidValue);
        expect(result.isErr()).toBe(true);
        const error = result._unsafeUnwrapErr();
        expect(error).toBeInstanceOf(ValidationError);
        expect(error.code).toBe(ErrorCode.ValidationError);
        expect(error.message).toContain('Invalid ISO 8601 DateTime format');
      }
    );

    it('should return a ValidationError for non-string input', () => {
      const result = DateTimeString.create(12345); // Pass a number
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.code).toBe(ErrorCode.ValidationError);
      // Expect Zod's actual message for wrong type
      expect(error.message).toContain('Expected string, received number');
    });

    it('should return a ValidationError for null', () => {
      const result = DateTimeString.create(null);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      // Expect Zod's actual message for null
      expect(error.message).toContain('Expected string, received null');
    });

    it('should return a ValidationError for undefined', () => {
      const result = DateTimeString.create(undefined);
      expect(result.isErr()).toBe(true);
      const error = result._unsafeUnwrapErr();
      expect(error).toBeInstanceOf(ValidationError);
      // Expect Zod's actual message for undefined (usually 'Required')
      expect(error.message).toContain('Required');
    });
  });

  describe('now static method', () => {
    const fixedDate = new Date('2024-01-01T10:00:00.000Z');
    const fixedISOString = fixedDate.toISOString();

    beforeEach(() => {
      // Use fake timers and set the system time
      vi.useFakeTimers();
      vi.setSystemTime(fixedDate);
    });

    afterEach(() => {
      // Restore real timers
      vi.useRealTimers();
    });

    it('should create a DateTimeString instance with the current time in ISO 8601 format', () => {
      // DateTimeString.now() calls `new Date()`, which now respects the fake timer
      const dtString = DateTimeString.now();
      expect(dtString).toBeInstanceOf(DateTimeString);
      expect(dtString.value).toBe(fixedISOString);
    });
  });

  describe('toDate method', () => {
    it('should return a Date object corresponding to the stored string value', () => {
      const result = DateTimeString.create(validISOWithZ);
      const dtString = result._unsafeUnwrap();
      const dateObject = dtString.toDate();
      expect(dateObject).toBeInstanceOf(Date);
      expect(dateObject.toISOString()).toBe(validISOWithZ);
    });
  });

  describe('equals method (inherited)', () => {
    const dtString1Result = DateTimeString.create(validISOWithZ);
    const dtString1AgainResult = DateTimeString.create(validISOWithZ);
    const dtString2Result = DateTimeString.create(validISOWithOffset);

    const dtString1 = dtString1Result._unsafeUnwrap();
    const dtString1Again = dtString1AgainResult._unsafeUnwrap();
    const dtString2 = dtString2Result._unsafeUnwrap();

    it('should return true for the same DateTimeString instance', () => {
      expect(dtString1.equals(dtString1)).toBe(true);
    });

    it('should return true for different instances with the same string value', () => {
      expect(dtString1.equals(dtString1Again)).toBe(true);
    });

    it('should return false for different instances with different string values', () => {
      // Note: '2023-10-27T10:00:00.123Z' and '2023-10-27T12:00:00.456+02:00' represent different moments
      expect(dtString1.equals(dtString2)).toBe(false);
    });

    it('should return false when comparing with null', () => {
      expect(dtString1.equals(null)).toBe(false);
    });

    it('should return false when comparing with undefined', () => {
      expect(dtString1.equals(undefined)).toBe(false);
    });
  });

  describe('compare method', () => {
    const pastResult = DateTimeString.create('2023-01-01T00:00:00Z');
    const presentResult = DateTimeString.create('2024-01-01T00:00:00Z');
    const futureResult = DateTimeString.create('2025-01-01T00:00:00Z');
    const presentAgainResult = DateTimeString.create('2024-01-01T00:00:00Z');

    const past = pastResult._unsafeUnwrap();
    const present = presentResult._unsafeUnwrap();
    const future = futureResult._unsafeUnwrap();
    const presentAgain = presentAgainResult._unsafeUnwrap();

    it('should return a negative number if the instance is earlier than the other', () => {
      expect(past.compare(present)).toBeLessThan(0);
    });

    it('should return a positive number if the instance is later than the other', () => {
      expect(future.compare(present)).toBeGreaterThan(0);
    });

    it('should return 0 if the instances represent the same moment', () => {
      expect(present.compare(presentAgain)).toBe(0);
    });

    // Test comparison with offset timezones
    it('should correctly compare times with different timezone offsets', () => {
      const utcTimeResult = DateTimeString.create('2024-01-01T12:00:00Z');
      const cetTimeResult = DateTimeString.create('2024-01-01T13:00:00+01:00'); // Same moment as UTC
      const estTimeResult = DateTimeString.create('2024-01-01T07:00:00-05:00'); // Same moment as UTC

      const utcTime = utcTimeResult._unsafeUnwrap();
      const cetTime = cetTimeResult._unsafeUnwrap();
      const estTime = estTimeResult._unsafeUnwrap();

      expect(utcTime.compare(cetTime)).toBe(0);
      expect(utcTime.compare(estTime)).toBe(0);
      expect(cetTime.compare(estTime)).toBe(0);

      const laterCetResult = DateTimeString.create('2024-01-01T14:00:00+01:00'); // One hour later
      const laterCet = laterCetResult._unsafeUnwrap();
      expect(utcTime.compare(laterCet)).toBeLessThan(0);
    });
  });
});
