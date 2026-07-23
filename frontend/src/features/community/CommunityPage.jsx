import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const POSTS = [
  {
    id: 'p1', author: 'Tran Van An', timestamp: '2 hours ago',
    avatar: 'TA', content: 'Just finished the CLIL lesson planning module. The 4Cs framework is a game-changer for my science classes!',
    likes: 24, comments: 8, shares: 3,
  },
  {
    id: 'p2', author: 'Le Thi Hoa', timestamp: '5 hours ago',
    avatar: 'LH', content: 'Anyone using exit tickets regularly? I found that asking "What is one thing you understood better today?" works really well with my 6th graders.',
    likes: 18, comments: 12, shares: 5,
  },
  {
    id: 'p3', author: 'Pham Minh Duc', timestamp: '1 day ago',
    avatar: 'PD', content: 'Tip for new teachers: wait time is your best friend. Count to five silently after asking a question. The quality of answers improves dramatically.',
    likes: 42, comments: 15, shares: 10,
  },
  {
    id: 'p4', author: 'Hoang Ngoc Lan', timestamp: '2 days ago',
    avatar: 'HL', content: 'Our school just adopted VMG EduNext for our bilingual program. The teachers are loving the practical phrases for classroom management!',
    likes: 31, comments: 6, shares: 8,
  },
];

const GROUPS = [
  { name: 'CLIL Teachers Vietnam', members: 1240 },
  { name: 'Classroom English Practitioners', members: 890 },
  { name: 'Bilingual Education Research', members: 560 },
  { name: 'Vietnamese Teacher Network', members: 2100 },
];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const COLORS = ['var(--red)', 'var(--blue)', 'var(--green)', 'var(--gold)'];

export default function CommunityPage() {
  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Classroom size={24} /> Community
        </h1>
        <p>Connect with fellow educators</p>
      </div>

      <div className="community-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {POSTS.map((post, i) => (
            <Card key={post.id} style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: COLORS[i % COLORS.length], color: '#fff',
                  display: 'grid', placeItems: 'center',
                  fontWeight: 800, fontSize: 13,
                }}>
                  {post.avatar}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{post.timestamp}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)', marginBottom: 14 }}>
                {post.content}
              </p>
              <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.ArrowRight size={14} /> {post.likes}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Classroom size={14} /> {post.comments}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.Send size={14} /> {post.shares}
                </span>
              </div>
            </Card>
          ))}
        </div>

        <div>
          <Card style={{ marginBottom: 16, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Book size={16} /> Groups
            </h3>
            {GROUPS.map((g, i) => (
              <div key={g.name} style={{
                padding: '10px 0',
                borderBottom: i < GROUPS.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{g.members.toLocaleString()} members</div>
              </div>
            ))}
            <Button variant="ghost" size="sm" label="View All Groups" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }} />
          </Card>

          <Card style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Sparkles size={16} /> Trending Topics
            </h3>
            {['CLIL', 'Classroom English', 'Assessment', 'Learning Science', 'Translanguaging'].map(t => (
              <div key={t} className="pill" style={{ margin: '0 4px 8px 0', cursor: 'pointer' }}>
                {t}
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
