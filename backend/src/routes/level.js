import { Router } from 'express';
import { supabase } from '../config/database.js';

const router = Router();

router.get('/challenges', async (_req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('level_challenges')
      .select('*, quiz_sets!left(slug)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    const result = (data || []).map(c => ({
      ...c,
      quiz_slug: c.quiz_sets?.slug || null,
      quiz_sets: undefined,
    }));
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
});

router.get('/challenges/user', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.json([]);

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.json({ data: [] });

    const { data, error } = await supabase
      .from('user_challenges')
      .select('challenge_id, completed, completed_at')
      .eq('user_id', user.id);

    if (error) throw error;
    res.json({ data: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post('/challenges/:id/complete', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const { data: challenge, error: chalErr } = await supabase
      .from('level_challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (chalErr || !challenge) return res.status(404).json({ error: 'Challenge not found' });

    const { data: existing } = await supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', id)
      .maybeSingle();

    if (existing) return res.status(409).json({ error: 'Challenge already completed' });

    await supabase
      .from('user_challenges')
      .insert({ user_id: user.id, challenge_id: id, completed: true, completed_at: new Date().toISOString() });

    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('xp')
      .eq('id', user.id)
      .single();

    const currentXp = profile?.xp || 0;
    const newXp = currentXp + challenge.xp_reward;

    await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', user.id);

    const level = Math.floor(newXp / 3000) + 1;

    res.json({ data: { xp: newXp, level, xp_earned: challenge.xp_reward } });
  } catch (err) {
    next(err);
  }
});

export default router;
