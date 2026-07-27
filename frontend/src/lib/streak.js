const STORAGE_KEY = 'vmg_streak';

function getDateStr(d) {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getDateStr(d);
}

export function getStreak() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const today = getDateStr();
    const yesterday = getYesterdayStr();
    if (data.lastDate === today || data.lastDate === yesterday) {
      return data.count;
    }
    return 0;
  } catch {
    return 0;
  }
}

export function updateStreak() {
  try {
    const today = getDateStr();
    const yesterday = getYesterdayStr();
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : null;

    let next;
    if (!data) {
      next = { lastDate: today, count: 1 };
    } else if (data.lastDate === today) {
      next = data;
    } else if (data.lastDate === yesterday) {
      next = { lastDate: today, count: data.count + 1 };
    } else {
      next = { lastDate: today, count: 1 };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return next.count;
  } catch {
    return 0;
  }
}
