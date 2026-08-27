import express from 'express';
import cors from 'cors';
import { PORT } from './config/database.js';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import vocabularyRoutes from './routes/vocabulary.js';
import classroomRoutes from './routes/classroom.js';
import quizRoutes from './routes/quiz.js';
import ttsRoutes from './routes/tts.js';
import vimiAiRoutes from './routes/vimi-ai.js';
import communityRoutes from './routes/community.js';
import tipsRoutes from './routes/tips.js';
import questsRoutes from './routes/quests.js';
import rewardsRoutes from './routes/rewards.js';
import levelRoutes from './routes/level.js';
import adminRoutes from './routes/admin.js';
import orderRoutes from './routes/orders.js';
import cmsRoutes from './routes/cms.js';
import videoRoutes from './routes/videos.js';
import practiceRoutes from './routes/practice.js';
import { authenticate, requireAdmin } from './middleware/auth.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '30mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VMG EduNext API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/classroom', classroomRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/vimi-ai', vimiAiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/quests', questsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/level', levelRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/admin', authenticate, requireAdmin, adminRoutes);

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  const status = typeof err?.status === 'number' ? err.status : 500;
  const body = { error: err?.message || 'Internal server error' };
  if (err?.code) body.code = err.code;
  if (err?.order) body.order = err.order;
  res.status(status).json(body);
});

app.listen(PORT, () => {
  console.log(`\n  ✨ VMG EduNext API running at http://localhost:${PORT}`);
  console.log(`  📚 Health check: http://localhost:${PORT}/api/health\n`);
});
