const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('vmg_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data !== undefined ? json.data : json;
}

export { API_BASE };
export const api = {
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    signup: (email, password, full_name) => request('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name }) }),
    me: () => request('/auth/me'),
  },
  courses: {
    list: () => request('/courses'),
    get: (slug) => request(`/courses/${slug}`),
  },
  vimi: {
    chat: (message) => request('/vimi/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  },
  tts: {
    speak: async (text) => {
      const res = await fetch(`${API_BASE}/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('TTS failed');
      return res.blob();
    },
  },
  tips: {
    list: () => request('/tips'),
  },
  quests: {
    list: (type) => request(`/quests?type=${type || ''}`),
  },
  rewards: {
    list: () => request('/rewards'),
  },
  vocabulary: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/vocabulary${q ? '?' + q : ''}`);
    },
  },
  classroom: {
    list: (params) => {
      const q = new URLSearchParams(params || {}).toString();
      return request(`/classroom${q ? '?' + q : ''}`);
    },
    categories: () => request('/classroom/categories'),
  },
  quiz: {
    list: () => request('/quiz/sets'),
    get: (slug) => request(`/quiz/sets/${slug}`),
  },
  level: {
    challenges: () => request('/level/challenges'),
    userChallenges: () => request('/level/challenges/user'),
    complete: (id) => request(`/level/challenges/${id}/complete`, { method: 'POST' }),
  },
};
