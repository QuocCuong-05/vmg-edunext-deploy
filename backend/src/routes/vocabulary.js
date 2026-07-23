import { Router } from 'express';
import { supabase } from '../config/database.js';

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

export default router;
