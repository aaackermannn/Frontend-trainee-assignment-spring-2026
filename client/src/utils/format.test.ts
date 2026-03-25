import { describe, expect, it } from 'vitest';
import { formatDate, formatPrice } from './format';

describe('formatPrice', () => {
  it('formats a positive number with ruble sign', () => {
    const result = formatPrice(1000);
    expect(result).toContain('1');
    expect(result).toContain('₽');
  });

  it('returns fallback text when price is null', () => {
    expect(formatPrice(null)).toBe('Цена не указана');
  });

  it('formats zero correctly', () => {
    const result = formatPrice(0);
    expect(result).toContain('0');
    expect(result).toContain('₽');
  });

  it('formats large price with separators', () => {
    const result = formatPrice(1500000);
    expect(result).toMatch(/1.500.000|1 500 000/);
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for valid ISO date', () => {
    const result = formatDate('2026-03-10T10:00:00.000Z');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the day in the output', () => {
    const result = formatDate('2026-03-10T00:00:00.000Z');
    expect(result).toContain('10');
  });
});
