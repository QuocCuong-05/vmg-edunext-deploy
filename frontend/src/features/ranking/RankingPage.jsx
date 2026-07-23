import { Icon } from '../../lib/icons';
import { useAuth } from '../auth/AuthContext';
import Card from '../../components/ui/Card';

const MOCK_RANKINGS = [
  { rank: 1, name: 'Tran Van An', xp: 5200, level: 5 },
  { rank: 2, name: 'Le Thi Hoa', xp: 4800, level: 4 },
  { rank: 3, name: 'Pham Minh Duc', xp: 4100, level: 4 },
  { rank: 4, name: 'Hoang Ngoc Lan', xp: 3700, level: 3 },
  { rank: 5, name: 'Vu Thanh Ha', xp: 3200, level: 3 },
  { rank: 6, name: 'Doan Quoc Hung', xp: 2900, level: 2 },
  { rank: 7, name: 'Bui Thi Mai', xp: 2400, level: 2 },
  { rank: 8, name: 'Dang Cong Son', xp: 2100, level: 2 },
];

const INITIALS_COLORS = ['var(--red)', 'var(--blue)', 'var(--gold)', 'var(--green)', 'var(--cyan)', '#8b5cf6', '#ec4899', '#f59e0b'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function RankingPage() {
  const { user } = useAuth();

  const myRank = {
    rank: '--',
    name: user?.full_name || 'Nguyen Thi Minh',
    xp: user?.xp || 2450,
    level: Math.floor((user?.xp || 2450) / 3000) + 1,
  };

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Stats size={24} /> Leaderboard
        </h1>
        <p>Top teachers ranked by experience points</p>
      </div>

      <Card style={{ marginBottom: 20, background: 'linear-gradient(160deg, var(--red-bg), var(--card))', border: '1px solid var(--red)', padding: '16px 20px' }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>My Rank</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--red)', color: '#fff',
            display: 'grid', placeItems: 'center',
            fontWeight: 900, fontSize: 16,
          }}>
            {myRank.rank}
          </div>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'var(--bg)', color: 'var(--red)',
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 16,
          }}>
            {getInitials(myRank.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myRank.name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>Level {myRank.level}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--red)' }}>
            {myRank.xp.toLocaleString()} XP
          </div>
        </div>
      </Card>

      <div className="section-title">
        <h3>Top Teachers</h3>
      </div>
      {MOCK_RANKINGS.map((r, i) => (
        <Card key={r.rank} style={{
          padding: '16px 20px', marginBottom: 8,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: i < 3 ? INITIALS_COLORS[i] : 'var(--bg)',
            color: i < 3 ? '#fff' : 'var(--ink)',
            display: 'grid', placeItems: 'center',
            fontWeight: 900, fontSize: 14, flexShrink: 0,
          }}>
            {r.rank}
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'var(--bg)', color: INITIALS_COLORS[i % INITIALS_COLORS.length],
            display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 13, flexShrink: 0,
          }}>
            {getInitials(r.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Level {r.level}</div>
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
