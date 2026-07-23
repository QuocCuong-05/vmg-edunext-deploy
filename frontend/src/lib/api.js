const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('vmg_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

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
};
