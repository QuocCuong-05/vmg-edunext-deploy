import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../lib/icons';
import { api } from '../../lib/api';
import { dispatchAction } from '../../lib/quest-engine';
import Card from '../../components/ui/Card';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../../components/ui/Toast';

const LEVELS = ['All', 'A2', 'B1', 'B2', 'C1'];

export default function Vocabulary() {
  const { user, isPlus } = useAuth();
  const showToast = useToast();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [topic, setTopic] = useState('All');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [busyId, setBusyId] = useState(null);
  const [dispatched, setDispatched] = useState(false);
  const savedIdsRef = useRef(savedIds);
  savedIdsRef.current = savedIds;

  useEffect(() => {
    api.vocabulary.list().then(data => {
      setItems(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && items.length && !dispatched) {
      dispatchAction('vocab_review', { count: items.length });
      setDispatched(true);
    }
  }, [loading, items, dispatched]);

  useEffect(() => {
    if (user?.id) {
      api.vocabulary.saved.list(user.id).then(data => {
        setSavedIds(new Set((data || []).map(s => s.vocabulary_entry_id)));
      }).catch(() => {});
    }
  }, [user?.id]);

  const toggleSave = useCallback(async (entryId) => {
    if (!user?.id || busyId) return;
    const wasSaved = savedIdsRef.current.has(entryId);
    setBusyId(entryId);
    setSavedIds(prev => {
      const next = new Set(prev);
      wasSaved ? next.delete(entryId) : next.add(entryId);
      return next;
    });
    try {
      if (wasSaved) {
        await api.vocabulary.saved.remove(user.id, entryId);
      } else {
        await api.vocabulary.saved.add(user.id, entryId);
      }
    } catch (err) {
      showToast(err.message, 'error');
      setSavedIds(prev => {
        const next = new Set(prev);
        wasSaved ? next.add(entryId) : next.delete(entryId);
        return next;
      });
    } finally {
      setBusyId(null);
    }
  }, [user?.id, busyId, showToast]);

  const savedCount = savedIds.size;

  const topics = useMemo(() => {
    const all = [...new Set(items.map(v => v.topic))].sort();
    return ['All', ...all];
  }, [items]);

  const filtered = items.filter(v => {
    if (level !== 'All' && v.level !== level) return false;
    if (topic !== 'All' && v.topic !== topic) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.word.toLowerCase().includes(s) || v.meaning_vi.includes(s) || v.definition_en.toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.Book size={24} /> Từ vựng giáo dục</h1>
        {!loading && <p>{items.length} từ vựng thiết yếu cho giáo viên song ngữ (A2-C1)</p>}
      </div>

      {!loading && !isPlus && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="pill" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', fontWeight: 800 }}>
            Đã lưu {savedCount}/100 từ vào sổ từ
          </span>
          {savedCount >= 100 && (
            <Link to="/plus" style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>
              Nâng cấp Plus để lưu không giới hạn →
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="empty"><h3>Đang tải...</h3></div>
      ) : (<>
      <div className="filter-bar">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm từ vựng..."
        />
        <select value={level} onChange={e => setLevel(e.target.value)}>
          {LEVELS.map(l => <option key={l} value={l}>{l === 'All' ? 'Tất cả trình độ' : l}</option>)}
        </select>
        <select value={topic} onChange={e => setTopic(e.target.value)}>
          {topics.map(t => <option key={t} value={t}>{t === 'All' ? 'Tất cả chủ đề' : t}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <h3>Không tìm thấy từ vựng</h3>
        </div>
      ) : (
        <div className="vocab-grid">
          {filtered.map(vocab => (
            <Card key={vocab.id} className="vocab-card">
              <div className="vocab-header">
                <span className="vocab-word">{vocab.word}</span>
                <span className="vocab-pos">{vocab.part_of_speech}</span>
                <span className="pill vocab-level">{vocab.level}</span>
                <div style={{ marginLeft: 'auto' }}>
                  <button onClick={() => toggleSave(vocab.id)} className="vocab-bookmark-btn"
                    disabled={busyId === vocab.id}
                    title={busyId === vocab.id ? 'Đang xử lý...' : savedIds.has(vocab.id) ? 'Bỏ lưu' : 'Lưu vào sổ từ'}>
                    {busyId === vocab.id
                      ? <Icon.Loader size={16} />
                      : savedIds.has(vocab.id) ? <Icon.BookmarkFill size={16} /> : <Icon.Bookmark size={16} />}
                  </button>
                </div>
              </div>
              <div className="vocab-meaning">{vocab.meaning_vi}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{vocab.definition_en}</div>
              <div className="vocab-example">{vocab.example_en}</div>
              <div className="vocab-example" style={{ background: 'var(--red-bg)', color: 'var(--muted)' }}>
                {vocab.example_vi}
              </div>
              {vocab.collocation && (
                <div style={{ marginTop: 4 }}>
                  <span className="pill" style={{ fontSize: 10, background: 'var(--red-bg)', color: 'var(--red)' }}>
                    {vocab.collocation}
                  </span>
                  <span className="pill" style={{ fontSize: 10, marginLeft: 4 }}>
                    {vocab.topic}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      </>)}
    </div>
  );
}
