import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import Card from '../../components/ui/Card';
import { Icon } from '../../lib/icons';

export function PolicyContent({ policy }) {
  if (!policy) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Icon.BookOpen size={22} style={{ color: 'var(--red)' }} />
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{policy.title}</h1>
      </div>
      <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
        Cập nhật lần cuối: {policy.updated}{policy.version ? ` · Bản ${policy.version}` : ''}
      </p>
      <Card style={{ padding: 'min(28px, 6vw)' }}>
        <div className="article-content" dangerouslySetInnerHTML={{ __html: policy.body || '' }} />
      </Card>
    </div>
  );
}

export default function PolicyPage() {
  const { slug } = useParams();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.cms.policyActive(slug).then(p => {
      if (p) {
        setPolicy({
          ...p,
          updated: p.updated_at ? new Date(p.updated_at).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : '',
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>;
  }

  if (!policy) {
    return (
      <div className="empty" style={{ minHeight: '60vh' }}>
        <h3>Không tìm thấy chính sách</h3>
      </div>
    );
  }

  return (
    <div className="main-public" style={{ maxWidth: 720, margin: '0 auto' }}>
      <PolicyContent policy={policy} />
    </div>
  );
}
