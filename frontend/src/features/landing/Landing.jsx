import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import PublicNav from '../layout/PublicNav';

const FEATURES = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
      </svg>
    ),
    title: '6 khóa học song ngữ & STEM',
    desc: 'Classroom English, CLIL, Assessment, Learning Science, STEM – thiết kế theo khung năng lực chuẩn quốc tế.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: '104 câu lệnh lớp học',
    desc: 'Thư viện song\u00A0ngữ Anh-Việt thực tế – giúp bạn tự tin dẫn dắt lớp học 100% tiếng Anh.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    title: '82 từ vựng giáo dục',
    desc: 'Từ vựng chuyên ngành giảng dạy thiết yếu (A2-C1) – áp dụng ngay vào bối cảnh lớp học.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    title: 'Trắc nghiệm thông minh',
    desc: 'Tích hợp tình huống thực tế song\u00A0ngữ & STEM – feedback chi tiết, gắn với framework đánh giá.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'ViMi AI Tutor',
    desc: 'Trợ lý AI giải đáp mọi tình huống giảng dạy – từ Classroom English đến CLIL và STEM.',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: 'Mẹo giảng dạy thực tế',
    desc: 'Scaffolding, đánh giá định hình, cognitive load – mẹo áp dụng liền trong lớp học song\u00A0ngữ.',
  },
];

const CAT_GRADIENT = {
  'CLIL & Song ngữ': 'linear-gradient(135deg, #bd1730, #ef6577)',
  'Quản lý lớp': 'linear-gradient(135deg, #225bc1, #69a9ef)',
  'AI trong giáo dục': 'linear-gradient(135deg, #89682d, #d9b961)',
  'Đánh giá': 'linear-gradient(135deg, #225bc1, #69a9ef)',
  'Phát triển giáo viên': 'linear-gradient(135deg, #bd1730, #ef6577)',
};

const STEPS = [
  { n: '1', title: 'Đăng ký miễn phí', desc: 'Tạo tài khoản bằng email – bắt đầu ngay, không\u00a0cần thẻ tín dụng.' },
  { n: '2', title: 'Đánh giá năng lực', desc: 'Xác định trình độ hiện tại và nhận lộ trình học được cá nhân hóa theo nhu cầu.' },
  { n: '3', title: 'Luyện tập & Phát triển', desc: 'Học qua tình huống thực tế, làm bài tập song\u00a0ngữ, luyện phản xạ giảng dạy cùng ViMi AI.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState([]);
  const [faq, setFaq] = useState(null);

  useEffect(() => {
    api.cms.list('blog').then(list => setBlogs((list || []).slice(0, 3))).catch(() => {});
    api.cms.list('help').then(list => {
      const f = (list || []).find(a => a.slug === 'faq');
      if (f) setFaq(f);
    }).catch(() => {});
  }, []);

  return (
    <div className="landing">
      {/* Nav */}
      <PublicNav />

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <h1 className="landing-hero-title">
            Tự tin làm chủ<br />
            <span className="landing-hero-accent">lớp học song ngữ cùng <span style={{ whiteSpace: 'nowrap' }}>VMG EduNext</span></span>
          </h1>
           <p className="landing-hero-sub">Nền tảng học tiếng Anh chuyên sâu ứng dụng công nghệ AI và mô&nbsp;hình Hybrid Learning, giúp giáo viên nâng cao năng lực giao tiếp và giảng dạy chuẩn quốc tế.</p>
          <div className="landing-hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/login?signup=1')}
              style={{ padding: '16px 36px', fontSize: 15 }}>
              Trải nghiệm ngay
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 8 }}>
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </button>
            <button className="btn btn-outline" onClick={() => navigate('/login')}
              style={{ padding: '16px 36px', fontSize: 15 }}>
              Đăng nhập
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Giải pháp toàn diện cho giáo viên song ngữ</h2>
          <p className="landing-section-sub">Từ Classroom English, CLIL/STEM đến đánh giá năng lực – VMG EduNext trang bị đầy đủ kỹ năng ngôn ngữ và phương pháp giảng dạy cho kỷ&nbsp;nguyên hội nhập.</p>
          <div className="landing-features">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-inner">
          <h2 className="landing-section-title">Lộ trình học 3 bước – Ai cũng làm được</h2>
          <p className="landing-section-sub">Phù hợp với mọi giáo viên từ chưa tự tin đến muốn nâng cao trình độ song ngữ.</p>
          <div className="landing-steps">
            {STEPS.map((s, i) => (
              <div key={i} className="landing-step">
                <div className="landing-step-num">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog */}
      {blogs.length > 0 && (
        <section className="landing-section landing-section-alt landing-section-compact">
          <div className="landing-section-inner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', background: 'linear-gradient(135deg, #991b2f, #cf1838)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, boxShadow: '0 6px 20px -8px rgba(153,27,47,.5)' }}>
              <div>
                <h2 className="landing-section-title" style={{ marginBottom: 4, color: '#fff', fontSize: 22 }}>Bài blog</h2>
                <p className="landing-section-sub" style={{ color: 'rgba(255,255,255,.8)', margin: 0 }}>Kiến thức và nghiên cứu ứng dụng mới nhất cho giáo viên</p>
              </div>
              <button onClick={() => navigate('/blog')} style={{ background: 'rgba(255,255,255,.16)', border: '1.5px solid rgba(255,255,255,.5)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 999 }}>
                Xem tất cả →
              </button>
            </div>
            <div className="blog-grid" style={{ marginTop: 24 }}>
              {blogs.map(b => (
                <div key={b.id} className="landing-blog-card" onClick={() => navigate(`/blog/${b.slug}`)}>
                  <div
                    className="landing-blog-cover"
                    style={{
                      background: b.cover_url
                        ? `url(${b.cover_url}) center/cover no-repeat`
                        : CAT_GRADIENT[b.category] || 'linear-gradient(135deg, #1a2639, #2c4063)',
                    }}
                  >
                    {!b.cover_url && <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: .5, textTransform: 'uppercase' }}>{b.category || 'VMG EduNext'}</span>}
                    <span className="landing-blog-date">{b.published_at ? new Date(b.published_at).toLocaleDateString('vi-VN') : ''}</span>
                  </div>
                  <div className="landing-blog-body">
                    <span className="pill" style={{ fontSize: 10, marginBottom: 10, display: 'inline-block' }}>{b.category || 'Kiến thức'}</span>
                    <h3 className="landing-blog-title">{b.title}</h3>
                    <p className="landing-blog-excerpt">{b.excerpt}</p>
                    <span className="landing-blog-more">Đọc tiếp →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {faq && (
        <section className="landing-section landing-section-compact">
          <div className="landing-section-inner">
            <h2 className="landing-section-title">Câu hỏi thường gặp</h2>
            <div className="help-faq" style={{ maxWidth: 720, margin: '24px auto 0' }} dangerouslySetInnerHTML={{ __html: faq.body || '' }} />
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => navigate('/help')} style={{ background: 'none', border: 'none', color: 'var(--red)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Xem trung tâm trợ giúp →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Sẵn sàng dạy song ngữ tự tin?</h2>
          <p>Tham gia cùng hàng ngàn giáo viên đã nâng cao năng lực giảng dạy. Hoàn toàn miễn phí.</p>
          <button className="btn btn-primary" onClick={() => navigate('/login?signup=1')}
            style={{ padding: '16px 40px', fontSize: 16, marginTop: 8 }}>
            Khám phá lộ trình học
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#12233d', color: 'rgba(255,255,255,.85)', padding: '48px 0 24px', marginTop: 0 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.4fr', gap: 32, marginBottom: 32 }} className="landing-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <img src="/vmg.png" alt="VMG" style={{ height: 26 }} />
                <b style={{ fontSize: 16, color: '#fff' }}>VMG EduNext</b>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,.75)', marginBottom: 10 }}>
                Nền tảng phát triển năng lực ngoại ngữ và phương pháp giảng dạy cho giáo viên.
              </p>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,.75)' }}>
                <b style={{ color: '#fff' }}>Tập đoàn Giáo dục Việt Mỹ (VMG)</b> – <span style={{ whiteSpace: 'nowrap' }}>20 năm kinh nghiệm giáo dục.</span> Phương châm: "Dạy thật – Học thật – Chất lượng thật".
              </p>
            </div>
            <div>
              <b style={{ fontSize: 14, color: '#fff', display: 'block', marginBottom: 12 }}>Khám phá</b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <button onClick={() => navigate('/blog')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.75)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Bài blog</button>
              </div>
            </div>
            <div>
              <b style={{ fontSize: 14, color: '#fff', display: 'block', marginBottom: 12 }}>Hỗ trợ</b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                <button onClick={() => navigate('/help')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.75)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Trung tâm trợ giúp</button>
                <button onClick={() => navigate('/policy/chinh-sach-bao-mat')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.75)', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Chính sách bảo mật</button>
              </div>
            </div>
            <div>
              <b style={{ fontSize: 14, color: '#fff', display: 'block', marginBottom: 12 }}>Liên hệ</b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.6 }}>
                <div><b style={{ color: '#fff' }}>Trụ sở chính</b><br />Phòng L17-11, Tầng 17, Tòa nhà Vincom Center<br />72 Lê Thánh Tôn, P. Bến Nghé, Q.1, TP.HCM</div>
                <div><b style={{ color: '#fff' }}>Văn phòng đại diện</b><br />E99 Đường Võ Thị Sáu, Khu phố 7<br />Phường Trấn Biên, TP. Biên Hòa, Đồng Nai</div>
                <div><b style={{ color: '#fff' }}>Điện thoại</b> · 090 697 88 98</div>
                <div><b style={{ color: '#fff' }}>Email</b> · hotro@vmg.edu.vn</div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 16, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>
            © 2026 VMG EduNext – Nền tảng phát triển năng lực song ngữ & STEM cho giáo viên.
          </div>
        </div>
      </footer>
    </div>
  );
}
