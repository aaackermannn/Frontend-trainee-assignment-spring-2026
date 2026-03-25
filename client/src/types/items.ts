export const CATEGORY_VALUES = ['auto', 'real_estate', 'electronics'] as const;

export type ItemCategory = (typeof CATEGORY_VALUES)[number];

export type ItemParams =
  | {
      brand?: string;
      model?: string;
      yearOfManufacture?: number;
      transmission?: 'automatic' | 'manual';
      mileage?: number;
      enginePower?: number;
    }
  | {
      type?: 'flat' | 'house' | 'room';
      address?: string;
      area?: number;
      floor?: number;
    }
  | {
      type?: 'phone' | 'laptop' | 'misc';
      brand?: string;
      model?: string;
      condition?: 'new' | 'used';
      color?: string;
    };

export type AdListItem = {
  id: number;
  category: ItemCategory;
  title: string;
  price: number | null;
  needsRevision: boolean;
};

export type AdDetails = {
  id: number;
  category: ItemCategory;
  title: string;
  description?: string;
  price: number | null;
  createdAt: string;
  updatedAt: string;
  params: Record<string, string | number | undefined>;
  needsRevision: boolean;
};

export type AdsListResponse = {
  items: AdListItem[];
  total: number;
};

export type AdUpdatePayload = {
  category: ItemCategory;
  title: string;
  description?: string;
  price: number;
  params: Record<string, string | number | undefined>;
};
