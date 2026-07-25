import { Router } from 'express';
import { supabase } from '../config/database.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Hardcode user_id cho mock data
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

const MOCK_USERS = {
  'p1': { full_name: 'Tran Van An', avatar: 'TA' },
  'p2': { full_name: 'Le Thi Hoa', avatar: 'LH' },
  'p3': { full_name: 'Pham Minh Duc', avatar: 'PD' },
  'p4': { full_name: 'Hoang Ngoc Lan', avatar: 'HL' },
};

const MOCK_POSTS = [
  { id: 'p1', user_id: MOCK_USER_ID, content: 'Just finished the CLIL lesson planning module. The 4Cs framework is a game-changer for my science classes!', created_at: '2026-07-24T08:00:00Z', likes_count: 24, comments_count: 8, user_has_liked: false, author_name: 'Tran Van An', author_avatar: 'TA' },
  { id: 'p2', user_id: MOCK_USER_ID, content: 'Anyone using exit tickets regularly? I found that asking "What is one thing you understood better today?" works really well with my 6th graders.', created_at: '2026-07-24T05:00:00Z', likes_count: 18, comments_count: 12, user_has_liked: false, author_name: 'Le Thi Hoa', author_avatar: 'LH' },
  { id: 'p3', user_id: MOCK_USER_ID, content: 'Tip for new teachers: wait time is your best friend. Count to five silently after asking a question. The quality of answers improves dramatically.', created_at: '2026-07-23T10:00:00Z', likes_count: 42, comments_count: 15, user_has_liked: false, author_name: 'Pham Minh Duc', author_avatar: 'PD' },
  { id: 'p4', user_id: MOCK_USER_ID, content: 'Our school just adopted VMG EduNext for our bilingual program. The teachers are loving the practical phrases for classroom management!', created_at: '2026-07-22T14:00:00Z', likes_count: 31, comments_count: 6, user_has_liked: false, author_name: 'Hoang Ngoc Lan', author_avatar: 'HL' },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'CLIL Teachers Vietnam', description: 'A group for CLIL practitioners', member_count: 1240, is_member: false },
  { id: 'g2', name: 'Classroom English Practitioners', description: 'Share and learn classroom phrases', member_count: 890, is_member: false },
  { id: 'g3', name: 'Bilingual Education Research', description: 'Research and discussion on bilingual ed', member_count: 560, is_member: false },
  { id: 'g4', name: 'Vietnamese Teacher Network', description: 'Connect with teachers across Vietnam', member_count: 2100, is_member: false },
];

// GET / — danh sách bài viết
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('community_posts')
      .select(`
        id, content, created_at, user_id,
        profiles!inner(full_name),
        likes:community_likes(count),
        comments:community_comments(count)
      `)
      .order('created_at', { ascending: false });

    if (error || !posts || posts.length === 0) {
      return res.json(MOCK_POSTS);
    }

    // Lấy danh sách like của user hiện tại (nếu đã login)
    let likedPostIds = [];
    if (req.user) {
      const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', req.user.id);
      likedPostIds = (likes || []).map(l => l.post_id);
    }

    const result = posts.map(p => ({
      id: p.id,
      user_id: p.user_id,
      content: p.content,
      created_at: p.created_at,
      author_name: p.profiles?.full_name || 'Unknown',
      author_avatar: (p.profiles?.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      likes_count: p.likes?.[0]?.count || 0,
      comments_count: p.comments?.[0]?.count || 0,
      user_has_liked: likedPostIds.includes(p.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('[Community] GET / error:', err.message);
    res.json(MOCK_POSTS);
  }
});

// POST / — tạo bài viết mới
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const userId = req.user?.id || MOCK_USER_ID;

    const { data: post, error } = await supabase
      .from('community_posts')
      .insert({ user_id: userId, content: content.trim() })
      .select('id, content, created_at, user_id')
      .single();

    if (error) throw error;

    // Lấy tên user
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    res.json({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      created_at: post.created_at,
      author_name: profile?.full_name || 'Unknown',
      author_avatar: (profile?.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
    });
  } catch (err) {
    console.error('[Community] POST / error:', err.message);
    // Fallback: tạo post giả
    res.json({
      id: 'mock_' + Date.now(),
      user_id: MOCK_USER_ID,
      content: req.body.content,
      created_at: new Date().toISOString(),
      author_name: 'You',
      author_avatar: 'YO',
      likes_count: 0,
      comments_count: 0,
      user_has_liked: false,
    });
  }
});

// POST /:id/like — toggle like
router.post('/:id/like', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || MOCK_USER_ID;
    const postId = req.params.id;

    // Check if already liked
    const { data: existing } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('community_likes')
        .delete()
        .eq('id', existing.id);
      res.json({ liked: false });
    } else {
      await supabase
        .from('community_likes')
        .insert({ post_id: postId, user_id: userId });
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('[Community] POST /:id/like error:', err.message);
    res.json({ liked: true });
  }
});

// GET /:id/comments — lấy comments
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { data: comments, error } = await supabase
      .from('community_comments')
      .select(`
        id, content, created_at, user_id,
        profiles!inner(full_name)
      `)
      .eq('post_id', req.params.id)
      .order('created_at', { ascending: true });

    if (error || !comments) {
      return res.json([]);
    }

    const result = comments.map(c => ({
      id: c.id,
      post_id: req.params.id,
      user_id: c.user_id,
      content: c.content,
      created_at: c.created_at,
      author_name: c.profiles?.full_name || 'Unknown',
      author_avatar: (c.profiles?.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    }));

    res.json(result);
  } catch (err) {
    console.error('[Community] GET /:id/comments error:', err.message);
    res.json([]);
  }
});

// POST /:id/comments — thêm comment
router.post('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const userId = req.user?.id || MOCK_USER_ID;
    const postId = req.params.id;

    const { data: comment, error } = await supabase
      .from('community_comments')
      .insert({ post_id: postId, user_id: userId, content: content.trim() })
      .select('id, content, created_at, user_id')
      .single();

    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();

    res.json({
      id: comment.id,
      post_id: postId,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      author_name: profile?.full_name || 'Unknown',
      author_avatar: (profile?.full_name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    });
  } catch (err) {
    console.error('[Community] POST /:id/comments error:', err.message);
    res.json({
      id: 'mock_c_' + Date.now(),
      post_id: req.params.id,
      user_id: MOCK_USER_ID,
      content: req.body.content,
      created_at: new Date().toISOString(),
      author_name: 'You',
      author_avatar: 'YO',
    });
  }
});

// GET /groups — danh sách groups
router.get('/groups', optionalAuth, async (req, res) => {
  try {
    const { data: groups, error } = await supabase
      .from('community_groups')
      .select(`
        id, name, description, created_at,
        members:community_group_members(count)
      `)
      .order('name');

    if (error || !groups || groups.length === 0) {
      return res.json(MOCK_GROUPS);
    }

    let joinedGroupIds = [];
    if (req.user) {
      const { data: memberships } = await supabase
        .from('community_group_members')
        .select('group_id')
        .eq('user_id', req.user.id);
      joinedGroupIds = (memberships || []).map(m => m.group_id);
    }

    const result = groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description || '',
      member_count: g.members?.[0]?.count || 0,
      is_member: joinedGroupIds.includes(g.id),
    }));

    res.json(result);
  } catch (err) {
    console.error('[Community] GET /groups error:', err.message);
    res.json(MOCK_GROUPS);
  }
});

// POST /groups — tạo group mới
router.post('/groups', optionalAuth, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const userId = req.user?.id || MOCK_USER_ID;

    const { data: group, error } = await supabase
      .from('community_groups')
      .insert({ name: name.trim(), description: description?.trim() || '', created_by: userId })
      .select('id, name, description, created_at')
      .single();

    if (error) throw error;

    // Creator auto-joins
    await supabase
      .from('community_group_members')
      .insert({ group_id: group.id, user_id: userId });

    res.json({
      id: group.id,
      name: group.name,
      description: group.description || '',
      member_count: 1,
      is_member: true,
    });
  } catch (err) {
    console.error('[Community] POST /groups error:', err.message);
    res.json({
      id: 'mock_g_' + Date.now(),
      name: req.body.name,
      description: req.body.description || '',
      member_count: 1,
      is_member: true,
    });
  }
});

// POST /groups/:id/join — toggle join group
router.post('/groups/:id/join', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id || MOCK_USER_ID;
    const groupId = req.params.id;

    const { data: existing } = await supabase
      .from('community_group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('community_group_members')
        .delete()
        .eq('id', existing.id);
      res.json({ joined: false });
    } else {
      await supabase
        .from('community_group_members')
        .insert({ group_id: groupId, user_id: userId });
      res.json({ joined: true });
    }
  } catch (err) {
    console.error('[Community] POST /groups/:id/join error:', err.message);
    res.json({ joined: true });
  }
});

export default router;
