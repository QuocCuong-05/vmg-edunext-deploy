import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import { toPng } from 'html-to-image';

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
  const [exporting, setExporting] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const certId = `VMG-EN-${today.replace(/ /g, '').toUpperCase()}-${user?.id?.slice(-4)?.toUpperCase() || 'BM'}`;

  const handleDownloadPng = async () => {
    setExporting(true);
    try {
      const node = document.getElementById('certificateCanvas');
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${certId}.png`;
      a.click();
      window.__vimi_toast?.('Đã tải PNG', 'success');
    } catch {
      window.__vimi_toast?.('Tải ảnh thất bại', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => window.print();

  const handleShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'width=600,height=600',
    );
  };

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
              <img src="/chuki.svg" alt="Chữ ký" style={{ height: 80, marginBottom: 4 }} />
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
          <Button variant="primary" isDisabled={exporting} onClick={handleDownloadPng}>
            {exporting ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> : <Icon.Download size={16} />}
            {exporting ? 'Đang tải...' : 'Tải PNG'}
          </Button>
          <Button variant="ghost" onClick={handlePrint}>
            <Icon.Printer size={16} /> In / Lưu PDF
          </Button>
          <Button variant="ghost" onClick={handleShare}>
            <Icon.Share size={16} /> Chia sẻ
          </Button>
          <Button variant="ghost" onClick={() => setShowVerify(true)}>
            <Icon.Check size={16} /> Xác thực
          </Button>
        </div>
      </div>

      <Dialog isOpen={showVerify} onOpenChange={setShowVerify}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'var(--green-bg)', color: 'var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <Icon.Check size={28} />
          </div>
          <h3 style={{ fontSize: 18, marginBottom: 8 }}>Chứng nhận hợp lệ</h3>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Chứng nhận này được cấp bởi VMG EduNext và đã được xác thực.
          </p>
          <div style={{
            padding: 14, borderRadius: 10, border: '1px solid var(--line)',
            background: 'var(--surface-hover)', textAlign: 'left',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Mã chứng nhận</div>
            <b style={{ fontFamily: 'monospace', fontSize: 14 }}>{certId}</b>
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--muted)' }}>
              {user?.full_name} · Ngày cấp: {today}
            </div>
          </div>
          <Button variant="primary" onClick={() => setShowVerify(false)}>Đóng</Button>
        </div>
      </Dialog>
    </div>
  );
}
