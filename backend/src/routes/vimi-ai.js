import { Router } from 'express';
import { VMG_SYSTEM_PROMPT, SPEAKING_SYSTEM_PROMPT } from '../lib/vmg-prompts.js';

const router = Router();

function stripEmoji(text) {
  return text.replace(/[\u{1F000}-\u{1FFFF}\u{2702}-\u{27B0}\u{24C2}-\u{1F251}\u{200D}\u{FE0F}]/gu, '');
}

console.log('[ViMi-AI] FPT_API_KEY loaded:', !!process.env.FPT_API_KEY);

router.post('/chat', async (req, res) => {
  try {
    const { messages, mode } = req.body;
    console.log('[ViMi-AI] POST /chat mode=%s messages=%d key_present=%s',
      mode, messages?.length, !!process.env.FPT_API_KEY);
    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const isSpeaking = mode === 'speaking';
    const system = isSpeaking ? SPEAKING_SYSTEM_PROMPT : VMG_SYSTEM_PROMPT;

    const cleanedMessages = messages.map(m => {
      let content = m.content;
      if (typeof content === 'string') {
        content = content.replace(/^\/\w+\s*/, '');
      }
      return { role: m.role, content };
    });

    if (process.env.FPT_API_KEY) {
      try {
        console.log('[ViMi-AI] Creating OpenAI provider with FPT Cloud...');
        const { createOpenAI } = await import('@ai-sdk/openai');
        const { streamText } = await import('ai');

        const provider = createOpenAI({
          baseURL: 'https://mkp-api.fptcloud.com',
          apiKey: process.env.FPT_API_KEY,
        });

        console.log('[ViMi-AI] Calling streamText model=deepseek-v4-flash mode=%s', mode);
        const result = streamText({
          model: provider.chat('DeepSeek-V4-Flash'),
          system,
          messages: cleanedMessages,
        });

        console.log('[ViMi-AI] Getting stream response body...');
        const stream = result.toTextStreamResponse().body;
        const reader = stream.getReader();
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
          'X-Stream': 'true',
        });
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(stripEmoji(decoder.decode(value, { stream: true })));
        }
        res.end();
        return;
      } catch (err) {
        console.error('[ViMi-AI] AI call failed:', err.message);
        console.error('[ViMi-AI] Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
        if (err.statusCode) console.error('[ViMi-AI] HTTP status:', err.statusCode);
        if (err.responseBody) console.error('[ViMi-AI] Response body:', err.responseBody);
        res.status(500).json({ error: 'AI service unavailable' });
        return;
      }
    }

    console.log('[ViMi-AI] FPT_API_KEY missing, returning 503');
    res.status(503).json({ error: 'FPT_API_KEY not configured. Set it in .env to use ViMi AI.' });
  } catch (err) {
    console.error('[ViMi-AI] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
