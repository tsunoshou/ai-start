import { validate as uuidValidate } from 'uuid';
import { describe, it, expect } from 'vitest';

import { ErrorCode } from '@core/shared/enums/error-code.enum';
import { BaseError } from '@core/shared/errors/base.error';

import { generateUuidV4String, validateUuidV4String } from '../identifier.utils';

describe('Identifier Utils', () => {
  describe('generateUuidV4String', () => {
    it('should return a valid UUID v4 string', () => {
      const generatedId = generateUuidV4String();
      expect(typeof generatedId).toBe('string');
      expect(uuidValidate(generatedId)).toBe(true);
    });

    it('should return different IDs on subsequent calls', () => {
      const id1 = generateUuidV4String();
      const id2 = generateUuidV4String();
      expect(id1).not.toBe(id2);
    });
  });

  describe('validateUuidV4String', () => {
    const validUuid = generateUuidV4String(); // Use a generated valid UUID

    it('should return Ok with the ID for a valid UUID v4 string', () => {
      const result = validateUuidV4String(validUuid);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(validUuid);
      }
    });

    it.each([
      ['invalid-uuid-string', 'non-UUID string'],
      ['123e4567-e89b-12d3-a456-42661417400', 'incomplete UUID'], // Too short
      ['', 'empty string'],
      [' ', 'whitespace string'], // uuidValidate returns false for whitespace
      ['123e4567-e89b-12d3-a456-42661417400g', 'invalid character'], // 'g' is not valid hex
    ])('should return Err for an invalid UUID string: %s (%s)', (invalidId, _description) => {
      const result = validateUuidV4String(invalidId);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(BaseError);
        expect(result.error.code).toBe(ErrorCode.InvalidIdentifierFormat);
        expect(result.error.message).toContain('Invalid Identifier format');
      }
    });

    // Note: The function expects a string, so testing null/undefined directly
    // would require type casting or adjusting the function signature.
    // The primary focus is validating string format.
  });
});
