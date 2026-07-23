// Run with: node src/seed/seed.js
// This seed script is for local/in-memory demo data
// For production, use the SQL files in /supabase/

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../supabase');

console.log('\n  📦 VMG EduNext — Seed Data Generator');
console.log('  =====================================\n');

const files = [
  { name: 'schema.sql', description: 'Database schema (courses, lessons, enrollments)' },
  { name: 'seed_lms.sql', description: 'LMS seed data (6 courses, 34 lessons)' },
];

files.forEach(f => {
  const fullPath = path.join(DATA_DIR, f.name);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    console.log(`  ✅ ${f.name} (${(stats.size / 1024).toFixed(1)} KB) — ${f.description}`);
  } else {
    console.log(`  ❌ ${f.name} — File not found`);
  }
});

console.log('\n  📋 To apply to Supabase:');
console.log('   1. Open Supabase SQL Editor');
console.log('   2. Run supabase/schema.sql first');
console.log('   3. Then run supabase/seed_lms.sql');
console.log('   4. Then run the existing content SQL files (04-08)\n');

console.log('  📋 For local development without Supabase:');
console.log('   cd frontend && npm run dev\n');
