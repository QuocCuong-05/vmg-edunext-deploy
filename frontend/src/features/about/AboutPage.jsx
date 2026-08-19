import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function AboutPage() {
  return (
    <div className="page-enter">
      <div className="page-title">
        <h1>Về VMG EduNext</h1>
        <p>Một hệ sinh thái EdTech được phát triển để giáo viên không chỉ học thêm tiếng Anh, mà còn làm chủ năng lực nghề nghiệp trong bối cảnh giáo dục song ngữ và hội nhập.</p>
      </div>

      <Card style={{ background: 'linear-gradient(115deg, var(--card) 0%, var(--red-bg) 50%, var(--blue-bg) 100%)', border: '1px solid var(--line)', padding: '36px 32px', marginBottom: 24 }}>
        <span className="pill" style={{ background: 'var(--card)', border: '1px solid var(--line)', color: 'var(--red)', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon.Sparkles size={12} /> VMG ENGLISH · HUMAN-CENTRED EDTECH
        </span>
        <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.5, marginBottom: 12, maxWidth: 600 }}>
          Nâng năng lực người thầy,<br />mở rộng cơ hội cho người học.
        </h2>
        <div style={{ fontStyle: 'italic', fontSize: 14, color: 'var(--red)', fontWeight: 600, borderLeft: '3px solid var(--red)', paddingLeft: 14 }}>
          "Mỗi giáo viên được trao thêm năng lực là hàng trăm học sinh được mở thêm một cánh cửa."
        </div>
      </Card>

      <div style={{ marginBottom: 24 }}>
        <span className="pill" style={{ background: 'var(--red-bg)', color: 'var(--red)', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon.Play size={12} /> 3 cách học cùng EduNext
        </span>
        <div className="grid-3">
          <Card style={{ padding: 20 }}>
            <Icon.Play size={22} style={{ color: 'var(--red)', marginBottom: 10, flexShrink: 0 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Học qua video</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65, overflowWrap: 'break-word', wordBreak: 'break-word' }}>Phát âm chuẩn IPA, tình huống lớp học thật, học mọi lúc mọi nơi.</p>
          </Card>
          <Card style={{ padding: 20 }}>
            <Icon.Mic size={22} style={{ color: 'var(--blue)', marginBottom: 10, flexShrink: 0 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Học cùng giáo viên bản ngữ</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65, overflowWrap: 'break-word', wordBreak: 'break-word' }}>Luyện nói trực tiếp 25 phút mỗi buổi, phản hồi và đánh giá cá nhân hóa.</p>
          </Card>
          <Card style={{ padding: 20 }}>
            <Icon.ViMi size={22} style={{ color: 'var(--green)', marginBottom: 10, flexShrink: 0 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Học cùng AI ViMi</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65, overflowWrap: 'break-word', wordBreak: 'break-word' }}>Luyện nói không ngại sai, phản hồi tức thì, đồng hành 24/7.</p>
          </Card>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <Card style={{ padding: 24 }}>
          <span className="pill" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', marginBottom: 10 }}>Tầm nhìn</span>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
            Trở thành nền tảng phát triển năng lực giáo viên tiên phong tại Việt Nam, góp phần hình thành một thế hệ nhà giáo tự tin sử dụng tiếng Anh, công nghệ và dữ liệu để tạo ra lớp học nhân văn, khai phóng và hội nhập.
          </p>
        </Card>
        <Card style={{ padding: 24 }}>
          <span className="pill" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', marginBottom: 10 }}>Sứ mệnh</span>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)' }}>
            Cá nhân hóa hành trình phát triển cho từng giáo viên; kết nối việc học với tình huống giảng dạy thật; biến dữ liệu thành phản hồi hữu ích; và xây dựng cộng đồng nơi giáo viên cùng học, cùng chia sẻ, cùng tiến bộ.
          </p>
        </Card>
      </div>

      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { icon: 'HeartHand', title: 'Lấy người thầy làm trung tâm', desc: 'Mỗi giáo viên có xuất phát điểm, môn dạy, bối cảnh lớp học và nhịp học khác nhau. EduNext tôn trọng sự khác biệt đó.' },
          { icon: 'Sparkles', title: 'Công nghệ phục vụ tính người', desc: 'ViMi hỗ trợ phản hồi, luyện tập và thiết kế bài dạy nhưng luôn đặt chuyên môn và mối quan hệ thầy trò ở trung tâm.' },
          { icon: 'Shield', title: 'Dữ liệu có trách nhiệm', desc: 'Dữ liệu học tập được dùng để hỗ trợ tiến bộ, không để gắn nhãn người học. Giáo viên có quyền kiểm soát dữ liệu của mình.' },
          { icon: 'Users', title: 'Cùng phát triển', desc: 'EduNext nuôi dưỡng một cộng đồng chuyên môn an toàn, nơi giáo viên được hỏi, thử, sai và chia sẻ thực hành tốt.' },
        ].map((v, i) => (
          <Card key={i} style={{ padding: 20 }}>
            <Icon.Sparkles size={22} style={{ color: 'var(--red)', marginBottom: 10, flexShrink: 0 }} />
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{v.title}</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.65, overflowWrap: 'break-word', wordBreak: 'break-word' }}>{v.desc}</p>
          </Card>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        <Card style={{ padding: 24 }}>
          <span className="pill" style={{ background: 'var(--green-bg)', color: 'var(--green)', marginBottom: 10 }}>Triết lý học tập</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Học để làm được, không chỉ để hoàn thành.</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
            Mỗi bài học ngắn đều hướng đến một hành vi có thể áp dụng: đưa chỉ dẫn rõ hơn, giải thích khái niệm dễ hiểu hơn, tổ chức hoạt động tốt hơn.
          </p>
          <ul style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 2, paddingLeft: 18 }}>
            <li>Thực hành trong ngữ cảnh lớp học thật.</li>
            <li>Ghi nhận tiến bộ bằng minh chứng, không chỉ bằng điểm số.</li>
          </ul>
        </Card>
        <Card style={{ padding: 24 }}>
          <span className="pill" style={{ background: 'var(--gold-bg)', color: 'var(--text-gold)', marginBottom: 10 }}>Cam kết của VMG</span>
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>Phát triển năng lực bền vững.</h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 12 }}>
            VMG EduNext kết hợp chuyên môn đào tạo ngoại ngữ, hiểu biết về giáo dục, dữ liệu học tập và AI để đồng hành dài hạn cùng giáo viên.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            {['Nội dung thực tiễn, có chiều sâu', 'Lộ trình minh bạch, có thể đo lường', 'Bảo mật và tôn trọng quyền riêng tư', 'Không để AI thay thế phán đoán chuyên môn'].map((c, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon.Check size={14} style={{ color: 'var(--green)' }} /> {c}</span>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ background: 'linear-gradient(145deg, #182233, #263b59)', color: '#fff', border: 'none', padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ maxWidth: 600 }}>
            <span className="pill" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              ViMi – AI Agent được phát triển bởi VMG
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Một người bạn đồng hành, không phải một chiếc máy chấm điểm.</h3>
            <p style={{ fontSize: 12, lineHeight: 1.7, color: '#c9d3e1', marginBottom: 16 }}>
              ViMi được thiết kế để trò chuyện thân thiện, đưa ra nhiều phương án, giải thích vì sao, khuyến khích giáo viên phản tư và luôn nhắc rằng quyết định cuối cùng thuộc về người thầy.
            </p>
          </div>
          <Button variant="primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon.ViMi size={18} /> Trò chuyện với ViMi
          </Button>
        </div>
      </Card>
    </div>
  );
}
