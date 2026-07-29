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
      const { data, error } = await supabase.from('courses').select('*').eq('is_published', true);
      if (error) throw error;
      return data;
    },
    get: async (slug) => {
      const { data: course, error } = await supabase.from('courses').select('*').eq('slug', slug).single();
      if (error) throw error;
      const { data: lessons, error: lerr } = await supabase.from('lessons').select('*').eq('course_id', course.id).order('sort_order');
      if (lerr) throw lerr;
      return { ...course, lessons: lessons || [] };
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
    saved: {
      list: async (userId) => fromDb(await supabase.from('user_vocabulary').select('*, vocabulary_entries(*)').eq('user_id', userId)),
      add: async (userId, entryId) => fromDb(await supabase.from('user_vocabulary').insert({ user_id: userId, vocabulary_entry_id: entryId }).select().single()),
      remove: async (userId, entryId) => fromDb(await supabase.from('user_vocabulary').delete().eq('user_id', userId).eq('vocabulary_entry_id', entryId)),
    },
  },
  classroom: {
    list: async () => fromDb(await supabase.from('classroom_phrases').select('*, classroom_phrase_categories(slug, name_vi)').eq('is_published', true).order('sort_order')),
    categories: async () => fromDb(await supabase.from('classroom_phrase_categories').select('*').order('sort_order')),
  },
  quiz: {
    list: async () => fromDb(await supabase.from('quiz_sets').select('*').eq('is_published', true)),
    get: async (slug) => {
      try {
        const quizSet = fromDb(await supabase.from('quiz_sets').select('*').eq('slug', slug).single());
        if (!quizSet) return null;
        const questions = fromDb(await supabase.from('quiz_questions').select('*').eq('quiz_set_id', quizSet.id).order('sort_order'));
        const questionIds = questions.map(q => q.id);
        let optionsMap = {};
        if (questionIds.length) {
          const options = fromDb(await supabase.from('quiz_options').select('*').in('question_id', questionIds).order('sort_order'));
          options.forEach(o => {
            if (!optionsMap[o.question_id]) optionsMap[o.question_id] = [];
            optionsMap[o.question_id].push(o);
          });
        }
        return { ...quizSet, questions: questions.map(q => ({ ...q, options: optionsMap[q.id] || [] })) };
      } catch (e) {
        console.warn('quiz.get failed:', e);
        return null;
      }
    },
  },
  community: {
    _profileMap: async (userIds) => {
      if (!userIds.length) return {};
      const profiles = fromDb(await supabase.from('profiles').select('id, full_name').in('id', userIds));
      const map = {};
      (profiles || []).forEach(p => { map[p.id] = p; });
      return map;
    },
    _initials: (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    posts: {
      list: async (userId) => {
        const posts = fromDb(await supabase.from('community_posts').select('*').order('created_at', { ascending: false }));
        if (!posts?.length) return [];
        const userIds = [...new Set(posts.map(p => p.user_id))];
        const profileMap = await api.community._profileMap(userIds);
        const postIds = posts.map(p => p.id);
        const likes = fromDb(await supabase.from('community_likes').select('post_id').in('post_id', postIds));
        const likeCountMap = {};
        (likes || []).forEach(l => { likeCountMap[l.post_id] = (likeCountMap[l.post_id] || 0) + 1; });
        const comments = fromDb(await supabase.from('community_comments').select('post_id').in('post_id', postIds));
        const commentCountMap = {};
        (comments || []).forEach(c => { commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1; });
        let likedSet = new Set();
        let reportedSet = new Set();
        if (userId) {
          const userLikes = fromDb(await supabase.from('community_likes').select('post_id').eq('user_id', userId));
          likedSet = new Set((userLikes || []).map(l => l.post_id));
          const reports = fromDb(await supabase.from('community_reports').select('post_id').eq('user_id', userId));
          reportedSet = new Set((reports || []).map(r => r.post_id));
        }
        return posts.map(p => ({
          id: p.id, user_id: p.user_id, created_at: p.created_at, content: p.content,
          author_name: profileMap[p.user_id]?.full_name || 'Unknown',
          author_avatar: api.community._initials(profileMap[p.user_id]?.full_name),
          likes_count: likeCountMap[p.id] || 0,
          comments_count: commentCountMap[p.id] || 0, shares_count: 0,
          user_has_liked: likedSet.has(p.id), user_has_reported: reportedSet.has(p.id),
        }));
      },
      create: async (userId, content) => {
        const { data, error } = await supabase.from('community_posts').insert({ user_id: userId, content }).select().single();
        if (error) throw error;
        const profileMap = await api.community._profileMap([userId]);
        return {
          id: data.id, user_id: data.user_id, created_at: data.created_at, content: data.content,
          author_name: profileMap[userId]?.full_name || 'Unknown',
          author_avatar: api.community._initials(profileMap[userId]?.full_name),
          likes_count: 0, comments_count: 0, shares_count: 0,
          user_has_liked: false, user_has_reported: false,
        };
      },
      likeToggle: async (postId, userId) => {
        const existing = fromDb(await supabase.from('community_likes').select('id').eq('post_id', postId).eq('user_id', userId));
        if (existing?.length) {
          await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId);
          return { liked: false };
        }
        await supabase.from('community_likes').insert({ post_id: postId, user_id: userId });
        return { liked: true };
      },
      update: async (postId, userId, content) => fromDb(await supabase.from('community_posts').update({ content }).eq('id', postId).eq('user_id', userId).select().single()),
      delete: async (postId, userId) => fromDb(await supabase.from('community_posts').delete().eq('id', postId).eq('user_id', userId)),
      report: async (postId, userId, reason) => fromDb(await supabase.from('community_reports').insert({ post_id: postId, user_id: userId, reason }).select().single()),
    },
    comments: {
      list: async (postId) => {
        const comments = fromDb(await supabase.from('community_comments').select('*').eq('post_id', postId));
        if (!comments?.length) return [];
        const userIds = [...new Set(comments.map(c => c.user_id))];
        const profileMap = await api.community._profileMap(userIds);
        return comments.map(c => ({
          id: c.id, post_id: c.post_id, user_id: c.user_id, content: c.content, created_at: c.created_at,
          author_name: profileMap[c.user_id]?.full_name || 'Unknown',
          author_avatar: api.community._initials(profileMap[c.user_id]?.full_name),
        }));
      },
      create: async (postId, userId, content) => {
        const { data, error } = await supabase.from('community_comments').insert({ post_id: postId, user_id: userId, content }).select().single();
        if (error) throw error;
        const profileMap = await api.community._profileMap([userId]);
        return {
          id: data.id, post_id: data.post_id, user_id: data.user_id, content: data.content, created_at: data.created_at,
          author_name: profileMap[userId]?.full_name || 'Unknown',
          author_avatar: api.community._initials(profileMap[userId]?.full_name),
        };
      },
      update: async (commentId, userId, content) => fromDb(await supabase.from('community_comments').update({ content }).eq('id', commentId).eq('user_id', userId).select().single()),
      delete: async (commentId, userId) => fromDb(await supabase.from('community_comments').delete().eq('id', commentId).eq('user_id', userId)),
      report: async (commentId, userId, reason) => fromDb(await supabase.from('community_comment_reports').insert({ comment_id: commentId, user_id: userId, reason }).select().single()),
    },
    groups: {
      list: async (userId) => {
        const groups = fromDb(await supabase.from('community_groups').select('*, members:community_group_members(count)').order('name'));
        if (!groups?.length) return [];
        let memberSet = new Set();
        if (userId) {
          const memberships = fromDb(await supabase.from('community_group_members').select('group_id').eq('user_id', userId));
          memberSet = new Set((memberships || []).map(m => m.group_id));
        }
        return groups.map(g => ({
          id: g.id, name: g.name, description: g.description,
          member_count: g.members?.[0]?.count || 0,
          is_member: memberSet.has(g.id),
        }));
      },
      create: async (userId, name, description) => fromDb(await supabase.from('community_groups').insert({ name, description, created_by: userId }).select().single()),
      joinToggle: async (groupId, userId) => {
        const existing = fromDb(await supabase.from('community_group_members').select('id').eq('group_id', groupId).eq('user_id', userId));
        if (existing?.length) {
          await supabase.from('community_group_members').delete().eq('group_id', groupId).eq('user_id', userId);
          return { joined: false };
        }
        await supabase.from('community_group_members').insert({ group_id: groupId, user_id: userId });
        return { joined: true };
      },
    },
    reported: {
      posts: async (userId) => userId ? fromDb(await supabase.from('community_reports').select('post_id').eq('user_id', userId)) : [],
      comments: async (userId) => userId ? fromDb(await supabase.from('community_comment_reports').select('comment_id').eq('user_id', userId)) : [],
    },
  },
  ranking: {
    list: async (limit = 50) => fromDb(await supabase.from('profiles').select('id, full_name, xp').order('xp', { ascending: false }).limit(limit)),
  },
  level: {
    challenges: async () => {
      try {
        const challenges = fromDb(await supabase.from('level_challenges').select('*').eq('is_active', true).order('sort_order'));
        if (!challenges.length) return [];
        const quizIds = challenges.filter(c => c.quiz_set_id).map(c => c.quiz_set_id);
        let quizMap = {};
        if (quizIds.length) {
          const quizSets = fromDb(await supabase.from('quiz_sets').select('id, slug').in('id', quizIds));
          quizSets.forEach(q => { quizMap[q.id] = q.slug; });
        }
        return challenges.map(c => ({ ...c, quiz_slug: quizMap[c.quiz_set_id] || null }));
      } catch (e) {
        console.warn('level.challenges failed:', e);
        return [];
      }
    },
    userChallenges: async () => [],
    complete: async () => {},
  },
};

export { API_BASE };
