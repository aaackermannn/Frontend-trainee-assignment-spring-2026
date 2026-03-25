import type { ItemCategory } from '../types/items';

export type ParamField = {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
};

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  auto: 'Авто',
  real_estate: 'Недвижимость',
  electronics: 'Электроника',
};

export const PARAM_LABEL_BY_KEY: Record<string, string> = {
  brand: 'Бренд',
  model: 'Модель',
  yearOfManufacture: 'Год выпуска',
  transmission: 'Трансмиссия',
  mileage: 'Пробег',
  enginePower: 'Мощность (л.с.)',
  type: 'Тип',
  address: 'Адрес',
  area: 'Площадь',
  floor: 'Этаж',
  condition: 'Состояние',
  color: 'Цвет',
};

export const VALUE_LABELS: Record<string, string> = {
  automatic: 'Автомат',
  manual: 'Механика',
  flat: 'Квартира',
  house: 'Дом',
  room: 'Комната',
  phone: 'Телефон',
  laptop: 'Ноутбук',
  misc: 'Другое',
  new: 'Новое',
  used: 'Б/у',
};

export const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'По новизне (сначала новые)' },
  { value: 'createdAt:asc', label: 'По новизне (сначала старые)' },
  { value: 'title:asc', label: 'По названию (А-Я)' },
  { value: 'title:desc', label: 'По названию (Я-А)' },
] as const;

export const PARAM_FIELDS_BY_CATEGORY: Record<ItemCategory, ParamField[]> = {
  auto: [
    { key: 'brand', label: 'Бренд', type: 'text' },
    { key: 'model', label: 'Модель', type: 'text' },
    { key: 'yearOfManufacture', label: 'Год выпуска', type: 'number' },
    {
      key: 'transmission',
      label: 'Трансмиссия',
      type: 'select',
      options: [
        { value: 'automatic', label: 'Автомат' },
        { value: 'manual', label: 'Механика' },
      ],
    },
    { key: 'mileage', label: 'Пробег', type: 'number' },
    { key: 'enginePower', label: 'Мощность двигателя', type: 'number' },
  ],
  real_estate: [
    {
      key: 'type',
      label: 'Тип недвижимости',
      type: 'select',
      options: [
        { value: 'flat', label: 'Квартира' },
        { value: 'house', label: 'Дом' },
        { value: 'room', label: 'Комната' },
      ],
    },
    { key: 'address', label: 'Адрес', type: 'text' },
    { key: 'area', label: 'Площадь', type: 'number' },
    { key: 'floor', label: 'Этаж', type: 'number' },
  ],
  electronics: [
    {
      key: 'type',
      label: 'Тип',
      type: 'select',
      options: [
        { value: 'phone', label: 'Телефон' },
        { value: 'laptop', label: 'Ноутбук' },
        { value: 'misc', label: 'Другое' },
      ],
    },
    { key: 'brand', label: 'Бренд', type: 'text' },
    { key: 'model', label: 'Модель', type: 'text' },
    {
      key: 'condition',
      label: 'Состояние',
      type: 'select',
      options: [
        { value: 'new', label: 'Новое' },
        { value: 'used', label: 'Б/у' },
      ],
    },
    { key: 'color', label: 'Цвет', type: 'text' },
  ],
};
