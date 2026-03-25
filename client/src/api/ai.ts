import type { AdUpdatePayload } from '../types/items';

const OLLAMA_URL =
  import.meta.env.VITE_OLLAMA_URL?.trim() || 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = import.meta.env.VITE_OLLAMA_MODEL?.trim() || 'llama3.2';

// Получаем URL для /api/chat из сконфигурированного адреса /api/generate.
const OLLAMA_CHAT_URL = OLLAMA_URL.replace(/\/api\/generate$/, '/api/chat');

type OllamaResponse = {
  response: string;
};

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type OllamaChatResponse = {
  message: { role: string; content: string };
};

async function callOllama(prompt: string): Promise<string> {
  const response = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      stream: false,
      prompt,
    }),
  });

  if (!response.ok) {
    throw new Error('Не удалось получить ответ от LLM');
  }

  const data = (await response.json()) as OllamaResponse;
  return data.response.trim();
}

function buildDescriptionPrompt(payload: AdUpdatePayload): string {
  const params = Object.entries(payload.params)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  return [
    'Ты помогаешь продавцу Авито написать описание объявления.',
    'ВАЖНО: отвечай ИСКЛЮЧИТЕЛЬНО на русском языке. Не используй английские слова.',
    'Задача: написать информативное и привлекательное описание товара.',
    'Требования: 2–4 предложения, без лишней воды, без эмодзи, только факты и польза для покупателя.',
    'Отвечай ТОЛЬКО текстом описания, без приветствий, без пояснений, без кавычек.',
    '',
    `Категория: ${payload.category}`,
    `Название: ${payload.title}`,
    `Цена: ${payload.price} руб.`,
    params ? `Характеристики: ${params}` : '',
    payload.description ? `Текущее описание (улучши его): ${payload.description}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildPricePrompt(payload: AdUpdatePayload): string {
  const params = Object.entries(payload.params)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const condition = String(payload.params.condition ?? '').trim();
  const isNew = condition === 'new' || condition === 'Новое' || condition === 'новое';

  return [
    'Ты аналитик цен на товары для сайта Авито.',
    'ВАЖНО: отвечай ИСКЛЮЧИТЕЛЬНО на русском языке. Не используй английские слова.',
    'Задача: оценить справедливую рыночную цену на товар.',
    isNew
      ? 'Товар новый (состояние: новое). Дай рекомендацию для нового товара.'
      : 'Товар б/у (состояние: б/у). Дай три варианта цены: как новый, с мелкими дефектами, и с сильными дефектами/для срочной продажи.',
    'Формат ответа (строго соблюдай, без отклонений):',
    isNew
      ? 'Новый: X000 – Y000 ₽'
      : 'Новый: X000 – Y000 ₽\nС мелкими дефектами: X000 – Y000 ₽\nС сильными дефектами / срочно: X000 – Y000 ₽',
    'Комментарий: одно-два предложения с обоснованием на русском языке.',
    'Отвечай ТОЛЬКО в указанном формате, без лишних слов и приветствий.',
    '',
    `Категория: ${payload.category}`,
    `Название: ${payload.title}`,
    `Текущая цена продавца: ${payload.price} руб.`,
    params ? `Характеристики: ${params}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function generateDescription(payload: AdUpdatePayload): Promise<string> {
  return callOllama(buildDescriptionPrompt(payload));
}

export async function generatePriceAdvice(payload: AdUpdatePayload): Promise<string> {
  return callOllama(buildPricePrompt(payload));
}

// Использует эндпоинт /api/chat, чтобы история многоходового диалога сохранялась.
export async function chatWithAI(messages: ChatMessage[]): Promise<string> {
  const response = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, stream: false, messages }),
  });

  if (!response.ok) {
    throw new Error('Не удалось получить ответ от AI');
  }

  const data = (await response.json()) as OllamaChatResponse;
  return data.message.content.trim();
}
