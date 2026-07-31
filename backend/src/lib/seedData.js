import { supabaseAdmin } from '../config/database.js';
import fs from 'fs';
import path from 'path';

const BATCH_SIZE = 500;

function csvEscape(val) {
  if (val == null) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function parseCsv(text) {
  const rows = [];
  const lines = text.replace(/\r\n/g, '\n').split('\n');

  if (lines.length === 0) return rows;

  const headers = splitCsvLine(lines[0]);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, j) => {
      row[h] = values[j] !== undefined ? values[j] : '';
    });
    if (Object.keys(row).length > 0 && Object.values(row).some(v => v !== '')) {
      rows.push(row);
    }
  }

  return rows;
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export const TABLES = [
  {
    name: 'classroom_phrase_categories',
    csv: 'classroom_phrase_categories.csv',
    deleteOrder: 1,
    importOrder: 1,
    idInCsv: true,
    onConflict: 'slug',
    selectColumns: 'id, slug, name_vi, sort_order, icon',
  },
  {
    name: 'classroom_phrases',
    csv: 'classroom_phrases.csv',
    deleteOrder: 2,
    importOrder: 2,
    idInCsv: false,
    onConflict: 'phrase_en',
    selectColumns: 'category_id, phrase_en, phrase_vi, purpose, level, sort_order, is_published',
  },
  {
    name: 'quiz_sets',
    csv: 'quiz_sets.csv',
    deleteOrder: 8,
    importOrder: 3,
    idInCsv: true,
    onConflict: 'slug',
    selectColumns: 'id, title, slug, description, passing_score, xp_reward, level, question_count, is_published',
  },
  {
    name: 'quiz_questions',
    csv: 'quiz_questions.csv',
    deleteOrder: 7,
    importOrder: 4,
    idInCsv: true,
    onConflict: 'quiz_set_id,prompt',
    selectColumns: 'id, quiz_set_id, prompt, prompt_translation, correct_answer, explanation, explanation_vi, competency_code, level, sort_order',
  },
  {
    name: 'quiz_options',
    csv: 'quiz_options.csv',
    deleteOrder: 6,
    importOrder: 5,
    idInCsv: false,
    onConflict: 'question_id,option_text',
    selectColumns: 'question_id, option_text, is_correct, feedback_correct, feedback_incorrect, sort_order',
  },
  {
    name: 'vocabulary_entries',
    csv: 'vocabulary_entries.csv',
    deleteOrder: 3,
    importOrder: 6,
    idInCsv: false,
    onConflict: 'word,part_of_speech',
    selectColumns: 'word, part_of_speech, level, meaning_vi, definition_en, example_en, example_vi, collocation, topic, is_published',
  },
  {
    name: 'tips',
    csv: 'tips.csv',
    deleteOrder: 4,
    importOrder: 7,
    idInCsv: false,
    onConflict: 'title',
    selectColumns: 'title, content, category, is_published',
  },
  {
    name: 'quests',
    csv: 'quests.csv',
    deleteOrder: 5,
    importOrder: 8,
    idInCsv: true,
    onConflict: 'id',
    selectColumns: 'id, type, title, desc_text, xp, is_active',
  },
  {
    name: 'rewards',
    csv: 'rewards.csv',
    deleteOrder: 9,
    importOrder: 9,
    idInCsv: false,
    onConflict: 'name',
    selectColumns: 'name, desc_text, price, icon_type, content_type, content_json, stock, is_active',
  },
  {
    name: 'courses',
    csv: 'courses.csv',
    deleteOrder: 11,
    importOrder: 10,
    idInCsv: true,
    onConflict: 'slug',
    selectColumns: 'id, title, slug, description, level, category, duration_hours, lesson_count, instructor, is_published',
  },
  {
    name: 'lessons',
    csv: 'lessons.csv',
    deleteOrder: 10,
    importOrder: 11,
    idInCsv: false,
    onConflict: 'course_id,slug',
    selectColumns: 'course_id, title, slug, description, sort_order, content_type, video_url, video_duration_seconds, article_body, is_free',
  },
  {
    name: 'level_challenges',
    csv: 'level_challenges.csv',
    deleteOrder: 12,
    importOrder: 12,
    idInCsv: false,
    onConflict: 'title',
    selectColumns: 'title, description, xp_reward, quiz_set_id, level_min, sort_order, is_active',
  },
];

const by = (orderKey) => TABLES.filter(t => t[orderKey] > 0).sort((a, b) => a[orderKey] - b[orderKey]);

export async function clearTable(tableName) {
  const { error } = await supabaseAdmin
    .from(tableName)
    .delete()
    .gte('created_at', '1970-01-01');

  if (error) throw error;
}

export async function insertRows(tableName, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const cleaned = batch.map(row => cleanRow(row));
    const { error } = await supabaseAdmin.from(tableName).insert(cleaned);
    if (error) throw error;
  }
}

export async function upsertRows(tableName, rows) {
  const t = TABLES.find(t => t.name === tableName);
  if (!t || !t.onConflict) throw new Error(`Table ${tableName} has no onConflict key`);
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const cleaned = batch.map(row => cleanRow(row));
    const { error } = await supabaseAdmin
      .from(tableName)
      .upsert(cleaned, { onConflict: t.onConflict, ignoreDuplicates: true });
    if (error) throw error;
  }
}

export async function importTable(tableName, rows, mode = 'replace') {
  if (mode === 'replace') {
    await clearTable(tableName);
    await insertRows(tableName, rows);
  } else if (mode === 'append') {
    await upsertRows(tableName, rows);
  } else {
    throw new Error(`Unknown import mode: ${mode}`);
  }
  return { table: tableName, count: rows.length, mode };
}

function cleanRow(row) {
  const cleaned = {};
  for (const [key, value] of Object.entries(row)) {
    if (value === 'true') cleaned[key] = true;
    else if (value === 'false') cleaned[key] = false;
    else if (value === '' || value === undefined || value === null) continue;
    else if (!isNaN(value) && value !== '' && typeof value === 'string') {
      cleaned[key] = Number(value);
    }
    else cleaned[key] = value;
  }
  return cleaned;
}

export async function seedAll(csvDir) {
  const colsToTables = {};
  for (const t of TABLES) {
    colsToTables[t.selectColumns] = t.name;
  }

  const result = { cleared: [], imported: [] };

  for (const t of by('deleteOrder')) {
    await clearTable(t.name);
    result.cleared.push(t.name);
  }

  for (const t of by('importOrder')) {
    const csvPath = path.join(csvDir, t.csv);
    if (!fs.existsSync(csvPath)) {
      console.warn(`  ⚠ Missing CSV: ${t.csv}, skipping`);
      continue;
    }
    const text = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCsv(text);
    if (rows.length === 0) continue;
    await insertRows(t.name, rows);
    result.imported.push({ table: t.name, count: rows.length });
  }

  return result;
}

export async function exportTable(tableName, outputDir) {
  const t = TABLES.find(t => t.name === tableName);
  if (!t) throw new Error(`Unknown table: ${tableName}`);

  const cols = t.selectColumns.split(',').map(c => c.trim());
  let query = supabaseAdmin.from(tableName).select(t.selectColumns);

  if (t.selectColumns.includes('sort_order')) {
    query = query.order('sort_order', { ascending: true });
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data || data.length === 0) {
    fs.writeFileSync(path.join(outputDir, t.csv), cols.join(',') + '\n');
    return { table: tableName, count: 0 };
  }

  const header = cols.join(',');
  const lines = data.map(row => {
    const sortedCols = t.selectColumns.split(',').map(c => c.trim());
    return sortedCols.map(c => csvEscape(row[c])).join(',');
  });

  fs.writeFileSync(
    path.join(outputDir, t.csv),
    header + '\n' + lines.join('\n') + '\n'
  );

  return { table: tableName, count: data.length };
}

export async function exportAll(outputDir) {
  const result = [];
  for (const t of by('importOrder')) {
    const r = await exportTable(t.name, outputDir);
    result.push(r);
  }
  return result;
}
