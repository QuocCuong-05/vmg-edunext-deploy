import { Router } from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/lessons/:id — single lesson detail
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Lesson not found' });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/lessons/:id/progress — update lesson progress
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const { completed, watched_seconds, score } = req.body;

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert({
        user_id: req.user.id,
        lesson_id: req.params.id,
        completed: completed || false,
        watched_seconds: watched_seconds || 0,
        score: score || null,
        completed_at: completed ? new Date().toISOString() : null
      }, { onConflict: 'user_id, lesson_id' })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
