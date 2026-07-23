import { useState } from 'react';
import { MOCK_PHRASES, MOCK_PHRASE_CATEGORIES } from '../../mock/data';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';

export default function LibraryPage() {
  const [category, setCategory] = useState('All');

  const filtered = category === 'All'
    ? MOCK_PHRASES
    : MOCK_PHRASES.filter(p => p.category_slug === category);

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Classroom size={24} /> Phrase Library
        </h1>
        <p>{MOCK_PHRASES.length} classroom phrases with Vietnamese translations</p>
      </div>

      <div className="filter-bar">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            size="sm"
            variant={category === 'All' ? 'primary' : 'ghost'}
            onClick={() => setCategory('All')}
          >
            All
          </Button>
          {MOCK_PHRASE_CATEGORIES.map(c => (
            <Button
              key={c.slug}
              size="sm"
              variant={category === c.slug ? 'primary' : 'ghost'}
              onClick={() => setCategory(c.slug)}
            >
              {c.name_vi}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h3>No phrases found</h3>
        </div>
      ) : (
        <div className="phrase-list">
          {filtered.map((p, i) => (
            <div key={i} className="phrase-item">
              <div className="phrase-en">{p.phrase_en}</div>
              <div className="phrase-vi">{p.phrase_vi}</div>
              <div className="phrase-footer">
                <span className="phrase-purpose">{p.purpose}</span>
                <span className="pill" style={{ fontSize: 9, padding: '2px 8px' }}>
                  {MOCK_PHRASE_CATEGORIES.find(c => c.slug === p.category_slug)?.name_vi || p.category_slug}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
