import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { category, level, search } = req.query;
    let query = supabase.from('classroom_phrases').select(`
      *,
      classroom_phrase_categories!inner(slug, name_vi)
    `).eq('is_published', true);

    if (category) query = query.eq('classroom_phrase_categories.slug', category);
    if (level) query = query.eq('level', level);
    if (search) query = query.or(`phrase_en.ilike.%${search}%,phrase_vi.ilike.%${search}%`);

    const { data, error } = await query.order('phrase_en');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/categories', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('classroom_phrase_categories')
      .select('*')
      .order('sort_order');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
