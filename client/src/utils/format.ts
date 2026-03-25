export function formatPrice(price: number | null): string {
  if (price === null) {
    return 'Цена не указана';
  }

  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}
