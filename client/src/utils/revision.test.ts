import { describe, expect, it } from 'vitest';
import { getMissingFields } from './revision';
import type { AdDetails } from '../types/items';

const baseAd: AdDetails = {
  id: 1,
  category: 'electronics',
  title: 'Test',
  price: 1000,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  needsRevision: false,
  params: {},
};

describe('getMissingFields — electronics', () => {
  it('returns all fields when params and description are empty', () => {
    const missing = getMissingFields({ ...baseAd, description: '', params: {} });
    expect(missing).toContain('Описание');
    expect(missing.length).toBeGreaterThan(1);
  });

  it('does not include description when it is filled', () => {
    const missing = getMissingFields({ ...baseAd, description: 'Хорошее описание', params: {} });
    expect(missing).not.toContain('Описание');
  });

  it('returns empty array when all fields are present', () => {
    const missing = getMissingFields({
      ...baseAd,
      description: 'Описание',
      params: {
        type: 'laptop',
        brand: 'Apple',
        model: 'MacBook',
        condition: 'new',
        color: 'Silver',
      },
    });
    expect(missing).toHaveLength(0);
  });

  it('lists only the missing param fields', () => {
    const missing = getMissingFields({
      ...baseAd,
      description: 'Описание',
      params: { type: 'phone', brand: 'Samsung' },
    });
    expect(missing).not.toContain('Описание');
    expect(missing).toContain('Модель');
  });
});

describe('getMissingFields — auto', () => {
  const autoAd: AdDetails = { ...baseAd, category: 'auto' };

  it('includes all auto fields when empty', () => {
    const missing = getMissingFields({ ...autoAd, description: '', params: {} });
    expect(missing).toContain('Бренд');
    expect(missing).toContain('Модель');
  });
});

describe('getMissingFields — real_estate', () => {
  const reAd: AdDetails = { ...baseAd, category: 'real_estate' };

  it('includes address field when missing', () => {
    const missing = getMissingFields({ ...reAd, description: 'desc', params: { type: 'flat' } });
    expect(missing).toContain('Адрес');
  });

  it('returns empty array for complete real_estate ad', () => {
    const missing = getMissingFields({
      ...reAd,
      description: 'Описание',
      params: { type: 'flat', address: 'ул. Ленина 1', area: 45, floor: 3 },
    });
    expect(missing).toHaveLength(0);
  });
});
