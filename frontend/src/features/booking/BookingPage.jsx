import { useState } from 'react';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Dialog from '../../components/ui/Dialog';
import { useMediaQuery } from '../../lib/useMediaQuery';

const EXPERTS = [
  {
    name: 'Ms. Nguyễn Thị Hoa', role: 'Chuyên gia phương pháp CLIL', avatar: 'NH',
    slots: ['09:00', '14:30', '19:30'],
    bio: 'Hơn 8 năm kinh nghiệm thiết kế chương trình song ngữ tại các trường học tại TP.HCM và Đồng Nai. Đã đào tạo hơn 500 giáo viên về phương pháp CLIL và giảng dạy tích hợp.',
    experience: '8 năm kinh nghiệm',
    specialties: ['CLIL', 'STEM', 'Giáo dục song ngữ'],
    education: 'Thạc sĩ Giáo dục học, ĐH Sư phạm TP.HCM',
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    rating: 4.8,
  },
  {
    name: 'Mr. John Smith', role: 'Giảng viên tiếng Anh bản ngữ', avatar: 'JS',
    slots: ['08:00', '15:00', '20:00'],
    bio: 'Giảng viên bản ngữ với hơn 10 năm dạy tiếng Anh tại Việt Nam. Chuyên đào tạo phát âm, phản xạ nói và kỹ năng giảng dạy bằng tiếng Anh cho giáo viên song ngữ.',
    experience: '10 năm kinh nghiệm',
    specialties: ['Pronunciation', 'Classroom English', 'Speaking Skills'],
    education: 'Cử nhân Ngôn ngữ Anh, University of London',
    languages: ['Tiếng Anh', 'Tiếng Việt (cơ bản)'],
    rating: 4.9,
  },
  {
    name: 'Ms. Lê Phương Thảo', role: 'Chuyên gia phát triển giáo viên', avatar: 'LT',
    slots: ['10:00', '13:30', '16:00'],
    bio: 'Chuyên gia đào tạo giáo viên nội bộ với hơn 6 năm kinh nghiệm. Đồng hành cùng VMG EduNext trong việc xây dựng lộ trình phát triển năng lực cho giáo viên các trường song ngữ.',
    experience: '6 năm kinh nghiệm',
    specialties: ['Phát triển giáo viên', 'Đánh giá năng lực', 'Mentoring'],
    education: 'Thạc sĩ Quản lý Giáo dục, ĐH Giáo dục - ĐHQGHN',
    languages: ['Tiếng Việt', 'Tiếng Anh'],
    rating: 4.7,
  },
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
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingType, setBookingType] = useState(BOOKING_TYPES[0]);
  const [format, setFormat] = useState(FORMATS[0]);
  const [month, setMonth] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [profileExpert, setProfileExpert] = useState(null);

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
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 24 }}>
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
                <button
                  onClick={e => { e.stopPropagation(); setProfileExpert(expert); }}
                  title="Xem hồ sơ"
                  style={{ background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'pointer', color: 'var(--ink)', padding: '6px', borderRadius: 10, display: 'flex', alignItems: 'center', transition: 'all .15s', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.color = 'var(--ink)'; }}
                >
                  <Icon.User size={15} />
                </button>
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
      <Dialog isOpen={!!profileExpert} onOpenChange={() => setProfileExpert(null)}>
        {profileExpert && (
          <ExpertProfile
            expert={profileExpert}
            onBook={() => {
              const idx = EXPERTS.findIndex(e => e.name === profileExpert.name);
              if (idx >= 0) { setSelectedExpert(idx); setSelectedSlot(null); setConfirmed(false); }
              setProfileExpert(null);
            }}
          />
        )}
      </Dialog>
    </div>
  );
}

const COLORS_PICKER = ['#e74c3c', '#3498db', '#f39c12', '#2ecc71', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

function ExpertProfile({ expert, onBook }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  return (
    <>
      <div style={{
        margin: '-28px -28px 0', padding: '28px 28px 20px',
        background: 'linear-gradient(160deg, #c0392b, #5b2a8c)',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'rgba(255,255,255,.2)',
            color: '#fff', border: '3px solid rgba(255,255,255,.5)',
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 22, flexShrink: 0,
            boxShadow: '0 4px 15px rgba(0,0,0,.15)',
          }}>
            {expert.avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: '0 0 2px', fontSize: 18, color: '#fff' }}>{expert.name}</h3>
            <div style={{ fontSize: 12, opacity: .8, marginBottom: 4 }}>{expert.role}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
              <span style={{ color: '#f59e0b' }}>
                {'★'.repeat(Math.floor(expert.rating))}{'☆'.repeat(5 - Math.floor(expert.rating))}
              </span>
              <span style={{ opacity: .7 }}>{expert.rating}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 0', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px 20px', fontSize: 13, borderBottom: '1px solid var(--line)', marginBottom: 16 }}>
        <div><span style={{ opacity: .5, display: 'block', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>KINH NGHIỆM</span>{expert.experience}</div>
        <div><span style={{ opacity: .5, display: 'block', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>HỌC VẤN</span>{expert.education}</div>
        <div><span style={{ opacity: .5, display: 'block', fontSize: 10, fontWeight: 700, marginBottom: 2 }}>NGÔN NGỮ</span>{expert.languages.join(', ')}</div>
      </div>

      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)', marginBottom: 16 }}>{expert.bio}</p>

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, opacity: .5, marginBottom: 8 }}>CHUYÊN MÔN</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {expert.specialties.map((s, i) => (
            <span key={i} className="pill" style={{
              background: COLORS_PICKER[i % COLORS_PICKER.length] + '18',
              color: COLORS_PICKER[i % COLORS_PICKER.length],
              fontWeight: 600, fontSize: 11,
            }}>{s}</span>
          ))}
        </div>
      </div>

      <Button variant="primary" style={{ width: '100%', justifyContent: 'center' }} onClick={onBook}>
        <Icon.Calendar size={16} /> Đặt lịch với chuyên gia này
      </Button>
    </>
  );
}
