import { Router } from 'express';
import { supabase, supabaseAdmin } from '../config/database.js';

const router = Router();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, full_name, school, ward } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: full_name || '' } }
    });

    if (error) return res.status(400).json({ error: error.message });

    if (data.user && (school || ward)) {
      await supabaseAdmin
        .from('profiles')
        .update({ school: school || null, ward: ward || null })
        .eq('id', data.user.id);
    }

    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });
    res.json({ user: data.user, session: data.session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', async (_req, res) => {
  await supabase.auth.signOut();
  res.json({ message: 'Logged out' });
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: error.message });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, avatar_url, role, xp, streak_days, bio, school, ward')
    .eq('id', user.id)
    .maybeSingle();

  res.json({
    user: {
      id: user.id,
      email: user.email,
      ...(profile || {})
    }
  });
});

export default router;
