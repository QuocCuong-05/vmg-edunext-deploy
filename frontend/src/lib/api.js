import { supabase } from './supabase';
import {
  getMockPosts, createMockPost, updateMockPost, deleteMockPost,
  toggleMockLike, reportMockPost,
  getMockComments, createMockComment, updateMockComment, deleteMockComment, reportMockComment,
  getMockReportedPosts, getMockReportedComments,
  getMockProfile,
  followMockUser, unfollowMockUser, isMockFollowing, getMockFollowing, getMockFollowers,
  sendMockRemind, getMockNotifications, markMockNotificationsRead,
} from '../mock/community';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
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

export async function notifyPostOwner(postId, actorId, type) {
  try {
    const { data: post, error } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', postId)
      .maybeSingle();
    if (error || !post?.user_id || post.user_id === actorId) return;
    await supabase.from('notifications').insert({
      user_id: post.user_id,
      from_user_id: actorId,
      type,
      message: '',
    });
  } catch {
    // notification failure must not break the main action
  }
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
    list: async () => request('/courses'),
    get: async (slug) => request(`/courses/${slug}`),
    progress: async (courseId) => request(`/courses/${courseId}/progress`),
  },
  lessons: {
    progress: async (lessonId, data) =>
      request(`/lessons/${lessonId}/progress`, { method: 'POST', body: JSON.stringify(data) }),
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
    canAdd: async (userId) => {
      const { data, error } = await supabase.rpc('check_wordbook_limit', { p_user_id: userId });
      if (error) throw error;
      return !!data;
    },
    saved: {
      list: async (userId) => fromDb(await supabase.from('user_vocabulary').select('*, vocabulary_entries(*)').eq('user_id', userId)),
      add: async (userId, entryId) => {
        if (!(await api.vocabulary.canAdd(userId))) {
          throw new Error('Sổ từ đã đạt giới hạn 100 từ. Nâng cấp Plus để lưu không giới hạn.');
        }
        return fromDb(await supabase.from('user_vocabulary').insert({ user_id: userId, vocabulary_entry_id: entryId }).select().single());
      },
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
    submit: async (quizSetId, answers) =>
      request('/quiz/submit', { method: 'POST', body: JSON.stringify({ quiz_set_id: quizSetId, answers }) }),
    attempts: async () => request('/quiz/attempts'),
  },
  community: {
    posts: {
      list: async (userId, topic) => {
        try {
          let q = supabase.from('community_posts').select('*');
          if (topic) q = q.eq('topic', topic);
          const posts = fromDb(await q.order('created_at', { ascending: false }));
          if (!posts?.length) return [];
          const userIds = [...new Set(posts.map(p => p.user_id))];
          const profiles = userIds.length ? fromDb(await supabase.from('profiles').select('id, full_name').in('id', userIds)) : [];
          const profileMap = {};
          (profiles || []).forEach(p => { profileMap[p.id] = p; });
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
          const _initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return posts.map(p => ({
            id: p.id, user_id: p.user_id, created_at: p.created_at, content: p.content, topic: p.topic || 'General',
            author_name: profileMap[p.user_id]?.full_name || 'Unknown',
            author_avatar: _initials(profileMap[p.user_id]?.full_name),
            likes_count: likeCountMap[p.id] || 0,
            comments_count: commentCountMap[p.id] || 0, shares_count: 0,
            user_has_liked: likedSet.has(p.id), user_has_reported: reportedSet.has(p.id),
          }));
        } catch {
          return getMockPosts(userId, topic);
        }
      },
      create: async (userId, content, topic) => {
        try {
          const { data, error } = await supabase.from('community_posts').insert({ user_id: userId, content, topic: topic || 'General' }).select().single();
          if (error) throw error;
          const profiles = fromDb(await supabase.from('profiles').select('id, full_name').eq('id', userId));
          const _initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return {
            id: data.id, user_id: data.user_id, created_at: data.created_at, content: data.content, topic: data.topic || 'General',
            author_name: profiles?.[0]?.full_name || 'Unknown',
            author_avatar: _initials(profiles?.[0]?.full_name),
            likes_count: 0, comments_count: 0, shares_count: 0,
            user_has_liked: false, user_has_reported: false,
          };
        } catch {
          return createMockPost(userId, content, topic);
        }
      },
      likeToggle: async (postId, userId) => {
        try {
          const existing = fromDb(await supabase.from('community_likes').select('id').eq('post_id', postId).eq('user_id', userId));
          if (existing?.length) {
            await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId);
            return { liked: false };
          }
          await supabase.from('community_likes').insert({ post_id: postId, user_id: userId });
          await notifyPostOwner(postId, userId, 'like');
          return { liked: true };
        } catch {
          return toggleMockLike(postId, userId);
        }
      },
      update: async (postId, userId, content) => {
        try {
          return fromDb(await supabase.from('community_posts').update({ content }).eq('id', postId).eq('user_id', userId).select().single());
        } catch {
          return updateMockPost(postId, userId, content);
        }
      },
      delete: async (postId, userId) => {
        try {
          return fromDb(await supabase.from('community_posts').delete().eq('id', postId).eq('user_id', userId));
        } catch {
          return deleteMockPost(postId, userId);
        }
      },
      report: async (postId, userId, reason) => {
        try {
          return fromDb(await supabase.from('community_reports').insert({ post_id: postId, user_id: userId, reason }).select().single());
        } catch {
          return reportMockPost(postId, userId, reason);
        }
      },
    },
    comments: {
      list: async (postId) => {
        try {
          const comments = fromDb(await supabase.from('community_comments').select('*').eq('post_id', postId));
          if (!comments?.length) return [];
          const userIds = [...new Set(comments.map(c => c.user_id))];
          const profiles = userIds.length ? fromDb(await supabase.from('profiles').select('id, full_name').in('id', userIds)) : [];
          const profileMap = {};
          (profiles || []).forEach(p => { profileMap[p.id] = p; });
          const _initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return comments.map(c => ({
            id: c.id, post_id: c.post_id, user_id: c.user_id, content: c.content, created_at: c.created_at,
            author_name: profileMap[c.user_id]?.full_name || 'Unknown',
            author_avatar: _initials(profileMap[c.user_id]?.full_name),
          }));
        } catch {
          return getMockComments(postId);
        }
      },
      create: async (postId, userId, content) => {
        try {
          const { data, error } = await supabase.from('community_comments').insert({ post_id: postId, user_id: userId, content }).select().single();
          if (error) throw error;
          await notifyPostOwner(postId, userId, 'comment');
          const profiles = fromDb(await supabase.from('profiles').select('id, full_name').eq('id', userId));
          const _initials = (name) => (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return {
            id: data.id, post_id: data.post_id, user_id: data.user_id, content: data.content, created_at: data.created_at,
            author_name: profiles?.[0]?.full_name || 'Unknown',
            author_avatar: _initials(profiles?.[0]?.full_name),
          };
        } catch {
          return createMockComment(postId, userId, content);
        }
      },
      update: async (commentId, userId, content) => {
        try {
          return fromDb(await supabase.from('community_comments').update({ content }).eq('id', commentId).eq('user_id', userId).select().single());
        } catch {
          return updateMockComment(commentId, userId, content);
        }
      },
      delete: async (commentId, userId) => {
        try {
          return fromDb(await supabase.from('community_comments').delete().eq('id', commentId).eq('user_id', userId));
        } catch {
          return deleteMockComment(commentId, userId);
        }
      },
      report: async (commentId, userId, reason) => {
        try {
          return fromDb(await supabase.from('community_comment_reports').insert({ comment_id: commentId, user_id: userId, reason }).select().single());
        } catch {
          return reportMockComment(commentId, userId, reason);
        }
      },
    },
    reported: {
      posts: async (userId) => {
        if (!userId) return [];
        try {
          return fromDb(await supabase.from('community_reports').select('post_id').eq('user_id', userId));
        } catch {
          return getMockReportedPosts(userId).map(id => ({ post_id: id }));
        }
      },
      comments: async (userId) => {
        if (!userId) return [];
        try {
          return fromDb(await supabase.from('community_comment_reports').select('comment_id').eq('user_id', userId));
        } catch {
          return getMockReportedComments(userId).map(id => ({ comment_id: id }));
        }
      },
    },
  },
  users: {
    profile: async (userId) => {
      try {
        const profile = fromDb(await supabase.from('profiles').select('id, full_name, xp, school, ward').eq('id', userId).single());
        const { count: followersCount } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
        const { count: followingCount } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);
        return { ...profile, followers_count: followersCount || 0, following_count: followingCount || 0, streak_days: 0, last_login: null };
      } catch {
        return getMockProfile(userId);
      }
    },
    follow: async (followerId, followingId) => {
      try {
        const { error } = await supabase.from('user_follows').insert({ follower_id: followerId, following_id: followingId });
        if (error) throw error;
        if (followerId !== followingId) {
          await supabase.from('notifications').insert({
            user_id: followingId,
            from_user_id: followerId,
            type: 'follow',
            message: '',
          });
        }
      } catch {
        followMockUser(followerId, followingId);
      }
    },
    unfollow: async (followerId, followingId) => {
      try {
        const { error } = await supabase.from('user_follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
        if (error) throw error;
      } catch {
        unfollowMockUser(followerId, followingId);
      }
    },
    isFollowing: async (followerId, followingId) => {
      if (!followerId) return false;
      try {
        const { data, error } = await supabase.from('user_follows').select('follower_id').eq('follower_id', followerId).eq('following_id', followingId).maybeSingle();
        if (error) throw error;
        return !!data;
      } catch {
        return isMockFollowing(followerId, followingId);
      }
    },
    following: async (userId) => {
      try {
        return fromDb(await supabase.from('user_follows').select('following_id').eq('follower_id', userId));
      } catch {
        return getMockFollowing(userId);
      }
    },
    followers: async (userId) => {
      try {
        return fromDb(await supabase.from('user_follows').select('follower_id').eq('following_id', userId));
      } catch {
        return getMockFollowers(userId);
      }
    },
    remind: async (reminderId, targetId) => {
      try {
        const { error } = await supabase.from('notifications').insert({ user_id: targetId, from_user_id: reminderId, type: 'remind', message: '' });
        if (error) throw error;
      } catch {
        sendMockRemind(reminderId, targetId);
      }
    },
    notifications: async (userId) => {
      try {
        return fromDb(await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }));
      } catch {
        return getMockNotifications(userId);
      }
    },
    markNotificationsRead: async (userId) => {
      try {
        const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
        if (error) throw error;
      } catch {
        markMockNotificationsRead(userId);
      }
    },
  },
  orders: {
    create: async (courseId, method = 'bank_transfer') =>
      request('/orders/create', { method: 'POST', body: JSON.stringify({ course_id: courseId, method }) }),
    createPlus: async (period) =>
      request('/orders/create', { method: 'POST', body: JSON.stringify({ plan: 'plus', period }) }),
    confirmTransfer: async (orderId) =>
      request(`/orders/${orderId}/confirm-transfer`, { method: 'POST' }),
    mine: async () => request('/orders/mine'),
    publicSettings: async () => request('/orders/public-settings'),
    approveInfo: async (orderId, token) =>
      request(`/orders/${orderId}/approve-info?token=${encodeURIComponent(token)}`),
    approve: async (orderId, token) =>
      request(`/orders/${orderId}/approve?token=${encodeURIComponent(token)}`, { method: 'POST' }),
  },
  videos: {
    token: async (lessonId) => request(`/videos/token/${lessonId}`),
  },
  unlock: {
    courseIds: async (userId) => {
      const { data, error } = await supabase.from('enrollments').select('course_id').eq('user_id', userId);
      if (error) throw error;
      return new Set((data || []).map(e => e.course_id));
    },
  },
  admin: {
    orders: async () => request('/admin/orders'),
    approveOrder: async (id) => request(`/admin/orders/${id}/approve`, { method: 'POST' }),
    dashboardStats: async () => request('/admin/dashboard-stats'),
    setPaidCourse: async (courseId, price, salePrice) =>
      request('/admin/courses/paid', { method: 'POST', body: JSON.stringify({ course_id: courseId, price, sale_price: salePrice }) }),
    setFreeCourse: async (courseId) =>
      request('/admin/courses/free', { method: 'POST', body: JSON.stringify({ course_id: courseId }) }),
    setPreview: async (lessonId, previewText) =>
      request('/admin/courses/preview', { method: 'POST', body: JSON.stringify({ lesson_id: lessonId, preview_text: previewText }) }),
    settings: async () => request('/admin/settings'),
    saveSetting: async (key, value) =>
      request('/admin/settings', { method: 'POST', body: JSON.stringify({ key, value }) }),
    subscriptions: async () => request('/admin/subscriptions'),
    activateSubscription: async (userId, period) =>
      request('/admin/subscriptions/activate', { method: 'POST', body: JSON.stringify({ user_id: userId, period }) }),
    renewSubscription: async (id) =>
      request(`/admin/subscriptions/${id}/renew`, { method: 'POST' }),
    cancelSubscription: async (id) =>
      request(`/admin/subscriptions/${id}/cancel`, { method: 'POST' }),
  },
  ranking: {
    list: async ({ ward, school, limit = 50 } = {}) => {
      let q = supabase.from('profiles').select('id, full_name, xp, school, ward').order('xp', { ascending: false }).limit(limit);
      if (ward) q = q.eq('ward', ward);
      if (school) q = q.eq('school', school);
      return fromDb(await q);
    },
    schools: async (wardName) => {
      let q = supabase.from('schools').select('*');
      if (wardName) q = q.eq('ward_name', wardName);
      return fromDb(await q.order('name'));
    },
    wards: async () => fromDb(await supabase.from('wards').select('*').order('name')),
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
