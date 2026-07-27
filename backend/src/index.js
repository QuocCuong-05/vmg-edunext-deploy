import express from 'express';
import cors from 'cors';
import { PORT } from './config/database.js';

import authRoutes from './routes/auth.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import vimiRoutes from './routes/vimi.js';
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

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'VMG EduNext API', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/vimi', vimiRoutes);
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

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`\n  ✨ VMG EduNext API running at http://localhost:${PORT}`);
  console.log(`  📚 Health check: http://localhost:${PORT}/api/health\n`);
});
