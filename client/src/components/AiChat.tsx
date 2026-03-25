import { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { chatWithAI } from '../api/ai';
import type { ChatMessage } from '../api/ai';

type VisibleMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type AiChatProps = {
  /** Системный контекст, передаваемый модели при каждом запросе (данные объявления)*/
  systemContext: string;
};

export function AiChat({ systemContext }: AiChatProps) {
  const [messages, setMessages] = useState<VisibleMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Прокручиваем к последнему сообщению при каждом обновлении списка
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: VisibleMessage = { role: 'user', content: text };
    setInput('');
    setError('');
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Восстанавливаем полную историю с системным промптом при каждом вызове
      // чтобы модель всегда имела контекст объявления независимо от длины чата
      const history: ChatMessage[] = [
        {
          role: 'system',
          content:
            'Ты помощник продавца на площадке Авито. Отвечай только на русском языке.\n\n' +
            systemContext,
        },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: text },
      ];

      const reply = await chatWithAI(history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setError('Не удалось получить ответ. Убедитесь, что Ollama запущена.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <Box>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Чат с AI
      </Typography>
      <Divider sx={{ mb: 2 }} />

      {/* История сообщений */}
      <Stack
        spacing={1}
        sx={{
          minHeight: 120,
          maxHeight: 320,
          overflowY: 'auto',
          mb: 2,
          pr: 0.5,
        }}
      >
        {messages.length === 0 && !isLoading ? (
          <Typography variant="body2" color="text.secondary">
            Задайте вопрос по объявлению — AI ответит с учётом контекста карточки.
          </Typography>
        ) : null}

        {messages.map((msg, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <Box
              sx={{
                maxWidth: '80%',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'action.hover',
                color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                px: 1.5,
                py: 0.75,
              }}
            >
              <Typography variant="body2" whiteSpace="pre-wrap">
                {msg.content}
              </Typography>
            </Box>
          </Box>
        ))}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', pl: 0.5 }}>
            <CircularProgress size={18} />
          </Box>
        ) : null}

        {error ? (
          <Typography variant="caption" color="error">
            {error}
          </Typography>
        ) : null}

        {/* Якорь для автопрокрутки */}
        <div ref={bottomRef} />
      </Stack>

      {/* Строка ввода */}
      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          fullWidth
          multiline
          maxRows={4}
          size="small"
          placeholder="Задайте вопрос... (Enter — отправить)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    edge="end"
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          sx={{ flexShrink: 0, display: { xs: 'none', sm: 'flex' } }}
        >
          Отправить
        </Button>
      </Stack>
    </Box>
  );
}
