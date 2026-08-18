import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import PublicNav from '../layout/PublicNav';

export default function BlogPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [filter, setFilter] = useState('Tất cả');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cms.list('blog').then(setArticles).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const categories = ['Tất cả', ...new Set(articles.map(a => a.category).filter(Boolean))];
  const filtered = filter === 'Tất cả' ? articles : articles.filter(a => a.category === filter);

  return (
    <>
      <PublicNav />
      <div className="main-public" style={{ maxWidth: 860, margin: '0 auto' }}>
        <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Kiến thức giáo dục
        </h1>
        <p>Kho bài viết, nghiên cứu ứng dụng và xu hướng giúp giáo viên phát triển nghề nghiệp liên tục.</p>
      </div>

      {categories.length > 1 && (
        <Card style={{ marginBottom: 18, padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(c => (
              <button
                key={c}
                className={`pill ${filter === c ? 'pill-active' : ''}`}
                onClick={() => setFilter(c)}
                style={{ cursor: 'pointer', border: 'none', background: filter === c ? 'var(--red)' : 'var(--surface)', color: filter === c ? '#fff' : 'var(--ink)', padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}
              >
                {c}
              </button>
            ))}
          </div>
        </Card>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ minHeight: '40vh' }}>
          <h3>Chưa có bài viết nào.</h3>
        </div>
      ) : (
        <div className="blog-grid">
          {filtered.map(a => (
            <Card key={a.id} className="blog-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => navigate(`/blog/${a.slug}`)}>
              <div
                className="blog-cover"
                style={{
                  background: a.cover_url
                    ? `url(${a.cover_url}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #1a2639, #2c4063)',
                  color: 'rgba(255,255,255,.7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120,
                }}
              >
                {!a.cover_url && <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: .5 }}>{a.category || 'VMG EduNext'}</span>}
              </div>
              <div className="blog-body" style={{ padding: 18 }}>
                <span className="pill" style={{ fontSize: 10, marginBottom: 10, display: 'inline-block' }}>{a.category || 'Kiến thức'}</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{a.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{a.excerpt}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
