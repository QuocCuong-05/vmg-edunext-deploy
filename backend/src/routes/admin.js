import { Router } from 'express';
import { clearTable, insertRows, TABLES } from '../lib/seedData.js';

const router = Router();

const ALLOWED_TABLES = TABLES.map(t => t.name);

router.post('/import', async (req, res) => {
  try {
    const { table, rows } = req.body;

    if (!table || !rows || !Array.isArray(rows)) {
      return res.status(400).json({ error: 'table (string) and rows (array) are required' });
    }

    if (!ALLOWED_TABLES.includes(table)) {
      return res.status(400).json({ error: `Table "${table}" is not allowed. Allowed: ${ALLOWED_TABLES.join(', ')}` });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'rows array is empty' });
    }

    await clearTable(table);
    await insertRows(table, rows);

    res.json({ imported: rows.length, table });
  } catch (err) {
    console.error('Admin import error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
