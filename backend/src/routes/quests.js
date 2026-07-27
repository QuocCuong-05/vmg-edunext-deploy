import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type;
    let query = supabase
      .from('quests')
      .select('*')
      .eq('is_active', true)
      .order('xp', { ascending: true });

    if (type === 'daily' || type === 'weekly') {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
