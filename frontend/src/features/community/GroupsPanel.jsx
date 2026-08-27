import { useState, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

const inputStyle = {
  width: '100%',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 13,
  fontFamily: 'inherit',
  background: 'var(--surface-input)',
  color: 'var(--ink)',
};

export default function GroupsPanel() {
  const { user } = useAuth();
  const showToast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.community.groups.list()
      .then(data => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || saving || !user?.id) return;
    setSaving(true);
    try {
      const g = await api.community.groups.create(name.trim(), description.trim());
      setGroups(prev => [{ ...g, is_member: true }, ...prev]);
      setName('');
      setDescription('');
      setCreating(false);
      showToast('Đã tạo nhóm', 'success');
    } catch (err) {
      showToast(err.message || 'Tạo nhóm thất bại', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleJoin = async (g) => {
    if (!user?.id) {
      showToast('Vui lòng đăng nhập để tham gia nhóm', 'error');
      return;
    }
    const wasMember = g.is_member;
    setJoiningId(g.id);
    setGroups(prev => prev.map(x => x.id === g.id
      ? { ...x, is_member: !wasMember, member_count: Math.max(0, x.member_count + (wasMember ? -1 : 1)) }
      : x));
    try {
      const res = await api.community.groups.join(g.id);
      setGroups(prev => prev.map(x => x.id === g.id ? { ...x, is_member: !!res.joined } : x));
    } catch {
      setGroups(prev => prev.map(x => x.id === g.id
        ? { ...x, is_member: wasMember, member_count: Math.max(0, x.member_count + (wasMember ? 1 : -1)) }
        : x));
      showToast('Có lỗi, vui lòng thử lại', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <Card style={{ marginBottom: 16, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          👥 Nhóm cộng đồng
        </h3>
        {user?.id && (
          <button
            type="button"
            onClick={() => setCreating(c => !c)}
            style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {creating ? 'Hủy' : '+ Tạo nhóm'}
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={handleCreate} style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tên nhóm"
            maxLength={60}
            autoFocus
            style={inputStyle}
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Mô tả (tuỳ chọn)"
            style={{ ...inputStyle, resize: 'vertical', minHeight: 56 }}
          />
          <Button variant="primary" size="sm" type="submit" isDisabled={!name.trim() || saving}>
            {saving ? 'Đang tạo...' : 'Tạo nhóm'}
          </Button>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Đang tải...</p>
      ) : groups.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
          Chưa có nhóm nào. Tạo nhóm đầu tiên để kết nối với đồng nghiệp!
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {groups.map(g => (
            <div key={g.id} style={{ border: '1px solid var(--line)', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{g.name}</div>
                <Button
                  variant={g.is_member ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => handleJoin(g)}
                  isDisabled={joiningId === g.id}
                >
                  {g.is_member ? 'Rời' : 'Tham gia'}
                </Button>
              </div>
              {g.description && (
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: '4px 0 6px', lineHeight: 1.5 }}>{g.description}</p>
              )}
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{g.member_count || 0} thành viên</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
