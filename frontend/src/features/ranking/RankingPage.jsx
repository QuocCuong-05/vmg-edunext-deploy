import { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Card from '../../components/ui/Card';

const INITIALS_COLORS = ['var(--red)', 'var(--blue)', 'var(--gold)', 'var(--green)', 'var(--cyan)', '#8b5cf6', '#ec4899', '#f59e0b'];

function getInitials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function RankingPage() {
  const { user } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.ranking.list().then(data => {
      setRankings(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const myRank = rankings.findIndex(r => r.id === user?.id) + 1;

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Stats size={24} /> Leaderboard
        </h1>
        <p>Top teachers ranked by experience points</p>
      </div>

      {user && (
      <Card style={{ marginBottom: 20, background: 'linear-gradient(160deg, var(--red-bg), var(--card))', border: '1px solid var(--red)', padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>My Rank</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--red)', color: '#fff',
            display: 'grid', placeItems: 'center',
            fontWeight: 900, fontSize: 16,
          }}>
            {myRank || '--'}
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg)', color: 'var(--red)',
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 16,
          }}>
            {getInitials(user?.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.full_name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Level {Math.floor((user?.xp || 0) / 3000) + 1}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>
            {(user?.xp || 0).toLocaleString()} XP
          </div>
        </div>
      </Card>
      )}

      <div className="section-title">
        <h3>Top Teachers</h3>
      </div>
      {loading ? (
        <p style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Đang tải...</p>
      ) : rankings.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 14 }}>Chưa có dữ liệu xếp hạng</Card>
      ) : rankings.map((r, i) => (
        <Card key={r.id} style={{
          padding: '16px 20px', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 16,
          ...(r.id === user?.id ? { border: '1px solid var(--red)' } : {}),
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: i < 3 ? INITIALS_COLORS[i] : 'var(--bg)',
            color: i < 3 ? '#fff' : 'var(--ink)',
            display: 'grid', placeItems: 'center',
            fontWeight: 900, fontSize: 14, flexShrink: 0,
          }}>
            {i + 1}
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--bg)', color: INITIALS_COLORS[i % INITIALS_COLORS.length],
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 13, flexShrink: 0,
          }}>
            {getInitials(r.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Level {Math.floor(r.xp / 3000) + 1}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{r.xp.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>XP</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
