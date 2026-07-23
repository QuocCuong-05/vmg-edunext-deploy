const DAILY_QUESTS = [
  { id: 'dq-1', title: 'Hoàn thành 1 bài quiz', xp: 50, desc: 'Làm một bài quiz bất kỳ để kiểm tra kiến thức' },
  { id: 'dq-2', title: 'Hỏi ViMi 1 câu hỏi', xp: 40, desc: 'Chat với ViMi về bất kỳ chủ đề nào bạn quan tâm' },
  { id: 'dq-3', title: 'Đọc 1 bài viết Blog', xp: 30, desc: 'Đọc một bài blog trong thư viện VMG' },
  { id: 'dq-4', title: 'Ôn 5 từ vựng', xp: 30, desc: 'Ôn tập 5 từ vựng bất kỳ trong danh sách' },
  { id: 'dq-5', title: 'Luyện 5 câu Classroom Phrases', xp: 40, desc: 'Luyện nói 5 câu lệnh lớp học tiếng Anh' },
  { id: 'dq-6', title: 'Hoàn thành 1 bài học', xp: 60, desc: 'Học xong một bài trong khóa học bất kỳ' },
  { id: 'dq-7', title: 'Xem tiến độ của bạn', xp: 20, desc: 'Kiểm tra tiến độ học tập trên Dashboard' },
];

const WEEKLY_QUESTS = [
  { id: 'wq-1', title: 'Hoàn thành 3 Daily Quest trong tuần', xp: 150, desc: 'Hoàn thành 3 nhiệm vụ hàng ngày trong tuần này' },
  { id: 'wq-2', title: 'Đạt 80%+ trong 1 bài quiz', xp: 200, desc: 'Đạt điểm cao trong một bài quiz bất kỳ' },
  { id: 'wq-3', title: 'Học 15 từ vựng mới', xp: 200, desc: 'Mở rộng vốn từ vựng của bạn với 15 từ mới' },
  { id: 'wq-4', title: 'Hoàn thành 2 bài học', xp: 250, desc: 'Học xong 2 bài trong bất kỳ khóa học nào' },
  { id: 'wq-5', title: 'Duy trì streak 5 ngày', xp: 300, desc: 'Giữ chuỗi học tập 5 ngày liên tiếp' },
  { id: 'wq-6', title: 'Luyện nói với ViMi 4 lần', xp: 300, desc: 'Thực hành nói với ViMi ở chế độ speaking 4 lần' },
];

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function deterministicShuffle(arr, seed) {
  const rng = mulberry32(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getDateKey(date) {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getWeekKey(date) {
  const d = new Date(Date.UTC((date || new Date()).getFullYear(), (date || new Date()).getMonth(), (date || new Date()).getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getDailyQuests() {
  const seed = hashString(getDateKey());
  return deterministicShuffle(DAILY_QUESTS, seed).slice(0, 3);
}

export function getWeeklyQuests() {
  const seed = hashString(getWeekKey());
  return deterministicShuffle(WEEKLY_QUESTS, seed).slice(0, 3);
}
