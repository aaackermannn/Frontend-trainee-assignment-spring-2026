import { useEffect, useState } from 'react';

/**
 * Возвращает дебаунсированную копию `value`, которая обновляется только спустя
 * `delayMs` миллисекунд бездействия. Функция очистки в эффекте отменяет
 * ожидающий таймер при каждом изменении `value` до истечения задержки
 * это предотвращает лишние API-запросы на промежуточные значения
 */
export function useDebounce<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timerId = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timerId);
  }, [value, delayMs]);

  return debounced;
}
