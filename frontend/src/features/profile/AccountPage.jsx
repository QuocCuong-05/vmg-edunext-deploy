import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';
import { CONSENT_ITEMS } from '../../lib/consent';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import PolicyModal from '../policy/PolicyModal';

const COLORS = ['var(--red)', 'var(--blue)', 'var(--gold)', 'var(--green)', 'var(--cyan)', '#8b5cf6', '#ec4899'];

const TABS = [
  { key: 'info', label: 'Chỉnh sửa thông tin', icon: 'Pen' },
  { key: 'privacy', label: 'Quyền riêng tư & dữ liệu', icon: 'Globe' },
  { key: 'devices', label: 'Thiết bị đăng nhập', icon: 'Bookmark' },
  { key: 'activity', label: 'Lịch sử hoạt động', icon: 'Clock' },
];

const DEVICE_ICONS = ['💻', '📱', '📱', '💻', '🖥️', '💻'];

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60 * 1000) return 'Vừa xong';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} phút trước`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} giờ trước`;
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'info';
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const [wards, setWards] = useState([]);
  const [schools, setSchools] = useState([]);
  const [form, setForm] = useState({ full_name: '', bio: '', ward: '', school: '' });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState([]);
  const [consentChoices, setConsentChoices] = useState({});
  const [savingConsent, setSavingConsent] = useState(false);
  const [showAnonymizeModal, setShowAnonymizeModal] = useState(false);
  const [anonymizing, setAnonymizing] = useState(false);
  const [devices, setDevices] = useState(null);
  const [activity, setActivity] = useState(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  useEffect(() => {
    if (user && !loaded) {
      setForm({
        full_name: user.full_name || '',
        bio: user.bio || '',
        ward: user.ward || '',
        school: user.school || '',
      });
      setLoaded(true);
    }
  }, [user, loaded]);

  useEffect(() => {
    api.ranking.wards().then(setWards).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.ward) {
      setSchools([]);
      return;
    }
    api.ranking.schools(form.ward).then(setSchools).catch(() => setSchools([]));
  }, [form.ward]);

  useEffect(() => {
    if (!user) return;
    api.auth.consents().then(rows => {
      const list = rows || [];
      setConsents(list);
      const latest = {};
      list.forEach(r => {
        if (latest[r.policy_key] === undefined || r.version >= latest[r.policy_key].version) latest[r.policy_key] = r;
      });
      const choices = {};
      CONSENT_ITEMS.forEach(c => { choices[c.key] = !!latest[c.key]?.accepted; });
      setConsentChoices(choices);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (activeTab === 'devices' && devices === null && user) {
      api.auth.devices().then(setDevices).catch(() => setDevices([]));
    }
  }, [activeTab, devices, user]);

  useEffect(() => {
    if (activeTab === 'activity' && activity === null && user) {
      api.auth.activity().then(setActivity).catch(() => setActivity([]));
    }
  }, [activeTab, activity, user]);

  const latestVersionFor = (key) => {
    let v = 0;
    consents.forEach(r => { if (r.policy_key === key) v = Math.max(v, r.version || 0); });
    return v;
  };

  const handleSave = async () => {
    if (!form.full_name.trim()) {
      window.__vimi_toast?.('Vui lòng nhập họ tên', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          bio: form.bio?.trim() || null,
          ward: form.ward || null,
          school: form.school || null,
        })
        .eq('id', user.id);
      if (error) throw error;
      await refreshUser();
      window.__vimi_toast?.('Đã lưu thông tin tài khoản', 'success');
    } catch (e) {
      window.__vimi_toast?.(e.message || 'Lưu thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConsents = async () => {
    setSavingConsent(true);
    try {
      const maxV = consents.reduce((m, r) => Math.max(m, r.version || 0), 0);
      await api.auth.consent(CONSENT_ITEMS.map(c => ({
        key: c.key,
        version: maxV + 1,
        accepted: !!consentChoices[c.key],
      })));
      const rows = await api.auth.consents();
      setConsents(rows || []);
      setActivity(null);
      window.__vimi_toast?.('Đã cập nhật lựa chọn xử lý dữ liệu', 'success');
    } catch (e) {
      window.__vimi_toast?.(e.message || 'Lưu thất bại', 'error');
    } finally {
      setSavingConsent(false);
    }
  };

  const handleAnonymize = async () => {
    setAnonymizing(true);
    try {
      await api.auth.anonymize();
      window.__vimi_toast?.('Dữ liệu của bạn đã được khử nhận dạng', 'success');
      await logout();
      navigate('/');
    } catch (e) {
      window.__vimi_toast?.(e.message || 'Không thể xóa dữ liệu', 'error');
      setAnonymizing(false);
    }
  };

  const handleDeviceSignout = async (device) => {
    if (!window.confirm(`Đăng xuất khỏi thiết bị "${device.device_name || 'Thiết bị'}"? Bạn sẽ phải đăng nhập lại trên thiết bị đó.`)) return;
    try {
      await api.auth.deviceSignout(device.id);
      setDevices(prev => (prev || []).filter(d => d.id !== device.id));
      window.__vimi_toast?.('Đã đăng xuất khỏi thiết bị', 'success');
    } catch (e) {
      window.__vimi_toast?.(e.message || 'Không thể đăng xuất thiết bị', 'error');
    }
  };

  const avatarColor = COLORS[parseInt(user?.id?.slice(-1) || '0') % COLORS.length];
  const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : 'Giáo viên';

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Icon.User size={24} /> Thông tin tài khoản</h1>
        <p>Xem và cập nhật thông tin cá nhân, quyền riêng tư và hoạt động của bạn.</p>
      </div>

      <Card style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: avatarColor,
            color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 20, flexShrink: 0,
          }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{user?.full_name || 'User'}</h2>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{user?.email}</div>
            <span className="pill" style={{ marginTop: 8, background: 'var(--red-bg)', color: 'var(--red)' }}>{roleLabel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 24, marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{user?.xp?.toLocaleString() || 0}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>XP</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon.Flame size={18} style={{ color: (user?.streak_days || 0) > 0 ? 'var(--gold)' : 'var(--muted)' }} />
              {user?.streak_days || 0}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Ngày liên tiếp</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16 }}>
        {TABS.map(t => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                padding: '9px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                border: '1px solid ' + (active ? 'var(--red)' : 'var(--line)'),
                background: active ? 'var(--red)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--ink)',
              }}
            >
              {t.icon === 'Pen' && <Icon.Pen size={14} />}
              {t.icon === 'Globe' && <Icon.Globe size={14} />}
              {t.icon === 'Bookmark' && <Icon.Bookmark size={14} />}
              {t.icon === 'Clock' && <Icon.Clock size={14} />}
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'info' && (
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.Cog size={16} /> Chỉnh sửa thông tin
          </h3>
          <div className="form-group">
            <label>Họ tên *</label>
            <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Họ và tên" />
          </div>
          <div className="form-group">
            <label>Giới thiệu</label>
            <textarea
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Đôi nét về bạn (chức danh, môn dạy, sở thích...)"
              rows={3}
              style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 14, background: 'var(--surface-input)', resize: 'vertical', font: 'inherit' }}
            />
          </div>
          <div className="form-group">
            <label>Phường / Xã</label>
            <select value={form.ward} onChange={e => setForm({ ...form, ward: e.target.value, school: '' })}>
              <option value="">— Chọn phường / xã —</option>
              {wards.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Trường học</label>
            <select value={form.school} onChange={e => setForm({ ...form, school: e.target.value })} disabled={!form.ward}>
              <option value="">{form.ward ? '— Chọn trường —' : 'Chọn phường/xã trước'}</option>
              {schools.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <Button variant="primary" isDisabled={saving} onClick={handleSave}>
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </Card>
      )}

      {activeTab === 'privacy' && (
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.Globe size={16} /> Quyền riêng tư & dữ liệu
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Bạn có thể bật/tắt từng mục đích xử lý dữ liệu bất kỳ lúc nào. Mục đã tắt sẽ ngừng thu thập và xử lý.
          </p>

          {CONSENT_ITEMS.map(item => {
            const v = latestVersionFor(item.key);
            return (
              <label
                key={item.key}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
                  padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                  border: '1px solid var(--line)', background: 'var(--surface-hover)',
                }}
              >
                <input
                  type="checkbox"
                  checked={!!consentChoices[item.key]}
                  onChange={e => setConsentChoices({ ...consentChoices, [item.key]: e.target.checked })}
                  style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16 }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>
                    {item.title}{' '}
                    <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {v > 0 ? `· lần cập nhật #${v}` : '· chưa từng chọn'}
                    </span>
                  </b>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, marginTop: 3 }}>{item.desc}</div>
                </span>
              </label>
            );
          })}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, marginTop: 8 }}>
            <Button variant="primary" size="sm" isDisabled={savingConsent} onClick={handleSaveConsents}>
              {savingConsent ? 'Đang lưu...' : 'Lưu lựa chọn'}
            </Button>
            <span
              style={{
                display: 'inline-flex',
                border: '1px solid var(--red)',
                background: 'var(--red-bg)',
                borderRadius: 8,
                padding: 1,
              }}
            >
              <Button
                variant="ghost"
                size="sm"
                style={{ color: 'var(--red)', fontWeight: 700, padding: '6px 12px', fontSize: 12 }}
                isDisabled={anonymizing}
                onClick={() => setShowAnonymizeModal(true)}
              >
                Xóa dữ liệu của tôi
              </Button>
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>
            Email, họ tên, trường và địa chỉ IP của bạn sẽ bị xóa vĩnh viễn.
            Chỉ giữ lại dữ liệu học tập đã ẩn danh (không nhận dạng được bạn) để thống kê.
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, marginBottom: 0 }}>
            Xem chi tiết tại{' '}
            <a
              onClick={(e) => { e.preventDefault(); setShowPolicyModal(true); }}
              style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
            >
              Chính sách bảo mật
            </a>
          </p>
        </Card>
      )}

      {activeTab === 'devices' && (
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.Bookmark size={16} /> Thiết bị đăng nhập
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Các thiết bị đã đăng nhập vào tài khoản của bạn (50 lần gần nhất).
          </p>
          {devices === null ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Đang tải...</p>
          ) : devices.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Chưa có thiết bị nào được ghi nhận.</p>
          ) : (
            devices.map((d, i) => (
              <div
                key={d.id}
                style={{
                  display: 'flex', gap: 12, alignItems: 'center',
                  padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                  border: '1px solid var(--line)', background: 'var(--surface-hover)',
                }}
              >
                <div style={{ fontSize: 22 }}>{DEVICE_ICONS[i % DEVICE_ICONS.length]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: 13 }}>
                    {d.device_name || 'Thiết bị'}{' '}
                    {i === 0 && (
                      <span className="pill" style={{ fontSize: 10, background: 'var(--green-bg)', color: 'var(--green)', marginLeft: 6 }}>
                        Thiết bị hiện tại
                      </span>
                    )}
                  </b>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    IP: {d.ip || '-'} · {fmtTime(d.logged_in_at)}
                  </div>
                </div>
                <Button variant="ghost" size="sm" style={{ color: 'var(--red)', fontWeight: 600, flexShrink: 0 }} onClick={() => handleDeviceSignout(d)}>
                  Đăng xuất
                </Button>
              </div>
            ))
          )}
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon.Clock size={16} /> Lịch sử hoạt động
          </h3>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
            Các hoạt động gần đây trên tài khoản của bạn (50 sự kiện gần nhất).
          </p>
          {activity === null ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Đang tải...</p>
          ) : activity.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Chưa có hoạt động nào.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Thời gian</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Tên đầy đủ</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Người bị ảnh hưởng</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Bối cảnh</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Thành phần</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Tên sự kiện</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)' }}>Mô tả</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>Nguyên thủy</th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.map(a => (
                    <tr key={a.id || a.created_at} style={{ verticalAlign: 'top' }}>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{fmtTime(a.created_at)}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{a.full_name || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{a.affected_user || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{a.context || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap' }}>{a.component || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', fontWeight: 700 }}>{a.event}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>{a.description || '-'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{a.origin || 'web'}</td>
                      <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--line)', whiteSpace: 'nowrap', color: 'var(--muted)' }}>{a.ip || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {showAnonymizeModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,.55)',
            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !anonymizing) setShowAnonymizeModal(false); }}
        >
          <Card style={{ maxWidth: 460, width: '100%', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, color: 'var(--red)' }}>
              Xóa dữ liệu của tôi?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7 }}>
              Toàn bộ dữ liệu cá nhân của bạn sẽ bị xóa vĩnh viễn —{' '}
              <b>tài khoản (kể cả email đăng nhập) sẽ bị xóa luôn</b> và không thể hoàn tác.
              Bạn có thể tạo tài khoản mới bất kỳ lúc nào.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <Button variant="ghost" isDisabled={anonymizing} onClick={() => setShowAnonymizeModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" isDisabled={anonymizing} onClick={handleAnonymize}>
                {anonymizing ? 'Đang xử lý...' : 'Xác nhận xóa'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showPolicyModal && <PolicyModal slug="chinh-sach-bao-mat" onClose={() => setShowPolicyModal(false)} />}
    </div>
  );
}
