import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { DateTimeString } from '../date-time-string.vo';

describe('DateTimeString Value Object', () => {
  const validISOString = '2023-10-27T10:00:00.000Z';
  const validISOStringWithOffset = '2024-01-01T09:00:00+09:00';
  const validISOStringWithMillis = '2025-04-05T12:34:56.789Z';

  describe('create', () => {
    it('should create an instance for a valid ISO 8601 string (Z)', () => {
      const result = DateTimeString.create(validISOString);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(DateTimeString);
        expect(result.value.value).toBe(validISOString);
      }
    });

    it('should create an instance for a valid ISO 8601 string with offset', () => {
      const result = DateTimeString.create(validISOStringWithOffset);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validISOStringWithOffset);
      }
    });

    it('should create an instance for a valid ISO 8601 string with milliseconds', () => {
      const result = DateTimeString.create(validISOStringWithMillis);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validISOStringWithMillis);
      }
    });

    it('should trim whitespace from input string', () => {
      const stringWithWhitespace = `  ${validISOString}  `;
      const result = DateTimeString.create(stringWithWhitespace);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validISOString);
      }
    });

    it.each([
      ['', 'empty string'],
      ['invalid-date', 'invalid format'],
      ['2023-13-01T10:00:00Z', 'invalid month'],
      ['2023-10-32T10:00:00Z', 'invalid day'],
      ['2023-10-27T25:00:00Z', 'invalid hour'],
      ['2023-10-27T10:60:00Z', 'invalid minute'],
      ['2023-10-27T10:00:60Z', 'invalid second'],
      ['2023-10-27 10:00:00', 'missing T'],
      ['2023/10/27T10:00:00Z', 'wrong separators'],
      ['2023-10-27T10:00:00X', 'invalid timezone specifier'],
      ['2024-01-01T09:00:00+99:00', 'invalid offset'],
      [[], 'array'],
      [1234567890, 'number'],
    ])('should return error for invalid input: %s (%s)', (invalidInput, _description) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = DateTimeString.create(invalidInput as any);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(Error);
        if (typeof invalidInput === 'string') {
          expect(result.error.message).toContain('Invalid ISO 8601 DateTime format');
        } else {
          expect(result.error.message).toBe('Input must be a string.');
        }
      }
    });
  });

  describe('now', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      vi.useFakeTimers();
      vi.setSystemTime(new Date(validISOString));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should create an instance representing the current time', () => {
      const dtNow = DateTimeString.now();
      expect(dtNow).toBeInstanceOf(DateTimeString);
      // Check against the mocked time
      expect(dtNow.value).toBe(validISOString);
    });

    it('should return a value that can be parsed back to the mocked Date', () => {
      const dtNow = DateTimeString.now();
      const dateFromVo = dtNow.toDate();
      expect(dateFromVo.toISOString()).toBe(validISOString);
    });
  });

  describe('value getter', () => {
    it('should return the original valid ISO string', () => {
      const result = DateTimeString.create(validISOString);
      if (result.isOk()) {
        expect(result.value.value).toBe(validISOString);
      }
    });
  });

  describe('toDate', () => {
    it('should convert the value object back to an equivalent Date object', () => {
      const result = DateTimeString.create(validISOString);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dateObject = result.value.toDate();
        expect(dateObject).toBeInstanceOf(Date);
        expect(dateObject.toISOString()).toBe(validISOString);
      }
    });

    it('should handle strings with offset correctly', () => {
      const result = DateTimeString.create(validISOStringWithOffset);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const dateObject = result.value.toDate();
        // Compare timestamps as toISOString() might convert to UTC
        expect(dateObject.getTime()).toBe(new Date(validISOStringWithOffset).getTime());
      }
    });
  });

  describe('equals', () => {
    const dt1Result = DateTimeString.create(validISOString);
    const dt2Result = DateTimeString.create(validISOString);
    const dt3Result = DateTimeString.create(validISOStringWithMillis); // Different string

    it('should return true for instances with the same value', () => {
      if (dt1Result.isOk() && dt2Result.isOk()) {
        expect(dt1Result.value.equals(dt2Result.value)).toBe(true);
      }
    });

    it('should return false for instances with different values', () => {
      if (dt1Result.isOk() && dt3Result.isOk()) {
        expect(dt1Result.value.equals(dt3Result.value)).toBe(false);
      }
    });
  });

  describe('compare', () => {
    const earlierStr = '2023-01-01T00:00:00Z';
    const laterStr = '2023-01-01T00:00:01Z';
    const sameStr = '2023-01-01T00:00:00Z';

    const earlierResult = DateTimeString.create(earlierStr);
    const laterResult = DateTimeString.create(laterStr);
    const sameResult = DateTimeString.create(sameStr);

    it('should return a negative value if this instance is earlier', () => {
      if (earlierResult.isOk() && laterResult.isOk()) {
        expect(earlierResult.value.compare(laterResult.value)).toBeLessThan(0);
      }
    });

    it('should return a positive value if this instance is later', () => {
      if (laterResult.isOk() && earlierResult.isOk()) {
        expect(laterResult.value.compare(earlierResult.value)).toBeGreaterThan(0);
      }
    });

    it('should return 0 if instances represent the same time', () => {
      if (earlierResult.isOk() && sameResult.isOk()) {
        expect(earlierResult.value.compare(sameResult.value)).toBe(0);
      }
    });
  });
});
