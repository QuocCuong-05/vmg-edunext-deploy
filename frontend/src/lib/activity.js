const STORAGE_KEY = 'vmg_activity';
const MAX_ITEMS = 20;

function getNowISO() {
  return new Date().toISOString();
}

export function getActivities(limit) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return [];
    return items.slice(0, limit || items.length);
  } catch {
    return [];
  }
}

export function logActivity(type, title, detail) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) items = [];

    const activity = {
      id: Date.now(),
      type,
      title,
      detail: detail || '',
      time: getNowISO(),
    };

    items.unshift(activity);

    if (items.length > MAX_ITEMS) {
      items.length = MAX_ITEMS;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // silent
  }
}
