const XP_KEY = 'vmg_xp';
const INITIAL_XP = 0;
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export function getXp() {
  try {
    const val = localStorage.getItem(XP_KEY);
    return val !== null ? parseInt(val, 10) : INITIAL_XP;
  } catch {
    return INITIAL_XP;
  }
}

export function setXp(val) {
  if (typeof val !== 'number' || val < 0) return;
  localStorage.setItem(XP_KEY, String(Math.round(val)));
}

let syncTimer = null;

function scheduleSync() {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    syncXp();
  }, 3000);
}

export function addXp(delta) {
  const current = getXp();
  const next = Math.max(0, current + delta);
  setXp(next);
  scheduleSync();
  return next;
}

export async function syncXp() {
  const token = localStorage.getItem('vmg_token');
  const value = getXp();
  try {
    const res = await fetch(`${API_BASE}/auth/sync-xp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ xp: value }),
    });
    if (!res.ok) return;
    const json = await res.json();
    if (typeof json?.xp === 'number') setXp(Math.max(getXp(), json.xp));
  } catch {
    // offline — sẽ sync lại ở lần tiếp theo
  }
}
