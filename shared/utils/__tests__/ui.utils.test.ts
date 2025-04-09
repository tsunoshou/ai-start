import { describe, it, expect } from 'vitest';

import { cn } from '../ui';

describe('cn utility function', () => {
  it('should combine simple string class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('should handle conditional classes with objects', () => {
    expect(cn('a', { b: true, c: false, d: true })).toBe('a b d');
  });

  it('should handle conditional classes with arrays', () => {
    expect(cn(['a', 'b'], ['c', { d: true, e: false }])).toBe('a b c d');
  });

  it('should handle falsy values gracefully', () => {
    expect(cn('a', null, 'b', undefined, 'c', false, 'd')).toBe('a b c d');
  });

  it('should merge conflicting Tailwind classes (last one wins)', () => {
    // Example: padding conflict
    expect(cn('p-4', 'p-2')).toBe('p-2');
    // Example: margin conflict
    expect(cn('m-8', 'm-2', 'm-4')).toBe('m-4');
    // Example: text color conflict
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    // Example: mixing basic and conflicting classes
    expect(cn('font-bold', 'p-4', 'text-lg', 'p-2')).toBe('font-bold text-lg p-2');
  });

  it('should handle complex combinations', () => {
    expect(
      cn(
        'base-class',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ['array-class-1', { 'array-cond-true': true, 'array-cond-false': false }],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        { 'obj-cond-true': true, 'obj-cond-false': false },
        null,
        'another-base',
        'p-4',
        undefined,
        'p-2'
      )
    ).toBe('base-class array-class-1 array-cond-true obj-cond-true another-base p-2');
  });
});
