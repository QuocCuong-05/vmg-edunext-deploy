import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { topic, level, search } = req.query;
    let query = supabase.from('vocabulary_entries').select('*').eq('status', 'published');

    if (topic) query = query.eq('topic', topic);
    if (level) query = query.eq('level', level);
    if (search) query = query.or(`word.ilike.%${search}%,meaning_vi.ilike.%${search}%`);

    const { data, error } = await query.order('word');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/topics', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('vocabulary_entries')
      .select('topic')
      .eq('status', 'published');

    if (error) return res.status(400).json({ error: error.message });
    const topics = [...new Set(data.map(d => d.topic))].sort();
    res.json({ data: topics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/vocabulary/mine-count — số từ đã lưu vào sổ từ
router.get('/mine-count', authenticate, async (req, res, next) => {
  try {
    const { count, error } = await supabaseAdmin
      .from('user_vocabulary')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
