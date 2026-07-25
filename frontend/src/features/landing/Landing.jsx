import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

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

const STEPS = [
  { n: '1', title: 'Đăng ký miễn phí', desc: 'Tạo tài khoản bằng email – bắt đầu ngay, không\u00a0cần thẻ tín dụng.' },
  { n: '2', title: 'Đánh giá năng lực', desc: 'Xác định trình độ hiện tại và nhận lộ trình học được cá nhân hóa theo nhu cầu.' },
  { n: '3', title: 'Luyện tập & Phát triển', desc: 'Học qua tình huống thực tế, làm bài tập song\u00a0ngữ, luyện phản xạ giảng dạy cùng ViMi AI.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <img src="/vmg.png" alt="VMG" style={{ height: 22 }} />
            <span className="landing-logo-text"><span style={{ whiteSpace: 'nowrap' }}>VMG EduNext</span></span>
          </div>
          <div className="landing-nav-actions">
            {user ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
                Vào Dashboard
              </button>
            ) : (
              <>
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')}>
                  Đăng nhập
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/login?signup=1')}>
                  Đăng ký miễn phí
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

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
      <footer className="landing-footer">
        <p>© 2026 VMG EduNext – Nền tảng phát triển năng lực song ngữ & STEM cho giáo viên.</p>
      </footer>
    </div>
  );
}
