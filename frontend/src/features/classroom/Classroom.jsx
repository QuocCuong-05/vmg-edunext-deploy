import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { dispatchAction } from '../../lib/quest-engine';

export default function Classroom() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [phrases, setPhrases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dispatched, setDispatched] = useState(false);

  useEffect(() => {
    Promise.all([
      api.classroom.list(),
      api.classroom.categories(),
    ]).then(([phraseData, catData]) => {
      setPhrases(phraseData || []);
      setCategories(catData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && phrases.length && !dispatched) {
      dispatchAction('classroom_practice', { count: phrases.length });
      setDispatched(true);
    }
  }, [loading, phrases, dispatched]);

  const filtered = phrases.filter(p => {
    const catSlug = p.classroom_phrase_categories?.slug || null;
    if (category !== 'All' && catSlug !== category) return false;
    if (search) {
      const s = search.toLowerCase();
      return (p.phrase_en || '').toLowerCase().includes(s) || (p.phrase_vi || '').includes(s);
    }
    return true;
  });

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Classroom size={24} /> Classroom English</h1>
        <p>{phrases.length} câu lệnh lớp học song ngữ Anh-Việt</p>
      </div>

      <div className="filter-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm câu lệnh..."
        />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="All">Tất cả giai đoạn</option>
          {categories.map(c => (
            <option key={c.slug} value={c.slug}>{c.name_vi}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty"><h3>Không tìm thấy câu lệnh</h3></div>
      ) : (
        <div className="phrase-list">
          {filtered.map((phrase, i) => (
            <div key={i} className="phrase-item">
              <div className="phrase-en">{phrase.phrase_en}</div>
              <div className="phrase-vi">{phrase.phrase_vi}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span className="phrase-purpose">{phrase.purpose}</span>
                <span className="pill" style={{ fontSize: 9, padding: '2px 8px' }}>
                  {phrase.classroom_phrase_categories?.name_vi || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
