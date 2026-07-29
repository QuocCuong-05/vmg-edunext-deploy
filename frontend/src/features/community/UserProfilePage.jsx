import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

const COLORS = ['var(--red)', 'var(--blue)', 'var(--gold)', 'var(--green)', 'var(--cyan)', '#8b5cf6', '#ec4899'];

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Unknown';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

function hasLoggedInToday(lastLogin) {
  if (!lastLogin) return false;
  const today = new Date();
  const login = new Date(lastLogin);
  return login.toDateString() === today.toDateString();
}

export default function UserProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [reminding, setReminding] = useState(false);
  const [remindSent, setRemindSent] = useState(false);
  const [error, setError] = useState('');

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api.users.profile(userId);
        setProfile(data);
      } catch {
        setError('Could not load profile');
        setLoading(false);
        return;
      }
      if (currentUser?.id && !isOwnProfile) {
        const following = await api.users.isFollowing(currentUser.id, userId);
        setIsFollowing(following);
      }
      try {
        const [fList, folList] = await Promise.all([
          api.users.followers(userId),
          api.users.following(userId),
        ]);
        setFollowers(Array.isArray(fList) ? fList : []);
        setFollowing(Array.isArray(folList) ? folList : []);
      } catch {}
      setLoading(false);
    }
    load();
  }, [userId, currentUser?.id, isOwnProfile]);

  const handleFollowToggle = async () => {
    if (!currentUser?.id || isOwnProfile) return;
    if (isFollowing) {
      await api.users.unfollow(currentUser.id, userId);
      setIsFollowing(false);
    } else {
      await api.users.follow(currentUser.id, userId);
      setIsFollowing(true);
    }
  };

  const handleRemind = async () => {
    if (!currentUser?.id || remindSent || reminding) return;
    setReminding(true);
    try {
      await api.users.remind(currentUser.id, userId);
      setRemindSent(true);
    } catch {}
    setReminding(false);
  };

  if (loading) {
    return (
      <div className="page-enter" style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="page-enter">
        <div className="page-title">
          <h1>User not found</h1>
          <p>{error || 'This user does not exist.'}</p>
          <Link to="/community"><Button variant="ghost" size="sm">Back to Community</Button></Link>
        </div>
      </div>
    );
  }

  const loggedInToday = hasLoggedInToday(profile.last_login);
  const canRemind = !isOwnProfile && isFollowing && !loggedInToday;

  return (
    <div className="page-enter" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Link to="/community" style={{ textDecoration: 'none', color: 'var(--muted)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
        <Icon.ArrowLeft size={16} /> Back to Community
      </Link>

      <Card style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: COLORS[parseInt(userId?.slice(-1) || '0') % COLORS.length],
            color: '#fff', display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 18, flexShrink: 0,
          }}>
            {getInitials(profile.full_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{profile.full_name}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4, fontSize: 13, color: 'var(--muted)' }}>
              {profile.school && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Book size={14} /> {profile.school}</span>}
              {profile.ward && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon.Globe size={14} /> {profile.ward}</span>}
            </div>
          </div>
          {!isOwnProfile && currentUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Button
                variant={isFollowing ? 'ghost' : 'primary'}
                size="sm"
                onClick={handleFollowToggle}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              {canRemind && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemind}
                  isDisabled={reminding || remindSent}
                  style={{ color: 'var(--gold)' }}
                >
                  {remindSent ? 'Reminded!' : reminding ? 'Sending...' : 'Remind to study'}
                </Button>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--red)' }}>{profile.xp?.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>XP</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Icon.Flame size={18} style={{ color: profile.streak_days > 0 ? 'var(--gold)' : 'var(--muted)' }} />
              {profile.streak_days}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Day Streak</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1, cursor: 'pointer' }} onClick={() => setShowFollowers(true)}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{profile.followers_count}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Followers</div>
          </div>
          <div style={{ textAlign: 'center', flex: 1, cursor: 'pointer' }} onClick={() => setShowFollowing(true)}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{profile.following_count}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Following</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--muted)' }}>
            Last login: {timeAgo(profile.last_login)}
          </span>
          {loggedInToday ? (
            <span style={{ color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon.CheckCircle size={16} /> Studied today
            </span>
          ) : (
            <span style={{ color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Icon.Flame size={16} /> Not yet today
            </span>
          )}
        </div>
      </Card>

      {showFollowers && (
        <div onClick={() => setShowFollowers(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 340, maxHeight: '70vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Followers</h3>
            {followers.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>No followers yet.</p>}
            {followers.map(f => (
              <Link key={f.id} to={`/profile/${f.id}`} onClick={() => setShowFollowers(false)} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS[parseInt(f.id?.slice(-1) || '0') % COLORS.length], color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11 }}>{getInitials(f.full_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.xp?.toLocaleString()} XP</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showFollowing && (
        <div onClick={() => setShowFollowing(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 12, padding: 20, width: 340, maxHeight: '70vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Following</h3>
            {following.length === 0 && <p style={{ fontSize: 13, color: 'var(--muted)' }}>Not following anyone yet.</p>}
            {following.map(f => (
              <Link key={f.id} to={`/profile/${f.id}`} onClick={() => setShowFollowing(false)} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: COLORS[parseInt(f.id?.slice(-1) || '0') % COLORS.length], color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 11 }}>{getInitials(f.full_name)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{f.full_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{f.xp?.toLocaleString()} XP</div>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Flame size={12} /> {f.streak_days}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
