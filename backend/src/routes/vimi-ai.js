import { Router } from 'express';
import { VMG_SYSTEM_PROMPT, SPEAKING_SYSTEM_PROMPT, LESSON_PLAN_SYSTEM_PROMPT } from '../lib/vmg-prompts.js';

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

router.post('/lesson-plan', async (req, res) => {
  try {
    const { topic, level, duration, focus } = req.body;
    console.log('[ViMi-AI] POST /lesson-plan topic=%s level=%s duration=%s focus=%s key_present=%s',
      topic, level, duration, focus, !!process.env.FPT_API_KEY);
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    if (process.env.FPT_API_KEY) {
      try {
        const { createOpenAI } = await import('@ai-sdk/openai');
        const { streamText } = await import('ai');

        const provider = createOpenAI({
          baseURL: 'https://mkp-api.fptcloud.com',
          apiKey: process.env.FPT_API_KEY,
        });

        const prompt = `Generate a ${duration}-minute lesson plan for level ${level} with focus on ${focus}.
Topic: ${topic}

Return ONLY valid JSON obeying the output format specified in the system prompt.`;

        console.log('[ViMi-AI] Calling streamText for lesson plan...');
        const result = streamText({
          model: provider.chat('DeepSeek-V4-Flash'),
          system: LESSON_PLAN_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: prompt }],
        });

        console.log('[ViMi-AI] Streaming lesson plan response...');
        const stream = result.toTextStreamResponse().body;
        const reader = stream.getReader();
        res.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
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
        console.error('[ViMi-AI] Lesson plan AI call failed:', err.message);
        res.status(500).json({ error: 'AI service unavailable' });
      }
    } else {
      console.log('[ViMi-AI] FPT_API_KEY missing, returning fallback lesson plan');
      res.json({
        title: `${topic} Lesson Plan (${level})`,
        objectives: [
          `Students will be able to explain key concepts related to ${topic} using target vocabulary.`,
          `Students will practice ${focus} strategies through structured activities.`,
        ],
        stages: [
          { stage: 'Warm-Up', time: '5 min', activity: `Engage students with a question or image related to ${topic}.` },
          { stage: 'Presentation', time: '10 min', activity: `Introduce key vocabulary and concepts for ${topic} using visuals.` },
          { stage: 'Practice', time: '15 min', activity: `Pair work: students complete structured tasks using sentence frames.` },
          { stage: 'Production', time: '10 min', activity: `Students create a short presentation or written response about ${topic}.` },
          { stage: 'Wrap-Up', time: '5 min', activity: `Exit ticket: one thing learned and one question about ${topic}.` },
        ],
        assessment: `Formative observation during pair work; exit ticket rubric for content and language.`,
        materials: [`Visuals for ${topic}`, `Sentence frames handout`, `Exit ticket template`],
      });
    }
  } catch (err) {
    console.error('[ViMi-AI] Lesson plan error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
