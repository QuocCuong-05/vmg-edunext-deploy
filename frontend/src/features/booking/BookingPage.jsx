import { useState } from 'react';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const EXPERTS = [
  { name: 'Ms. Nguyễn Thị Hoa', role: 'Chuyên gia phương pháp CLIL', avatar: 'NH', slots: ['09:00', '14:30', '19:30'] },
  { name: 'Mr. John Smith', role: 'Giảng viên tiếng Anh bản ngữ', avatar: 'JS', slots: ['08:00', '15:00', '20:00'] },
  { name: 'Ms. Lê Phương Thảo', role: 'Chuyên gia phát triển giáo viên', avatar: 'LT', slots: ['10:00', '13:30', '16:00'] },
];

const BOOKING_TYPES = [
  'Pronunciation Coaching',
  'Classroom English Clinic',
  'CLIL / STEM Consultation',
  'ViMi Learning Review',
];

const FORMATS = ['Online · Google Meet', 'Trực tiếp tại VMG'];

const TIME_SLOTS = ['09:00', '14:30', '19:30'];

const MONTHS = [
  'Tháng 7/2026', 'Tháng 8/2026', 'Tháng 9/2026',
  'Tháng 10/2026', 'Tháng 11/2026', 'Tháng 12/2026',
];

export default function BookingPage() {
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingType, setBookingType] = useState(BOOKING_TYPES[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [month, setMonth] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
  };

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Calendar size={24} /> Đặt lịch chuyên gia
        </h1>
        <p>Coaching 1:1 hoặc lớp nhóm nhỏ — chọn chuyên gia, hình thức và khung giờ phù hợp.</p>
      </div>

      <Card style={{ padding: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, marginBottom: 6, color: 'var(--muted)' }}>
              Loại buổi học
            </label>
            <select
              value={bookingType}
              onChange={e => setBookingType(e.target.value)}
              style={{ width: '100%', padding: 11, border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--surface-input)' }}
            >
              {BOOKING_TYPES.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 10, fontWeight: 800, marginBottom: 6, color: 'var(--muted)' }}>
              Hình thức tham gia
            </label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              style={{ width: '100%', padding: 11, border: '1px solid var(--line)', borderRadius: 10, fontSize: 13, background: 'var(--surface-input)' }}
            >
              {FORMATS.map((f, i) => (
                <option key={i} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 15 }}>{MONTHS[month]}</h4>
          <div style={{ display: 'flex', gap: 6 }}>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMonth(Math.max(0, month - 1))}
              isDisabled={month === 0}
              style={{ padding: '6px 10px' }}
            >
              <Icon.ArrowLeft size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMonth(Math.min(MONTHS.length - 1, month + 1))}
              isDisabled={month === MONTHS.length - 1}
              style={{ padding: '6px 10px' }}
            >
              <Icon.ArrowRight size={14} />
            </Button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Chọn chuyên gia</h4>
          <div style={{ display: 'grid', gap: 10 }}>
            {EXPERTS.map((expert, i) => (
              <div
                key={i}
                onClick={() => { setSelectedExpert(i); setSelectedSlot(null); setConfirmed(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 14, border: `1px solid ${selectedExpert === i ? 'var(--red)' : 'var(--line)'}`,
                  background: selectedExpert === i ? 'var(--red-bg)' : 'var(--card)', cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <div className="avatar-btn" style={{
                  width: 42, height: 42, fontSize: 13,
                  background: selectedExpert === i ? 'var(--red)' : 'var(--red-bg)',
                  color: selectedExpert === i ? '#fff' : 'var(--red)',
                  border: '1px solid var(--line)', fontWeight: 700,
                }}>
                  {expert.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{expert.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{expert.role}</div>
                </div>
                {selectedExpert === i && (
                  <Icon.Check size={18} style={{ color: 'var(--red)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedExpert !== null && (
          <>
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginBottom: 16 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Khung giờ</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {EXPERTS[selectedExpert].slots.map((slot, j) => (
                  <button
                    key={j}
                    className={`slot ${selectedSlot === j ? 'selected' : ''}`}
                    onClick={() => { setSelectedSlot(j); setConfirmed(false); }}
                    style={{ padding: '10px 20px', fontSize: 13 }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 16, textAlign: 'center' }}>
              {!confirmed ? (
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  isDisabled={selectedSlot === null}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon.Calendar size={16} /> Xác nhận đặt lịch
                </Button>
              ) : (
                <div style={{ padding: 20 }}>
                  <Icon.Check size={36} style={{ color: 'var(--green)', marginBottom: 10 }} />
                  <h3 style={{ marginBottom: 6 }}>Đặt lịch thành công!</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 400, margin: '0 auto' }}>
                    Buổi <b>{bookingType}</b> với <b>{EXPERTS[selectedExpert].name}</b> vào lúc <b>{EXPERTS[selectedExpert].slots[selectedSlot]}</b> ({format}) đã được ghi nhận. Xác nhận sẽ gửi về email của bạn.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
