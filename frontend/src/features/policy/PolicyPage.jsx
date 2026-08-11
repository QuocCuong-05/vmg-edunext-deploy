import { useParams } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { Icon } from '../../lib/icons';

export const POLICIES = {
  'chinh-sach-bao-mat': {
    title: 'Chính sách bảo mật',
    updated: '08/2026',
    sections: [
      { h: '1. Dữ liệu chúng tôi thu thập', p: 'Khi sử dụng VMG EduNext, chúng tôi có thể thu thập: thông tin tài khoản (email, họ tên, trường, phường/xã), địa chỉ IP và thiết bị truy cập, dữ liệu hoạt động học tập (tiến độ bài học, kết quả trắc nghiệm, lượt sử dụng AI, bài viết cộng đồng), và lịch sử đồng ý chính sách của bạn.' },
      { h: '2. Mục đích xử lý dữ liệu', p: 'Dữ liệu được xử lý cho các mục đích: cung cấp và duy trì dịch vụ (tài khoản, đơn hàng, thanh toán, chứng nhận); hỗ trợ và chăm sóc người dùng; an ninh và tuân thủ pháp luật; nâng cao chất lượng dịch vụ (phân tích tương tác, cá nhân hóa, cải thiện AI); và truyền thông, tiếp thị (chỉ khi bạn đồng ý).' },
      { h: '3. Lưu trữ dữ liệu', p: 'Dữ liệu người dùng được lưu trữ trong nước (Việt Nam). Nội dung video bài học sử dụng hạ tầng nước ngoài nhưng không chứa dữ liệu nhận dạng cá nhân.' },
      { h: '4. Bảo mật dữ liệu', p: 'Mật khẩu được băm một chiều (bcrypt) — hệ thống không lưu trữ hay truy xuất mật khẩu dạng văn bản gốc. Truyền dữ liệu qua HTTPS. Chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.' },
      { h: '5. Quyền của bạn', p: 'Bạn có quyền: xem và sửa thông tin cá nhân, xem lịch sử đồng ý và dữ liệu được thu thập, rút lại đồng ý bất kỳ lúc nào, yêu cầu xóa dữ liệu. Liên hệ hỗ trợ để thực hiện các quyền này.' },
      { h: '6. Liên hệ', p: 'Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ qua email hỗ trợ của VMG EduNext.' },
    ],
  },
};

export function PolicyContent({ policy }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon.BookOpen size={22} style={{ color: 'var(--red)' }} />
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{policy.title}</h1>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
        Cập nhật lần cuối: {policy.updated}
      </p>
      <Card style={{ padding: 'min(28px, 6vw)' }}>
        {policy.sections.map(s => (
          <div key={s.h} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{s.h}</h2>
            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--muted)' }}>{s.p}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

export default function PolicyPage() {
  const { slug } = useParams();
  const policy = POLICIES[slug] || null;

  if (!policy) {
    return (
      <div className="empty" style={{ minHeight: '60vh' }}>
        <h3>Không tìm thấy chính sách</h3>
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ maxWidth: 720, margin: '0 auto', padding: '32px 16px 64px' }}>
      <PolicyContent policy={policy} />
    </div>
  );
}
