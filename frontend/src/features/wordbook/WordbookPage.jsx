import { useState, useEffect, useCallback } from 'react';
import { Icon } from '../../lib/icons';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import { useAuth } from '../auth/AuthContext';

const LEVELS = ['All', 'A2', 'B1', 'B2', 'C1'];

export default function WordbookPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    api.vocabulary.saved.list(user.id).then(data => {
      const vocabList = (data || []).filter(s => s.vocabulary_entries).map(s => s.vocabulary_entries);
      setItems(vocabList);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user?.id]);

  const filtered = items.filter(v => {
    if (level !== 'All' && v.level !== level) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.word.toLowerCase().includes(s) || v.meaning_vi.includes(s) || v.definition_en.toLowerCase().includes(s);
    }
    return true;
  });

  const handleRemove = useCallback(async (entryId) => {
    if (!user?.id) return;
    setItems(prev => prev.filter(v => v.id !== entryId));
    try { await api.vocabulary.saved.remove(user.id, entryId); }
    catch { /* revert silently */ }
  }, [user?.id]);

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Book size={24} /> Wordbook
        </h1>
        {!loading && <p>{items.length} saved vocabulary items</p>}
      </div>

      {loading ? (
        <div className="empty"><h3>Đang tải...</h3></div>
      ) : (<>
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
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={() => handleRemove(v.id)} className="vocab-bookmark-btn" title="Bỏ lưu">
                    <Icon.BookmarkFill size={16} />
                  </button>
                </div>
              </div>
              <div className="vocab-meaning">{v.meaning_vi}</div>
              <div className="vocab-def">{v.definition_en}</div>
              <div className="vocab-example">{v.example_en}</div>
            </Card>
          ))}
        </div>
      )}
      </>)}
    </div>
  );
}
