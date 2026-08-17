// Thang level động (QL-2): delta XP tăng dần
// GIỮ ĐỒNG BỘ với backend/src/routes/level.js
export const LEVEL_THRESHOLDS = [
  800, 1800, 3000, 4500, 6500, 9000, 12000, 15500, 19500, 24000,
  29000, 34500, 40500, 47000, 54000, 61500, 69500, 78000, 87000,
];

export function levelFromXp(xp) {
  let lvl = 1;
  for (const t of LEVEL_THRESHOLDS) {
    if (xp >= t) lvl++;
    else break;
  }
  return lvl;
}

export function levelBounds(xp) {
  const lvl = levelFromXp(xp);
  const prev = lvl > 1 ? LEVEL_THRESHOLDS[lvl - 2] : 0;
  const next = LEVEL_THRESHOLDS[lvl - 1] ?? prev + 5000;
  return { lvl, prev, next, current: xp - prev, required: next - prev };
}
