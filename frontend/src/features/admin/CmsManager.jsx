import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import RichEditor from '../../components/ui/RichEditor';
import Button from '../../components/ui/Button';

const TYPE_LABEL = { blog: 'Bài viết', help: 'Trợ giúp', policy: 'Chính sách' };

function ItemForm({ type, initial, onDone, onCancel }) {
  const [form, setForm] = useState({
    slug: initial?.slug || '',
    title: initial?.title || '',
    excerpt: initial?.excerpt || '',
    category: initial?.category || '',
    cover_url: initial?.cover_url || '',
    body: initial?.body || '',
    status: initial?.status || 'draft',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const coverRef = useState(null)[1];

  const handleCover = async (file) => {
    if (!file) return;
    try {
      const url = await api.cms.upload(file);
      setForm(f => ({ ...f, cover_url: url }));
    } catch (err) {
      setError('Upload ảnh bìa thất bại: ' + err.message);
    }
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (initial?.id) {
        await api.cms.adminUpdate(type, initial.slug, form);
      } else {
        await api.cms.adminCreate(type, form);
      }
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tiêu đề *</label>
          <input className="admin-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Slug *</label>
          <input className="admin-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} disabled={!!initial?.id} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Danh mục</label>
          <input className="admin-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder={type === 'blog' ? 'CLIL & Song ngữ, Đánh giá...' : 'Học tập, Thanh toán...'} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Ảnh bìa</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="admin-input" value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="URL ảnh" />
            <Button size="sm" onClick={() => document.getElementById('cover-file').click()} label="Upload" />
            <input id="cover-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { handleCover(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tóm tắt</label>
        <textarea className="admin-input" rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nội dung (soạn như Word)</label>
        <RichEditor value={form.body} onChange={body => setForm(f => ({ ...f, body }))} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <select className="admin-input" style={{ width: 180 }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="draft">Bản nháp</option>
          <option value="published">Đăng công khai</option>
        </select>
        <Button variant="primary" size="sm" onClick={save} isDisabled={busy || !form.title || !form.slug}>
          {busy ? 'Đang lưu...' : initial?.id ? 'Lưu thay đổi' : 'Tạo mới'}
        </Button>
        <Button size="sm" onClick={onCancel} label="Hủy" />
      </div>
      {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

export default function CmsManager() {
  const [tab, setTab] = useState('blog');
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [policyVersions, setPolicyVersions] = useState([]);
  const [policyForm, setPolicyForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    api.cms.adminList(tab).then(setList).catch(() => {});
    if (tab === 'policy') {
      api.cms.adminGet('policy', 'chinh-sach-bao-mat').then(setPolicyVersions).catch(() => {});
    }
  };

  useEffect(load, [tab]);

  const remove = async (item) => {
    if (!window.confirm(`Xóa "${item.title}"?`)) return;
    try {
      await api.cms.adminDelete(tab, item.slug);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const publishToggle = async (item) => {
    try {
      await api.cms.adminUpdate(tab, item.slug, { status: item.status === 'published' ? 'draft' : 'published' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const createPolicyVersion = async () => {
    if (!policyForm?.body) { setError('Vui lòng soạn nội dung bản cập nhật'); return; }
    setBusy(true);
    setError('');
    try {
      await api.cms.adminNewVersion('chinh-sach-bao-mat', policyForm);
      setPolicyForm(null);
      setNotice('Đã tạo bản cập nhật mới. Người dùng sẽ được yêu cầu đồng ý lại khi đăng nhập.');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const activePolicy = policyVersions.find(v => v.is_active);

  return (
    <div className="admin-panel">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['blog', 'help', 'policy'].map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setEditing(null); }}
            className={`quest-tab ${tab === t ? 'active' : ''}`}
            style={{ fontSize: 13 }}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {notice && <div style={{ padding: '10px 14px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{notice}</div>}
      {error && <div style={{ padding: '10px 14px', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {tab === 'policy' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <h3 style={{ margin: 0 }}>Chính sách bảo mật</h3>
            <Button variant="primary" size="sm" onClick={() => setPolicyForm({ title: activePolicy?.title || 'Chính sách bảo mật', excerpt: activePolicy?.excerpt, body: activePolicy?.body })} label="Tạo bản cập nhật mới" />
          </div>

          {activePolicy && (
            <div style={{ padding: '10px 14px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: 10, fontSize: 13, marginBottom: 12 }}>
              Bản đang áp dụng: <b>v{activePolicy.version}</b> — cập nhật {activePolicy.updated_at ? new Date(activePolicy.updated_at).toLocaleString('vi-VN') : ''}
            </div>
          )}

          {policyForm && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, marginBottom: 10 }}>Bản cập nhật mới (version {activePolicy ? activePolicy.version + 1 : 2})</h4>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Tiêu đề</label>
                <input className="admin-input" value={policyForm.title || ''} onChange={e => setPolicyForm({ ...policyForm, title: e.target.value })} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>Nội dung chính sách mới (soạn như Word)</label>
                <RichEditor value={policyForm.body} onChange={body => setPolicyForm(f => ({ ...f, body }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <Button variant="primary" size="sm" onClick={createPolicyVersion} isDisabled={busy}>{busy ? 'Đang tạo...' : 'Cập nhật & kích hoạt bản mới'}</Button>
                <Button size="sm" onClick={() => setPolicyForm(null)} label="Hủy" />
              </div>
            </div>
          )}

          <h4 style={{ fontSize: 13, margin: '14px 0 10px' }}>Lịch sử các bản</h4>
          <div className="admin-table-wrap">
            <table className="admin-table" style={{ minWidth: 520 }}>
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Tiêu đề</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {policyVersions.map(v => (
                  <tr key={v.id}>
                    <td>v{v.version}</td>
                    <td>{v.title}</td>
                    <td>{v.is_active ? <span className="admin-badge green">Đang áp dụng</span> : <span className="admin-badge gray">Cũ</span>}</td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{v.updated_at ? new Date(v.updated_at).toLocaleString('vi-VN') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{TYPE_LABEL[tab]} ({list.length})</h3>
            <Button variant="primary" size="sm" onClick={() => setEditing({})} label="+ Tạo mới" />
          </div>

          {editing && (
            <ItemForm
              type={tab}
              initial={editing.id ? editing : null}
              onDone={() => { setEditing(null); load(); }}
              onCancel={() => setEditing(null)}
            />
          )}

          <div className="admin-table-wrap">
            <table className="admin-table" style={{ minWidth: 640 }}>
              <thead>
                <tr>
                  <th>Tiêu đề</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Cập nhật</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>{item.slug}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{item.category || '—'}</td>
                    <td>
                      {item.status === 'published'
                        ? <span className="admin-badge green">Đã đăng</span>
                        : <span className="admin-badge gray">Nháp</span>}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--muted)' }}>{item.updated_at ? new Date(item.updated_at).toLocaleDateString('vi-VN') : ''}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="admin-btn" onClick={() => setEditing(item)}>Sửa</button>
                        <button className="admin-btn-ghost" onClick={() => publishToggle(item)}>
                          {item.status === 'published' ? 'Gỡ' : 'Đăng'}
                        </button>
                        <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => remove(item)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {list.length === 0 && <p className="admin-note">Chưa có nội dung nào.</p>}
        </div>
      )}
    </div>
  );
}
