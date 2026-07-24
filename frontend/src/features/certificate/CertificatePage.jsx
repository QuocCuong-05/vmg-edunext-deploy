import { useAuth } from '../auth/AuthContext';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';

const COURSE_NAME = 'TIẾNG ANH CHUYÊN MÔN DÀNH CHO GIÁO VIÊN';

function QrMock() {
  const cells = Array.from({ length: 64 }, (_, i) => i);
  return (
    <div className="qr-mock" aria-label="Mã xác thực chứng nhận">
      {cells.map(i => (
        <i key={i} className={
          i % 3 === 0 || i % 5 === 0 ? '' : 'fill'
        } />
      ))}
    </div>
  );
}

export default function CertificatePage() {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const certId = `VMG-EN-${today.replace(/ /g, '').toUpperCase()}-${user?.id?.slice(-4)?.toUpperCase() || 'BM'}`;

  return (
    <div className="page-enter">
      <div className="page-title">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon.Book size={24} /> Chứng nhận & thành tích
          </h1>
          <p>Lưu trữ chứng nhận, huy hiệu và minh chứng hoàn thành chương trình.</p>
        </div>
      </div>

      <div className="certificate-shell">
        <div className="certificate-page" id="certificateCanvas">
          <div className="cert-corner cert-corner-a" />
          <div className="cert-corner cert-corner-b" />
          <img className="cert-logo" src="/vmg.png" alt="VMG English" />
          <div className="cert-kicker">VMG EDUNEXT · CHỨNG NHẬN ĐIỆN TỬ</div>
          <h2>CHỨNG NHẬN HOÀN THÀNH</h2>
          <p>Chứng nhận rằng</p>
          <div className="cert-name">{user?.full_name?.toUpperCase() || 'NGUYỄN VĂN MƯỜI'}</div>
          <p>đã hoàn thành chương trình</p>
          <h3>{COURSE_NAME}</h3>
          <p className="cert-meta">Trình độ đạt được: <b>B2</b> · 60 giờ học · Hoàn thành ngày {today}</p>
          <div className="cert-bottom">
            <div className="cert-sign">
              <img src="/chuki.png" alt="Chữ ký" style={{ height: 45, marginBottom: 4, mixBlendMode: 'multiply' }} />
              <div className="signature">Phạm Thị Bảo Minh</div>
              <span>Đại diện học thuật</span>
            </div>
            <div className="cert-seal">
              <img src="/vmg.png" alt="VMG" />
            </div>
            <div className="cert-verify">
              <QrMock />
              <b>{certId}</b>
              <span>Quét để xác thực</span>
            </div>
          </div>
        </div>

        <div className="certificate-actions">
          <Button variant="primary">
            <Icon.Download size={16} /> Tải PNG
          </Button>
          <Button variant="ghost">
            <Icon.Printer size={16} /> In / Lưu PDF
          </Button>
          <Button variant="ghost">
            <Icon.Share size={16} /> Chia sẻ
          </Button>
          <Button variant="ghost">
            <Icon.Check size={16} /> Xác thực
          </Button>
        </div>
      </div>
    </div>
  );
}
