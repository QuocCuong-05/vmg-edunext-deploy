import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import PublicNav from '../layout/PublicNav';

function buildToc(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = [...doc.querySelectorAll('h2, h3')];
  return headings.map((h, i) => {
    const level = Number(h.tagName[1]);
    let id = h.id || `toc-${i}`;
    if (!h.id) h.id = id;
    return { id, level, text: h.textContent.trim() };
  });
}

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeToc, setActiveToc] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    api.cms.get('blog', slug).then(p => {
      setPost(p);
      if (p?.body) {
        const ids = buildToc(p.body).map(t => t.id);
        const observer = new IntersectionObserver(
          entries => {
            entries.forEach(e => {
              if (e.isIntersecting) setActiveToc(e.target.id);
            });
          },
          { rootMargin: '-80px 0px -70% 0px' }
        );
        ids.forEach(id => {
          const el = document.getElementById(id);
          if (el) observer.observe(el);
        });
        return () => observer.disconnect();
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <PublicNav />
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <PublicNav />
        <div className="empty" style={{ minHeight: '60vh' }}>
          <h3>Không tìm thấy bài viết.</h3>
          <Link to="/blog" style={{ color: 'var(--red)', fontSize: 13, marginTop: 8, display: 'inline-block' }}>← Về danh sách bài viết</Link>
        </div>
      </>
    );
  }

  const toc = post.body ? buildToc(post.body) : [];

  return (
    <>
      <PublicNav />
      <div className="main-public" style={{ maxWidth: 860, margin: '0 auto' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)', marginBottom: 18, flexWrap: 'wrap' }}>
        <Link to="/" style={{ color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <Icon.Dashboard size={14} /> Trang chủ
        </Link>
        <span>/</span>
        <Link to="/blog" style={{ color: 'var(--muted)' }}>Blog</Link>
        <span>/</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{post.title}</span>
      </nav>

      <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.4, lineHeight: 1.3, marginBottom: 14 }}>{post.title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--muted)', marginBottom: 24, flexWrap: 'wrap' }}>
        {post.author && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon.User size={14} /> {post.author}
          </span>
        )}
        {post.published_at && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Icon.Calendar size={14} /> {new Date(post.published_at).toLocaleDateString('vi-VN')}
          </span>
        )}
        {post.category && (
          <span className="pill" style={{ fontSize: 10 }}>{post.category}</span>
        )}
      </div>

      {post.cover_url && (
        <img src={post.cover_url} alt={post.title} style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 'var(--radius)', marginBottom: 28 }} />
      )}

      <div style={{ display: 'grid', gridTemplateColumns: toc.length ? 'minmax(0,1fr) 230px' : '1fr', gap: 32, alignItems: 'start' }}>
        <div>
          <div
            className="article-content"
            ref={bodyRef}
            dangerouslySetInnerHTML={{ __html: post.body || '' }}
          />
          <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--red)', fontWeight: 600, marginTop: 28 }}>
            <Icon.ArrowLeft size={14} /> Về danh sách bài viết
          </Link>
        </div>

        {toc.length > 0 && (
          <aside style={{ position: 'sticky', top: 16, display: 'none' }} className="blog-toc-aside">
            <h3 style={{ fontSize: 13, fontWeight: 800, marginBottom: 10 }}>Mục lục</h3>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {toc.map(t => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  style={{
                    fontSize: 12, lineHeight: 1.45, padding: '5px 8px', borderRadius: 8,
                    color: activeToc === t.id ? 'var(--red)' : 'var(--muted)',
                    fontWeight: activeToc === t.id ? 700 : 500,
                    background: activeToc === t.id ? 'var(--red-bg)' : 'none',
                    textDecoration: 'none', paddingLeft: t.level === 3 ? 20 : 8,
                  }}
                >
                  {t.text}
                </a>
              ))}
            </nav>
          </aside>
        )}
      </div>
      </div>
    </>
  );
}
