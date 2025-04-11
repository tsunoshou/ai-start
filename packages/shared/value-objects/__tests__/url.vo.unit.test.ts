import { describe, it, expect } from 'vitest';

import { Url } from '../url.vo';

describe('Url Value Object', () => {
  const validHttpUrl = 'http://example.com';
  const validHttpsUrl =
    'https://sub.example.co.uk:8080/path/to/resource?query=value&another=true#fragment';
  const urlWithSpace = `  ${validHttpsUrl}  `;

  describe('create', () => {
    it('should create a Url instance for a valid HTTP URL', () => {
      const result = Url.create(validHttpUrl);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeInstanceOf(Url);
        expect(result.value.value).toBe(validHttpUrl);
      }
    });

    it('should create a Url instance for a valid HTTPS URL with details', () => {
      const result = Url.create(validHttpsUrl);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validHttpsUrl);
      }
    });

    it('should trim whitespace from input URL string', () => {
      const result = Url.create(urlWithSpace);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.value).toBe(validHttpsUrl);
      }
    });

    it.each([
      ['', 'empty string', 'URL cannot be empty.'],
      ['invalid-url', 'invalid format', 'Invalid URL format:'],
      ['ftp://example.com', 'invalid protocol (ftp)', 'Invalid URL protocol: ftp:'],
      ['http:/example.com', 'missing slashes / structure', 'Invalid URL structure'],
      ['https//example.com', 'typo in protocol', 'Invalid URL format:'],
      [null, 'null', 'Input must be a string.'],
      [undefined, 'undefined', 'Input must be a string.'],
      [123, 'number', 'Input must be a string.'],
    ])(
      'should return error for invalid input: %s (%s)',
      (invalidInput, _description, expectedErrorMsg) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = Url.create(invalidInput as any);
        expect(result.isErr()).toBe(true);
        if (result.isErr()) {
          expect(result.error).toBeInstanceOf(Error);
          expect(result.error.message).toContain(expectedErrorMsg);
        }
      }
    );
  });

  describe('URL Component Getters', () => {
    const result = Url.create(validHttpsUrl);
    if (result.isErr()) throw new Error('Test setup failed for getters');
    const url = result.value;

    it('should return the correct protocol', () => {
      expect(url.protocol).toBe('https:');
    });

    it('should return the correct hostname', () => {
      expect(url.hostname).toBe('sub.example.co.uk');
    });

    it('should return the correct pathname', () => {
      expect(url.pathname).toBe('/path/to/resource');
    });

    it('should return the correct search (query string)', () => {
      expect(url.search).toBe('?query=value&another=true');
    });

    // Note: Standard URL object does not expose fragment via a direct property
  });

  describe('value getter', () => {
    it('should return the original URL string', () => {
      const result = Url.create(validHttpsUrl);
      if (result.isOk()) {
        expect(result.value.value).toBe(validHttpsUrl);
      }
    });
  });

  describe('equals', () => {
    const url1Result = Url.create(validHttpsUrl);
    const url2Result = Url.create(validHttpsUrl);
    const url3Result = Url.create(validHttpUrl);

    if (url1Result.isErr() || url2Result.isErr() || url3Result.isErr()) {
      throw new Error('Test setup failed for equals');
    }
    const url1 = url1Result.value;
    const url2 = url2Result.value;
    const url3 = url3Result.value;

    it('should return true for instances with the same value', () => {
      expect(url1.equals(url2)).toBe(true);
    });

    it('should return false for instances with different values', () => {
      expect(url1.equals(url3)).toBe(false);
    });
  });
});
