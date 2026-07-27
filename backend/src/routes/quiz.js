import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

router.get('/sets', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('quiz_sets')
      .select('*')
      .eq('is_published', true)
      .order('title');

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/sets/:slug', async (req, res) => {
  try {
    const { data: set, error: setError } = await supabase
      .from('quiz_sets')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (setError) return res.status(404).json({ error: 'Quiz set not found' });

    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*, quiz_options(*)')
      .eq('quiz_set_id', set.id)
      .order('sort_order');

    if (qError) return res.status(400).json({ error: qError.message });
    res.json({ data: { ...set, questions } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
