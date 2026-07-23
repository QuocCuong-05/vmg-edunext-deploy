import { useState } from 'react';
import { MOCK_VOCABULARY } from '../../mock/data';
import { Icon } from '../../lib/icons';
import Card from '../../components/ui/Card';

const LEVELS = ['All', 'A2', 'B1', 'B2', 'C1'];

export default function WordbookPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');

  const filtered = MOCK_VOCABULARY.filter(v => {
    if (level !== 'All' && v.level !== level) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.word.toLowerCase().includes(s) || v.meaning_vi.includes(s) || v.definition_en.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Book size={24} /> Wordbook
        </h1>
        <p>{MOCK_VOCABULARY.length} saved vocabulary items</p>
      </div>

      <div className="filter-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vocabulary..."
        />
        <select value={level} onChange={e => setLevel(e.target.value)}>
          {LEVELS.map(l => (
            <option key={l} value={l}>{l === 'All' ? 'All Levels' : l}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h3>No vocabulary found</h3>
        </div>
      ) : (
        <div className="vocab-grid">
          {filtered.map(v => (
            <Card key={v.id} className="vocab-card">
              <div className="vocab-header">
                <span className="vocab-word">{v.word}</span>
                <span className="vocab-pos">{v.part_of_speech}</span>
                <span className="pill vocab-level">{v.level}</span>
              </div>
              <div className="vocab-meaning">{v.meaning_vi}</div>
              <div className="vocab-def">{v.definition_en}</div>
              <div className="vocab-example">{v.example_en}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
