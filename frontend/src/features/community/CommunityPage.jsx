import { useState, useEffect } from 'react';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { API_BASE } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

const MOCK_POSTS = [
  { id: 'p1', user_id: 'user-001', author_name: 'Tran Van An', author_avatar: 'TA', created_at: '2 hours ago', content: 'Just finished the CLIL lesson planning module. The 4Cs framework is a game-changer for my science classes!', likes_count: 24, comments_count: 8, shares_count: 5, user_has_liked: false, user_has_reported: false },
  { id: 'p2', user_id: 'u2', author_name: 'Le Thi Hoa', author_avatar: 'LH', created_at: '5 hours ago', content: 'Anyone using exit tickets regularly? I found that asking "What is one thing you understood better today?" works really well with my 6th graders.', likes_count: 18, comments_count: 12, shares_count: 3, user_has_liked: false, user_has_reported: false },
  { id: 'p3', user_id: 'u3', author_name: 'Pham Minh Duc', author_avatar: 'PD', created_at: '1 day ago', content: 'Tip for new teachers: wait time is your best friend. Count to five silently after asking a question. The quality of answers improves dramatically.', likes_count: 42, comments_count: 15, shares_count: 12, user_has_liked: false, user_has_reported: false },
  { id: 'p4', user_id: 'u4', author_name: 'Hoang Ngoc Lan', author_avatar: 'HL', created_at: '2 days ago', content: 'Our school just adopted VMG EduNext for our bilingual program. The teachers are loving the practical phrases for classroom management!', likes_count: 31, comments_count: 6, shares_count: 7, user_has_liked: false, user_has_reported: false },
];

const MOCK_GROUPS = [
  { id: 'g1', name: 'CLIL Teachers Vietnam', member_count: 1240, is_member: false },
  { id: 'g2', name: 'Classroom English Practitioners', member_count: 890, is_member: false },
  { id: 'g3', name: 'Bilingual Education Research', member_count: 560, is_member: false },
  { id: 'g4', name: 'Vietnamese Teacher Network', member_count: 2100, is_member: false },
];

const COLORS = ['var(--red)', 'var(--blue)', 'var(--green)', 'var(--gold)'];

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString('en-GB');
}

function shareToFacebook(content) {
  const url = window.location.origin + '/community';
  const quote = content.length > 300 ? content.slice(0, 297) + '...' : content;
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(quote)}`,
    '_blank', 'width=600,height=400'
  );
}

function PostCard({ post, onLike, onToggleComments, onAddComment, expanded, comments, savingComment, newComment, onCommentChange, onShare, onEdit, onDelete, onReport, currentUserId, openMenu, onToggleMenu, editing, editContent, onEditContentChange, onSaveEdit, onCancelEdit }) {
  const isOwner = currentUserId && post.user_id === currentUserId;
  const canReport = currentUserId && !isOwner && !post.user_has_reported;

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: COLORS[parseInt(post.id?.slice(-1) || '0') % COLORS.length],
          color: '#fff', display: 'grid', placeItems: 'center',
          fontWeight: 800, fontSize: 13, flexShrink: 0,
        }}>
          {post.author_avatar || getInitials(post.author_name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.author_name}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{timeAgo(post.created_at)}</div>
        </div>
          {(isOwner || canReport) && (
          <div style={{ position: 'relative' }}>
            <span onClick={e => { e.stopPropagation(); onToggleMenu(post.id); }} style={{ cursor: 'pointer', padding: 4, display: 'flex', borderRadius: 4, background: openMenu === post.id ? 'var(--bg)' : 'transparent' }}>
              <Icon.Dots size={16} />
            </span>
            {openMenu === post.id && (
              <div style={{
                position: 'absolute', right: 0, top: '100%', zIndex: 10,
                background: '#fff', border: '1px solid var(--line)', borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,.1)', minWidth: 140, padding: 4,
              }}>
                {isOwner && (
                  <>
                    <div onClick={e => { e.stopPropagation(); onEdit(post.id, post.content); onToggleMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 4 }} onMouseEnter={e => e.target.style.background = 'var(--bg)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                      <Icon.Pen size={14} /> Edit
                    </div>
                    <div onClick={e => { e.stopPropagation(); onDelete(post.id); onToggleMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 4, color: 'var(--red)' }} onMouseEnter={e => e.target.style.background = 'var(--bg)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                      <Icon.Trash size={14} /> Delete
                    </div>
                  </>
                )}
                {canReport && (
                  <div onClick={e => { e.stopPropagation(); onReport(post.id); onToggleMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 4 }} onMouseEnter={e => e.target.style.background = 'var(--bg)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                    <Icon.Flag size={14} /> Report
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {editing ? (
        <div style={{ marginBottom: 14 }}>
          <textarea
            value={editContent}
            onChange={e => onEditContentChange(e.target.value)}
            style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', minHeight: 80 }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <Button variant="primary" size="sm" onClick={() => onSaveEdit(post.id)} isDisabled={!editContent.trim()}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => onCancelEdit(post.id)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--ink)', marginBottom: 14, whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>
      )}
      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--muted)' }}>
        <span onClick={() => onLike(post.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: post.user_has_liked ? 'var(--red)' : 'inherit' }}>
          <Icon.Heart size={14} /> {post.likes_count}
        </span>
        <span onClick={() => onToggleComments(post.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon.Classroom size={14} /> {post.comments_count}
        </span>
        <span onClick={() => onShare(post.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Icon.Send size={14} /> {post.shares_count}
        </span>
      </div>
      {expanded && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--line)', paddingTop: 12 }}>
          {comments.length === 0 && <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>No comments yet.</p>}
          {comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: COLORS[parseInt(c.id?.slice(-1) || '0') % COLORS.length],
                color: '#fff', display: 'grid', placeItems: 'center',
                fontWeight: 700, fontSize: 11, flexShrink: 0,
              }}>
                {c.author_avatar || getInitials(c.author_name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.author_name}</div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{c.content}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input
              value={newComment}
              onChange={e => onCommentChange(post.id, e.target.value)}
              placeholder="Write a comment..."
              style={{ flex: 1, minWidth: 0, border: '1px solid var(--line)', borderRadius: 20, padding: '8px 14px', fontSize: 12 }}
            />
            <button onClick={() => onAddComment(post.id)}
              disabled={!newComment.trim() || savingComment}
              style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 16px', fontSize: 12, cursor: 'pointer', opacity: (!newComment.trim() || savingComment) ? .4 : 1 }}>
              Post
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [savingComment, setSavingComment] = useState({});
  const [createGroupName, setCreateGroupName] = useState('');
  const [createGroupDesc, setCreateGroupDesc] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/community`, { headers: apiHeaders() });
        if (res.ok) setPosts(await res.json());
      } catch {}
      try {
        const res = await fetch(`${API_BASE}/community/groups`, { headers: apiHeaders() });
        if (res.ok) setGroups(await res.json());
      } catch {}
      try {
        const res = await fetch(`${API_BASE}/community/reported`, { headers: apiHeaders() });
        if (res.ok) setReportedPostIds(await res.json());
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handler = () => setOpenMenuPostId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const apiHeaders = () => {
    const token = localStorage.getItem('vmg_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || posting) return;
    setPosting(true);
    const text = newPostContent.trim();
    setNewPostContent('');
    try {
      const res = await fetch(`${API_BASE}/community`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const newPost = await res.json();
        newPost.created_at = new Date().toISOString();
        setPosts(prev => [newPost, ...prev]);
      }
    } catch {}
    setPosting(false);
  };

  const handleLike = async (postId) => {
    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1,
        user_has_liked: !p.user_has_liked,
      } : p
    ));
    try {
      await fetch(`${API_BASE}/community/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      });
    } catch {}
  };

  const handleToggleComments = (postId) => {
    const currentlyExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !currentlyExpanded }));
    if (!currentlyExpanded && !postComments[postId]) {
      fetch(`${API_BASE}/community/${postId}/comments`, { headers: apiHeaders() })
        .then(res => res.ok && res.json())
        .then(data => data && setPostComments(prev => ({ ...prev, [postId]: data })))
        .catch(() => {});
    }
  };

  const handleAddComment = async (postId) => {
    const text = newComments[postId]?.trim();
    if (!text) return;
    setSavingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`${API_BASE}/community/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        newComment.created_at = new Date().toISOString();
        setPostComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment],
        }));
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ));
        setNewComments(prev => ({ ...prev, [postId]: '' }));
      }
    } catch {}
    setSavingComment(prev => ({ ...prev, [postId]: false }));
  };

  const handleShare = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    shareToFacebook(post.content);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p
    ));
  };

  const handleEdit = (postId, content) => {
    setEditingPostId(postId);
    setEditContent(content);
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, content: editContent.trim() } : p
    ));
    setEditingPostId(null);
    setEditContent('');
    try {
      await fetch(`${API_BASE}/community/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({ content: editContent.trim() }),
      });
    } catch {}
  };

  const handleDelete = (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    fetch(`${API_BASE}/community/${postId}`, {
      method: 'DELETE',
      headers: apiHeaders(),
    }).catch(() => {});
  };

  const handleReport = (postId) => {
    setReportPostId(postId);
    setReportReason('');
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason || !reportPostId) return;
    setShowReportModal(false);
    setReportedPostIds(prev => [...prev, reportPostId]);
    try {
      await fetch(`${API_BASE}/community/${reportPostId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({ reason: reportReason }),
      });
    } catch {}
  };

  const handleJoinGroup = async (groupId) => {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? {
        ...g,
        member_count: g.is_member ? g.member_count - 1 : g.member_count + 1,
        is_member: !g.is_member,
      } : g
    ));
    try {
      await fetch(`${API_BASE}/community/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
      });
    } catch {}
  };

  const handleCreateGroup = async () => {
    if (!createGroupName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/community/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiHeaders() },
        body: JSON.stringify({ name: createGroupName.trim(), description: createGroupDesc.trim() }),
      });
      if (res.ok) {
        const newGroup = await res.json();
        setGroups(prev => [newGroup, ...prev]);
        setCreateGroupName('');
        setCreateGroupDesc('');
        setShowCreateGroup(false);
      }
    } catch {}
  };

  return (
    <div className="page-enter">
      <div className="page-title">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon.Classroom size={24} /> Community
        </h1>
        <p>Connect with fellow educators</p>
      </div>

      {user && (
        <Card style={{ maxWidth: 800, marginBottom: 16, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--red)', color: '#fff',
              display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: 12, flexShrink: 0,
            }}>
              {user.full_name ? getInitials(user.full_name) : 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="Share something with the community..."
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 13, minHeight: 60, fontFamily: 'inherit', padding: 0 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <Button variant="primary" size="sm" onClick={handleCreatePost} isDisabled={!newPostContent.trim() || posting}>
                  {posting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: 'var(--muted)' }}>Loading community...</div>
      )}

      <div className="community-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={{ ...post, user_has_reported: reportedPostIds.includes(post.id) }}
              onLike={handleLike}
              onToggleComments={handleToggleComments}
              onAddComment={handleAddComment}
              onShare={handleShare}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReport={handleReport}
              currentUserId={user?.id}
              openMenu={openMenuPostId}
              onToggleMenu={(id) => setOpenMenuPostId(prev => prev === id ? null : id)}
              editing={editingPostId === post.id}
              editContent={editingPostId === post.id ? editContent : ''}
              onEditContentChange={setEditContent}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              expanded={expandedComments[post.id]}
              comments={postComments[post.id] || []}
              savingComment={savingComment[post.id]}
              newComment={newComments[post.id] || ''}
              onCommentChange={(id, val) => setNewComments(prev => ({ ...prev, [id]: val }))}
            />
          ))}
        </div>

        <div>
          <Card style={{ marginBottom: 16, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon.Book size={16} /> Groups
            </h3>
            {user && !showCreateGroup && (
              <Button variant="ghost" size="sm" onClick={() => setShowCreateGroup(true)} style={{ marginBottom: 12, width: '100%', justifyContent: 'center' }}>
                + Create Group
              </Button>
            )}
            {showCreateGroup && (
              <div style={{ marginBottom: 12, padding: 10, background: 'var(--bg)', borderRadius: 8 }}>
                <input
                  value={createGroupName}
                  onChange={e => setCreateGroupName(e.target.value)}
                  placeholder="Group name"
                  style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 6 }}
                />
                <input
                  value={createGroupDesc}
                  onChange={e => setCreateGroupDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: '6px 10px', fontSize: 12, marginBottom: 6 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button variant="primary" size="sm" onClick={handleCreateGroup} isDisabled={!createGroupName.trim()}>Create</Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowCreateGroup(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {groups.map((g, i) => (
              <div key={g.id} style={{
                padding: '10px 0',
                borderBottom: i < groups.length - 1 ? '1px solid var(--line)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{g.member_count?.toLocaleString()} members</div>
                  </div>
                  <button onClick={() => handleJoinGroup(g.id)}
                    style={{
                      flexShrink: 0, fontSize: 12, padding: '4px 12px', borderRadius: 16, border: '1px solid',
                      borderColor: g.is_member ? 'var(--red)' : 'var(--line)',
                      background: g.is_member ? 'var(--red)' : 'transparent',
                      color: g.is_member ? '#fff' : 'var(--muted)',
                      cursor: 'pointer', fontWeight: 600,
                    }}>
                    {g.is_member ? 'Joined' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
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

      {showReportModal && (
        <div onClick={() => setShowReportModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'grid', placeItems: 'center', zIndex: 1000,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 12, padding: 24, width: 340,
            boxShadow: '0 8px 30px rgba(0,0,0,.15)',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Report Post</h3>
            {['Spam', 'Inappropriate', 'Offensive', 'Other'].map(r => (
              <label key={r} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--line)',
              }}>
                <input
                  type="radio" name="reason" value={r}
                  checked={reportReason === r}
                  onChange={e => setReportReason(e.target.value)}
                />
                {r}
              </label>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <Button variant="ghost" size="sm" onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleSubmitReport} isDisabled={!reportReason}>
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
