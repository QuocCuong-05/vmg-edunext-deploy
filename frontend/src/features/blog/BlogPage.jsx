import { useState } from 'react';
import { Icon } from '../../lib/icons';
import { dispatchAction } from '../../lib/quest-engine';
import Card from '../../components/ui/Card';

const ARTICLES = [
  {
    title: 'Thiết kế mục tiêu kép: vừa học nội dung, vừa phát triển ngôn ngữ',
    pill: 'CLIL · 8 phút',
    desc: 'Cách viết hai nhóm mục tiêu và kết nối chúng trong từng hoạt động của tiết học.',
    icon: 'Languages',
    content: `<p class="article-lead">Trong lớp học bằng ngôn ngữ thứ hai, học sinh không chỉ cần hiểu kiến thức. Các em còn cần ngôn ngữ để quan sát, so sánh, giải thích, lập luận và trình bày điều đã hiểu.</p><h2>1. Hai mục tiêu không phải hai bài học riêng biệt</h2><p>Mục tiêu nội dung mô tả điều học sinh cần biết hoặc làm được trong môn học. Mục tiêu ngôn ngữ mô tả cách học sinh sẽ dùng ngôn ngữ để tiếp cận và thể hiện hiểu biết đó. Ví dụ, với bài "Chu trình nước", mục tiêu nội dung có thể là "mô tả được bốn giai đoạn chính"; mục tiêu ngôn ngữ là "sử dụng các từ nối first, then, as a result và finally để giải thích quy trình".</p><h2>2. Bắt đầu từ hành động nhận thức</h2><p>Hãy xác định học sinh phải làm gì với kiến thức: phân loại, so sánh, dự đoán, giải thích hay đánh giá. Mỗi hành động cần một tập hợp mẫu câu. Khi nhiệm vụ là so sánh, giáo viên có thể cung cấp: "Both … and …", "In contrast …", "The main difference is …".</p><div class="practice-box"><b>Mẫu thiết kế nhanh</b><p><b>Nội dung:</b> Học sinh giải thích được vì sao vật nổi hoặc chìm.<br><b>Ngôn ngữ:</b> Học sinh sử dụng because, therefore và density để đưa ra lời giải thích có bằng chứng.<br><b>Sản phẩm:</b> Một đoạn giải thích 60 giây dựa trên kết quả thí nghiệm.</p></div><h2>3. Đánh giá cả hai mục tiêu</h2><p>Không cần tách thành hai bài kiểm tra. Một sản phẩm học tập có thể cho thấy cả kiến thức và ngôn ngữ. Rubric ngắn có thể gồm: tính chính xác của nội dung, mức độ sử dụng từ khóa, sự rõ ràng của lập luận và khả năng tương tác với bạn học.</p><p class="source-note">Nội dung tổng hợp từ nguyên lý CLIL 4Cs và thực hành thiết kế mục tiêu ngôn ngữ trong dạy học tích hợp.</p>`,
  },
  {
    title: 'Phản hồi sửa lỗi mà không làm giảm động lực',
    pill: 'Phản hồi · 6 phút',
    desc: 'Các mẫu câu phản hồi cụ thể, trung tính và định hướng học sinh thử lại.',
    icon: 'MessageHeart',
    content: `<p class="article-lead">Mục tiêu của sửa lỗi không phải chứng minh học sinh sai, mà giúp các em nhận ra khoảng cách giữa câu trả lời hiện tại và bước tiến tiếp theo.</p><h2>Chọn lỗi cần sửa</h2><p>Khi học sinh đang trình bày ý tưởng, việc ngắt liên tục có thể làm mất mạch tư duy. Giáo viên nên ưu tiên lỗi ảnh hưởng đến ý nghĩa, lỗi liên quan trực tiếp đến mục tiêu bài học hoặc lỗi lặp lại nhiều lần.</p><h2>Công thức: ghi nhận – chỉ rõ – mời thử lại</h2><p>Ví dụ: "Your main idea is clear. Use the past tense when you describe the experiment. Try the second sentence again."</p><div class="practice-box"><b>Ba mẫu câu dùng ngay</b><p>"That is a useful idea. Can you add one example?"<br>"Your explanation is almost complete. Check the relationship between cause and effect."<br>"I can understand your message. Let's work on the pronunciation of this key word."</p></div><p class="source-note">Bài viết dựa trên nguyên tắc formative feedback: mục tiêu rõ, bằng chứng hiện tại và bước tiếp theo.</p>`,
  },
  {
    title: 'Khung 5 bước kiểm tra kế hoạch bài dạy do AI tạo',
    pill: 'AI · 10 phút',
    desc: 'Đảm bảo nội dung đúng, phù hợp học sinh và khả thi với điều kiện lớp học.',
    icon: 'BrainCircuit',
    content: `<p class="article-lead">AI có thể giúp giáo viên tạo bản nháp nhanh, nhưng trách nhiệm chuyên môn vẫn thuộc về giáo viên.</p><h2>1. Kiểm tra tính đúng của nội dung</h2><p>Đối chiếu khái niệm, số liệu, ví dụ và nguồn học liệu với tài liệu chính thống.</p><h2>2. Kiểm tra sự phù hợp với người học</h2><p>Xem lại độ khó ngôn ngữ, kiến thức nền, độ tuổi, nhu cầu hỗ trợ và bối cảnh văn hóa.</p><h2>3. Kiểm tra sự liên kết</h2><p>Mục tiêu, hoạt động và đánh giá phải cùng hướng về một năng lực.</p><h2>4. Kiểm tra tính khả thi</h2><p>Tính lại thời lượng, sĩ số, thiết bị, không gian và thời gian chuyển hoạt động.</p><h2>5. Kiểm tra an toàn và đạo đức</h2><p>Loại bỏ dữ liệu cá nhân, nội dung thiên lệch, tài liệu vi phạm bản quyền.</p><div class="practice-box"><b>Câu hỏi cuối cùng</b><p>"Nếu không có AI, tôi có thể giải thích tại sao hoạt động này phù hợp với học sinh của mình không?"</p></div><p class="source-note">Khung thực hành nội bộ VMG EduNext về sử dụng AI có trách nhiệm trong thiết kế bài dạy.</p>`,
  },
  {
    title: 'Wait time: khoảng im lặng có chủ đích',
    pill: 'Kỹ thuật lớp học · 6 phút',
    desc: 'Ba giây im lặng đôi khi chưa đủ để học sinh xử lý cả nội dung và ngôn ngữ thứ hai.',
    icon: 'Clock',
    content: `<p class="article-lead">Trong lớp học bằng ngôn ngữ thứ hai, học sinh phải xử lý đồng thời nội dung và ngôn ngữ.</p><h2>Hai khoảng chờ quan trọng</h2><p><b>Khoảng chờ 1</b> xảy ra sau khi giáo viên đặt câu hỏi. <b>Khoảng chờ 2</b> xảy ra sau câu trả lời của học sinh.</p><h2>Cách tạo khoảng chờ mà không gây ngượng</h2><p>Thông báo trước: "Take five seconds to think." Cho học sinh ghi một từ khóa, trao đổi nhanh với bạn.</p><div class="practice-box"><b>Thử trong tiết tới</b><p>Đặt một câu hỏi "vì sao", đếm thầm đến năm, không tự trả lời. Sau câu trả lời, chờ hai giây và hỏi: "Would you like to add anything?"</p></div>`,
  },
  {
    title: '5 cách kiểm tra mức độ hiểu trong dưới hai phút',
    pill: 'Đánh giá · 7 phút',
    desc: 'Câu "Các em hiểu chưa?" thường không cung cấp bằng chứng đáng tin cậy.',
    icon: 'CheckCircle',
    content: `<p class="article-lead">Kiểm tra hiểu cần khiến học sinh thể hiện điều đã hiểu.</p><h2>1. Nói lại nhiệm vụ</h2><p>"What do you need to do first?" hoặc yêu cầu học sinh giải thích cho bạn.</p><h2>2. Tín hiệu lựa chọn</h2><p>Học sinh giơ một, hai hoặc ba ngón tay để chọn đáp án.</p><h2>3. Viết một câu</h2><p>Yêu cầu viết định nghĩa, ví dụ lên bảng con.</p><h2>4. Câu hỏi truy hồi</h2><p>Không cho nhìn tài liệu, hỏi lại ý quan trọng.</p><h2>5. Phiếu thoát lớp</h2><p>Một điều đã hiểu, một điều còn băn khoăn.</p><div class="practice-box"><b>Nguyên tắc</b><p>Kiểm tra tất cả học sinh, thu được bằng chứng có thể quan sát, phản hồi ngay.</p></div>`,
  },
  {
    title: 'Xây dựng cộng đồng học tập chuyên môn trong trường',
    pill: 'Phát triển giáo viên · 9 phút',
    desc: 'Một cộng đồng nơi giáo viên cùng xác định vấn đề, thử giải pháp và điều chỉnh thực hành.',
    icon: 'Users',
    content: `<p class="article-lead">Một cộng đồng chuyên môn hiệu quả không chỉ là nhóm chia sẻ tài liệu.</p><h2>Bắt đầu từ một câu hỏi nhỏ</h2><p>"Làm thế nào để học sinh nói nhiều hơn trong hoạt động nhóm?"</p><h2>Chu trình bốn bước</h2><p>1) Xác định bằng chứng. 2) Chọn chiến lược. 3) Thử và thu bằng chứng. 4) Chia sẻ, điều chỉnh.</p><h2>Tạo an toàn nghề nghiệp</h2><p>Quan sát không nhằm xếp loại. Tập trung vào hành vi học tập, dùng ngôn ngữ mô tả.</p><div class="practice-box"><b>Mẫu họp 30 phút</b><p>5 phút: xem bằng chứng. 10 phút: chia sẻ tình huống. 10 phút: đề xuất thử nghiệm. 5 phút: thống nhất dữ liệu.</p></div>`,
  },
];

const FILTERS = ['Tất cả', 'CLIL & Song ngữ', 'Quản lý lớp', 'Đánh giá', 'AI trong giáo dục', 'Phát triển giáo viên'];

const ICON_MAP = {
  Languages: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 6h10"/><path d="M8 3v3"/><path d="M12 3v3"/><path d="M3 18h18"/><path d="M4 12h16"/><path d="M8 21s2-4 4-4 4 4 4 4"/></svg>,
  MessageHeart: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M14.5 8.5a2.5 2.5 0 0 1 0 3L12 14l-2.5-2.5a2.5 2.5 0 0 1 3-3.5l.5.5.5-.5a2.5 2.5 0 0 1 3 0z"/></svg>,
  BrainCircuit: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3a4 4 0 0 0-3.5 2A4 4 0 0 0 6 5a4 4 0 0 0-2.5 6.5A4 4 0 0 0 6 18a4 4 0 0 0 2.5 1A4 4 0 0 0 12 21a4 4 0 0 0 3.5-2A4 4 0 0 0 18 17a4 4 0 0 0 2.5-6.5A4 4 0 0 0 18 5a4 4 0 0 0-2.5-1A4 4 0 0 0 12 3z"/><circle cx="12" cy="12" r="2"/><path d="M12 9v6"/></svg>,
  Clock: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  CheckCircle: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Users: () => <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

export default function BlogPage() {
  const [filter, setFilter] = useState('Tất cả');
  const [article, setArticle] = useState(null);

  const filtered = filter === 'Tất cả' ? ARTICLES : ARTICLES;

  if (article) {
    return (
      <div className="page-enter">
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <button onClick={() => { setArticle(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 20, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--line)', background: 'var(--card)', cursor: 'pointer' }}>
            <Icon.ArrowLeft size={14} /> Quay lại
          </button>

          <div style={{ background: 'linear-gradient(135deg, #1a2639, #2f4468)', borderRadius: 'var(--radius)', padding: '36px 32px', marginBottom: 24 }}>
            <span className="pill" style={{ background: 'rgba(255,255,255,.12)', color: '#fff', fontSize: 10, marginBottom: 14, display: 'inline-block' }}>{article.pill}</span>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.3, letterSpacing: -.3 }}>{article.title}</h1>
          </div>

          <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Sparkles size={24} /> Kiến thức giáo dục
        </h1>
        <p>Kho bài viết, nghiên cứu ứng dụng và xu hướng giúp giáo viên phát triển nghề nghiệp liên tục.</p>
      </div>

      <Card style={{ marginBottom: 18, padding: '14px 18px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`pill ${filter === f ? 'pill-active' : ''}`}
              onClick={() => setFilter(f)}
              style={{ cursor: 'pointer', border: 'none', background: filter === f ? 'var(--red)' : 'var(--surface)', color: filter === f ? '#fff' : 'var(--ink)', padding: '6px 11px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>

      <div className="blog-grid">
        {filtered.map((a, i) => {
          const IconComp = ICON_MAP[a.icon];
          return (
            <Card key={i} className="blog-card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }} onClick={() => { setArticle(a); dispatchAction('blog_read'); }}>
              <div className="blog-cover" style={{ background: 'linear-gradient(135deg, #1a2639, #2c4063)', color: 'rgba(255,255,255,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
                {IconComp && <IconComp />}
              </div>
              <div className="blog-body" style={{ padding: 18 }}>
                <span className="pill" style={{ fontSize: 10, marginBottom: 10, display: 'inline-block' }}>{a.pill}</span>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{a.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>{a.desc}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
