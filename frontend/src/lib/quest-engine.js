import { getDateKey, getWeekKey, getDailyQuests, getWeeklyQuests } from '../mock/quests';
import { addXp } from './xp';
import { logActivity } from './activity';
import { getStreak } from './streak';

const STORAGE_KEY = 'vmg_quests';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getDateKey(), week: getWeekKey(), done: {}, progress: {} };
    const p = JSON.parse(raw);
    if (p.date !== getDateKey() || p.week !== getWeekKey()) {
      return { date: getDateKey(), week: getWeekKey(), done: {}, progress: {} };
    }
    return p;
  } catch {
    return { date: getDateKey(), week: getWeekKey(), done: {}, progress: {} };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getQuestDefinitions() {
  return {
    daily: getDailyQuests(),
    weekly: getWeeklyQuests(),
  };
}

function emitToast(message) {
  try {
    window.__vimi_toast && window.__vimi_toast(message, 'success');
  } catch {}
}

export function dispatchAction(type, payload = {}) {
  const state = loadState();
  const defs = getQuestDefinitions();
  let changed = false;

  const allDefs = [...defs.daily, ...defs.weekly];

  for (const q of allDefs) {
    if (state.done[q.id]) continue;

    const t = q.trigger;
    if (!t) continue;

    let complete = false;

    if (t.type === 'special') {
      if (t.special === 'daily_quest_count') {
        const dailyDoneCount = defs.daily.filter(d => state.done[d.id]).length;
        if (dailyDoneCount >= (t.count || 3)) complete = true;
      } else if (t.special === 'streak') {
        if (getStreak() >= (t.count || 5)) complete = true;
      }
    } else if (t.type === type) {
      if (t.count) {
        const current = state.progress[q.id] || 0;
        const next = current + (payload.count || 1);
        state.progress[q.id] = next;
        if (next >= t.count) complete = true;
      } else if (t.condition) {
        if (t.condition(payload)) complete = true;
      } else {
        complete = true;
      }
    }

    if (complete) {
      state.done[q.id] = true;
      addXp(q.xp);
      logActivity('quest', 'Hoàn thành: ' + q.title, '+' + q.xp + 'XP');
      emitToast('+' + q.xp + ' XP - ' + q.title);
      changed = true;
    }
  }

  if (changed) {
    saveState(state);
    window.dispatchEvent(new Event('quest-update'));
  }
}

export function getQuestState() {
  const state = loadState();
  const defs = getQuestDefinitions();

  const daily = defs.daily.map(q => ({
    ...q,
    done: !!state.done[q.id],
    progress: state.progress[q.id] || 0,
    max: q.trigger?.count || 1,
  }));

  const weekly = defs.weekly.map(q => ({
    ...q,
    done: !!state.done[q.id],
    progress: state.progress[q.id] || 0,
    max: q.trigger?.count || 1,
  }));

  return { daily, weekly, date: state.date, week: state.week };
}
