import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

const TYPES = ['blog', 'help', 'policy'];

// GET /api/cms/:type — danh sách published
router.get('/:type', async (req, res, next) => {
  try {
    const type = req.params.type;
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'type không hợp lệ' });
    const { category } = req.query;
    let query = supabase
      .from('content_items')
      .select('id, type, slug, title, excerpt, category, cover_url, author, version, published_at')
      .eq('type', type)
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

// GET /api/cms/:type/:slug — chi tiết published (policy: bản active)
router.get('/:type/:slug', async (req, res, next) => {
  try {
    const { type, slug } = req.params;
    if (!TYPES.includes(type)) return res.status(400).json({ error: 'type không hợp lệ' });

    let query = supabase
      .from('content_items')
      .select('id, type, slug, title, excerpt, body, category, cover_url, author, version, published_at')
      .eq('type', type)
      .eq('slug', slug)
      .eq('status', 'published');
    if (type === 'policy') query = query.eq('is_active', true).order('version', { ascending: false });
    else query = query.order('version', { ascending: false }).limit(1);

    const { data, error } = await query;
    if (error) throw error;
    const item = (data || [])[0];
    if (!item) return res.status(404).json({ error: 'Không tìm thấy nội dung' });
    res.json({ data: item });
  } catch (err) {
    next(err);
  }
});

// GET /api/cms/policy/:slug/active — bản chính sách active (version + title + body)
router.get('/policy/:slug/active', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('content_items')
      .select('id, slug, title, body, version, updated_at')
      .eq('type', 'policy')
      .eq('slug', req.params.slug)
      .eq('is_active', true)
      .eq('status', 'published')
      .order('version', { ascending: false })
      .limit(1);
    if (error) throw error;
    res.json({ data: (data || [])[0] || null });
  } catch (err) {
    next(err);
  }
});

export default router;
