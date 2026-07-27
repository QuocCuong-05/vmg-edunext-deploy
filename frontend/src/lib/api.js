import { supabase } from './supabase';

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

function fromDb(result) {
  if (result.error) throw result.error;
  return result.data;
}

export const api = {
  auth: {
    login: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    signup: async (email, password, full_name) => {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name } },
      });
      if (error) throw error;
      return data;
    },
    me: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data;
    },
  },
  courses: {
    list: async () => {
      const { data, error } = await supabase.from('courses').select('*').eq('is_published', true).order('sort_order');
      if (error) throw error;
      return data;
    },
    get: async (slug) => {
      const { data, error } = await supabase.from('courses').select('*').eq('slug', slug).single();
      if (error) throw error;
      return data;
    },
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
    list: async () => fromDb(await supabase.from('tips').select('*').eq('is_published', true)),
  },
  quests: {
    list: async (type) => {
      let q = supabase.from('quests').select('*').eq('is_active', true);
      if (type) q = q.eq('type', type);
      return fromDb(await q);
    },
  },
  rewards: {
    list: async () => fromDb(await supabase.from('rewards').select('*').eq('is_active', true)),
  },
  vocabulary: {
    list: async () => fromDb(await supabase.from('vocabulary_entries').select('*').eq('is_published', true)),
  },
  classroom: {
    list: async () => fromDb(await supabase.from('classroom_phrases').select('*, classroom_phrase_categories(slug, name_vi)').eq('is_published', true).order('sort_order')),
    categories: async () => fromDb(await supabase.from('classroom_phrase_categories').select('*').order('sort_order')),
  },
  quiz: {
    list: async () => fromDb(await supabase.from('quiz_sets').select('*').eq('is_published', true)),
    get: async (slug) => {
      const { data, error } = await supabase.from('quiz_sets').select(`
        *,
        questions:quiz_questions(
          *,
          options:quiz_options(*)
        )
      `).eq('slug', slug).single();
      if (error) throw error;
      return data;
    },
  },
  level: {
    challenges: async () => {
      const data = fromDb(await supabase.from('level_challenges').select('*, quiz_set:quiz_sets!quiz_set_id(slug)').eq('is_active', true).order('sort_order'));
      return data.map(c => ({ ...c, quiz_slug: c.quiz_set?.slug || null }));
    },
    userChallenges: async () => [],
    complete: async () => {},
  },
};

export { API_BASE };
