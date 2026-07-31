import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_DIR = path.resolve(__dirname, '../../supabase/csv');

const args = process.argv.slice(2);
const envArg = args.find(a => a.startsWith('--env='));
const modeArg = args.find(a => a.startsWith('--mode='));

const env = envArg ? envArg.split('=')[1] : null;
const mode = modeArg ? modeArg.split('=')[1] : (args.includes('--export') ? 'export' : 'seed');

if (!env || !['staging', 'production'].includes(env)) {
  console.error('Usage: node src/seed/seed.js --env=staging|production [--mode=seed|export]');
  console.error('  --env=staging     Target staging Supabase (.env.staging)');
  console.error('  --env=production  Target production Supabase (.env.production)');
  process.exit(1);
}

const envFile = path.resolve(__dirname, `../../.env.${env}`);
const result = dotenv.config({ path: envFile, override: true });

if (result.error) {
  console.error(`Cannot load env file: ${envFile}`);
  console.error('Create .env.staging and .env.production with SUPABASE_URL + SUPABASE_SERVICE_KEY');
  process.exit(1);
}

console.log(`\n  📦 VMG EduNext — ${mode === 'export' ? 'Export' : 'Seed'} Data (${env.toUpperCase()})`);
console.log(`  Supabase: ${process.env.SUPABASE_URL || '(not set)'}`);
console.log('');

try {
  const { seedAll, exportAll } = await import('../lib/seedData.js');

  if (mode === 'export') {
    const results = await exportAll(CSV_DIR);
    console.log('  ✅ Export complete:');
    for (const r of results) {
      console.log(`     ${r.table}: ${r.count} rows → ${r.table.replace(/_/g, '-')}.csv`);
    }
  } else {
    const results = await seedAll(CSV_DIR);
    console.log('  🧹 Cleared:', results.cleared.join(', '));
    console.log('  ⬇ Imported:');
    for (const r of results.imported) {
      console.log(`     ${r.table}: ${r.count} rows`);
    }
  }
  console.log('\n  ✨ Done.\n');
} catch (err) {
  console.error(`\n  ❌ ${mode === 'export' ? 'Export' : 'Seed'} failed:`);
  console.error(`     ${err.message}`);
  process.exit(1);
}
