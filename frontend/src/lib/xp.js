const XP_KEY = 'vmg_xp';
const INITIAL_XP = 2450;

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

export function addXp(delta) {
  const current = getXp();
  const next = Math.max(0, current + delta);
  setXp(next);
  return next;
}
