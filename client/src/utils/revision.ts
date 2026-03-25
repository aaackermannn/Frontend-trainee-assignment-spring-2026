import { PARAM_FIELDS_BY_CATEGORY } from '../constants/items';
import type { AdDetails } from '../types/items';

function hasValue(value: string | number | undefined): boolean {
  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  return Boolean(value && value.toString().trim().length > 0);
}

export function getMissingFields(ad: AdDetails): string[] {
  const missing: string[] = [];
  const fields = PARAM_FIELDS_BY_CATEGORY[ad.category];

  if (!ad.description?.trim()) {
    missing.push('Описание');
  }

  fields.forEach((field) => {
    if (!hasValue(ad.params[field.key])) {
      missing.push(field.label);
    }
  });

  return missing;
}
