import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import { Icon } from '../../lib/icons';
import PublicNav from '../layout/PublicNav';

const HELP_CATEGORIES = [
  { key: 'Học tập', icon: Icon.Book },
  { key: 'Thanh toán', icon: Icon.CartAlt },
  { key: 'Tài khoản', icon: Icon.User },
  { key: 'Kỹ thuật', icon: Icon.Cog },
];

export default function HelpPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cms.list('help').then(list => {
      setArticles((list || []).filter(a => a.slug !== 'faq'));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const searched = q
    ? articles.filter(a => (a.title || '').toLowerCase().includes(q) || (a.excerpt || '').toLowerCase().includes(q))
    : null;

  if (loading) {
    return (
      <>
        <PublicNav />
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      </>
    );
  }

  if (active) {
    return (
      <>
        <PublicNav />
        <div className="main-public" style={{ maxWidth: 720, margin: '0 auto' }}>
          <button onClick={() => setActive(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 20, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer' }}>
            <Icon.ArrowLeft size={14} /> Quay lại trợ giúp
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>{active.title}</h1>
          <div className="article-content" dangerouslySetInnerHTML={{ __html: active.body || '' }} />
        </div>
      </>
    );
  }

  const categoryCount = key => articles.filter(a => a.category === key).length;
  const latest = articles.slice(0, 5);

  return (
    <>
      <PublicNav />
      <div style={{ background: 'linear-gradient(135deg, #991b2f, #cf1838)', color: '#fff', padding: '48px 24px 56px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10 }}>Trung tâm trợ giúp</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginBottom: 24 }}>
          Tìm câu trả lời cho các câu hỏi về khóa học, thanh toán và tài khoản của bạn.
        </p>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', background: '#fff', borderRadius: 999, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.18)' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm trợ giúp..."
            style={{ flex: 1, border: 'none', outline: 'none', padding: '13px 18px', fontSize: 14, color: 'var(--ink)', background: 'transparent' }}
          />
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 16px', color: 'var(--red)' }}><Icon.Search size={18} /></span>
        </div>
      </div>

      <div className="main-public" style={{ maxWidth: 860, margin: '0 auto' }}>
        {searched !== null ? (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>
              Kết quả tìm kiếm "{search}" ({searched.length})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {searched.map(a => (
                <Card key={a.id} style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => setActive(a)}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                  {a.excerpt && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{a.excerpt}</div>}
                </Card>
              ))}
              {searched.length === 0 && <div className="empty" style={{ minHeight: '30vh' }}><h3>Không tìm thấy kết quả phù hợp.</h3></div>}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Danh mục</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
              {HELP_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  onClick={() => {
                    setSearch('');
                    const first = articles.find(a => a.category === c.key);
                    if (first) setActive(first);
                  }}
                  style={{
                    background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 14,
                    padding: '18px 14px', cursor: 'pointer', textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(25,37,60,.04)',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--red-bg)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <c.icon size={18} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.key}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{categoryCount(c.key)} bài viết</div>
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>Bài viết mới nhất</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {latest.map(a => (
                <Card key={a.id} style={{ padding: '16px 18px', cursor: 'pointer' }} onClick={() => setActive(a)}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                  {a.excerpt && <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{a.excerpt}</div>}
                </Card>
              ))}
            </div>
          </>
        )}

        <div style={{ textAlign: 'center', margin: '32px 0 12px' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            ← Về trang chủ
          </button>
        </div>
      </div>
    </>
  );
}
