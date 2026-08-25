import { generateText } from 'ai';

const SYSTEM_PROMPT_WORD = `Bạn là chuyên gia đánh giá phát âm tiếng Anh cho giáo viên Việt Nam.
Bạn nhận 1 từ/âm tiêu chuẩn (target) và transcript (nội dung nhận diện giọng nói của học viên khi họ đọc từ đó).
Nhiệm vụ: đánh giá phát âm dựa trên độ khớp giữa transcript và từ đích, trả về JSON DUY NHẤT:
{"score": <số nguyên 1-10>, "feedback": "<1-2 câu phản hồi ngắn gọn bằng tiếng Việt, gợi ý cách phát âm đúng>"}
Quy tắc:
- transcript khớp chính xác từ đích (hoặc gần giống về âm) => score 8-10.
- transcript lệch 1-2 âm/đọc gần đúng => score 5-7, chỉ rõ âm nào chưa chuẩn.
- transcript lệch nhiều/khác hoàn toàn => score 1-4.
- Không thêm text ngoài JSON.`;

const SYSTEM_PROMPT_PASSAGE = `Bạn là chuyên gia đánh giá phát âm tiếng Anh cho giáo viên Việt Nam.
Học viên vừa đọc TOÀN BỘ một cụm/from vựng (danh sách từ mục tiêu) trong một lần ghi âm.
Bạn nhận toàn bộ cụm từ mục tiêu (target) và transcript (nội dung nhận diện giọng nói của học viên).
Nhiệm vụ: đánh giá phát âm tổng thể của cả cụm, trả về JSON DUY NHẤT:
{"score": <số nguyên 1-10>, "feedback": "<1-2 câu phản hồi ngắn gọn bằng tiếng Việt, nhận xét chung và gợi ý từ nào phát âm chưa chuẩn>"}
Quy tắc:
- transcript bao quát được hầu hết các từ mục tiêu, phát âm rõ ràng => score 8-10.
- thiếu/thay đổi 1-2 từ hoặc một vài âm chưa chuẩn => score 5-7, chỉ rõ từ nào.
- bỏ sót nhiều từ/phát âm lệch xa => score 1-4.
- Không thêm text ngoài JSON.`;

export async function gradePronunciation(word, transcript, opts = {}) {
  const isPassage = !!opts.passage;
  const SYSTEM_PROMPT = isPassage ? SYSTEM_PROMPT_PASSAGE : SYSTEM_PROMPT_WORD;
  const cleaned = (transcript || '').trim().replace(/\s+/g, ' ').toLowerCase();
  const target = (word || '').trim().toLowerCase();

  if (!target || !cleaned) {
    return {
      score: null,
      feedback: cleaned
        ? 'Không có transcript để chấm.'
        : 'Không nhận diện được giọng nói. Bạn hãy thử nói to, rõ hơn và bật mic đúng.',
    };
  }

  if (!process.env.FPT_API_KEY) {
    console.warn('[practiceGrade] FPT_API_KEY missing — dùng điểm dựa trên độ khớp text.');
    return fallbackGrade(target, cleaned);
  }

  try {
    const { createOpenAI } = await import('@ai-sdk/openai');
    const provider = createOpenAI({
      baseURL: 'https://mkp-api.fptcloud.com',
      apiKey: process.env.FPT_API_KEY,
    });

    const { text } = await generateText({
      model: provider.chat('DeepSeek-V4-Flash'),
      system: SYSTEM_PROMPT,
      prompt: `Cụm từ mục tiêu: "${target}"\nTranscript của học viên: "${cleaned}"`,
      temperature: 0.2,
    });

    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const score = Math.max(1, Math.min(10, Math.round(Number(parsed.score) || 0)));
      return { score, feedback: String(parsed.feedback || '').trim() || 'Đã chấm xong.' };
    }
    return fallbackGrade(target, cleaned);
  } catch (err) {
    console.error('[practiceGrade] AI call failed:', err.message);
    return fallbackGrade(target, cleaned);
  }
}

function fallbackGrade(target, cleaned) {
  const same = target === cleaned;
  const contains = cleaned.includes(target) || target.includes(cleaned);
  const targetLetters = new Set(target.replace(/[^a-z]/g, ''));
  const cleanedLetters = new Set(cleaned.replace(/[^a-z]/g, ''));
  let common = 0;
  targetLetters.forEach(l => { if (cleanedLetters.has(l)) common++; });
  const overlap = targetLetters.size ? common / targetLetters.size : 0;

  if (same) return { score: 9, feedback: 'Phát âm chuẩn, tiếp tục phát huy!' };
  if (contains) return { score: 7, feedback: 'Khá ổn, lưu ý phát âm rõ từng âm.' };
  if (overlap >= 0.7) return { score: 6, feedback: 'Gần đúng, chú ý âm cuối và trọng âm.' };
  return { score: 4, feedback: 'Phát âm chưa rõ, hãy nghe lại âm mẫu và luyện thêm.' };
}
