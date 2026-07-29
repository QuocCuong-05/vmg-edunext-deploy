import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../lib/icons';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { TOPICS } from '../../mock/community';

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

function PostCard({ post, onLike, onToggleComments, onAddComment, expanded, comments, savingComment, newComment, onCommentChange, onShare, onEdit, onDelete, onReport, currentUserId, openMenu, onToggleMenu, editing, editContent, onEditContentChange, onSaveEdit, onCancelEdit, onEditComment, onDeleteComment, onReportComment, onSaveEditComment, onCancelEditComment, editingCommentId, editCommentContent, onEditCommentContentChange, openCommentMenu, onToggleCommentMenu, reportedCommentIds }) {
  const isOwner = currentUserId && post.user_id === currentUserId;
  const canReport = currentUserId && !isOwner && !post.user_has_reported;

  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: COLORS[parseInt(post.id?.slice(-1) || '0') % COLORS.length],
            color: '#fff', display: 'grid', placeItems: 'center',
            fontWeight: 800, fontSize: 13, flexShrink: 0, cursor: 'pointer',
          }}>
            {post.author_avatar || getInitials(post.author_name)}
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}>{post.author_name}</div>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{timeAgo(post.created_at)}</span>
            <span style={{ fontSize: 10, background: 'var(--bg)', padding: '2px 8px', borderRadius: 10, color: 'var(--muted)', fontWeight: 600 }}>{post.topic}</span>
          </div>
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
          {comments.map(c => {
            const cIsOwner = currentUserId && c.user_id === currentUserId;
            const cCanReport = currentUserId && !cIsOwner && !reportedCommentIds.includes(c.id);
            const cMenuId = post.id + '_' + c.id;
            const isEditing = editingCommentId === c.id;
            return (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{c.author_name}</div>
                  {(cIsOwner || cCanReport) && (
                    <div style={{ position: 'relative' }}>
                      <span onClick={e => { e.stopPropagation(); onToggleCommentMenu(cMenuId); }} style={{ cursor: 'pointer', padding: 2, display: 'flex', borderRadius: 3, background: openCommentMenu === cMenuId ? 'var(--bg)' : 'transparent' }}>
                        <Icon.Dots size={12} />
                      </span>
                      {openCommentMenu === cMenuId && (
                        <div style={{
                          position: 'absolute', left: 0, top: '100%', zIndex: 10,
                          background: '#fff', border: '1px solid var(--line)', borderRadius: 6,
                          boxShadow: '0 4px 12px rgba(0,0,0,.1)', minWidth: 120, padding: 4,
                        }}>
                          {cIsOwner && (
                            <>
                              <div onClick={e => { e.stopPropagation(); onEditComment(post.id, c.id, c.content); onToggleCommentMenu(null); }} style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4 }} onMouseEnter={e => e.target.style.background = 'var(--bg)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                                <Icon.Pen size={12} /> Edit
                              </div>
                              <div onClick={e => { e.stopPropagation(); onDeleteComment(post.id, c.id); onToggleCommentMenu(null); }} style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4, color: 'var(--red)' }} onMouseEnter={e => e.target.style.background = 'var(--bg)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                                <Icon.Trash size={12} /> Delete
                              </div>
                            </>
                          )}
                          {cCanReport && (
                            <div onClick={e => { e.stopPropagation(); onReportComment(c.id); onToggleCommentMenu(null); }} style={{ padding: '6px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, borderRadius: 4 }} onMouseEnter={e => e.target.style.background = 'var(--bg)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                              <Icon.Flag size={12} /> Report
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <div style={{ marginTop: 4 }}>
                    <textarea
                      value={editCommentContent}
                      onChange={e => onEditCommentContentChange(e.target.value)}
                      style={{ width: '100%', border: '1px solid var(--line)', borderRadius: 6, padding: 6, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', minHeight: 40 }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button onClick={() => onSaveEditComment(post.id, c.id)} disabled={!editCommentContent.trim()} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 12, padding: '4px 10px', fontSize: 11, cursor: 'pointer', opacity: editCommentContent.trim() ? 1 : .4 }}>Save</button>
                      <button onClick={() => onCancelEditComment()} style={{ border: '1px solid var(--line)', borderRadius: 12, padding: '4px 10px', fontSize: 11, cursor: 'pointer', background: 'transparent' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--muted)' }}>{c.content}</p>
                )}
              </div>
            </div>
          );
          })}
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
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [activeTopic, setActiveTopic] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTopic, setNewPostTopic] = useState('General');
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newComments, setNewComments] = useState({});
  const [savingComment, setSavingComment] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPostId, setReportPostId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportedPostIds, setReportedPostIds] = useState([]);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [openCommentMenuId, setOpenCommentMenuId] = useState(null);
  const [reportedCommentIds, setReportedCommentIds] = useState([]);

  useEffect(() => {
    api.community.posts.list(user?.id, activeTopic || undefined).then(data => {
      if (data?.length) setPosts(data);
      else setPosts([]);
    }).catch(() => setPosts([]));
    api.community.reported.posts(user?.id).then(data => {
      if (data?.length) setReportedPostIds(data.map(r => r.post_id));
    }).catch(() => {});
    api.community.reported.comments(user?.id).then(data => {
      if (data?.length) setReportedCommentIds(data.map(r => r.comment_id));
    }).catch(() => {});
  }, [user?.id, activeTopic]);

  useEffect(() => {
    const handler = () => { setOpenMenuPostId(null); setOpenCommentMenuId(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || posting || !user?.id) return;
    setPosting(true);
    const text = newPostContent.trim();
    const topic = newPostTopic;
    setNewPostContent('');
    try {
      const newPost = await api.community.posts.create(user.id, text, topic);
      setPosts(prev => [newPost, ...prev]);
    } catch {}
    setPosting(false);
  };

  const handleLike = async (postId) => {
    if (!user?.id) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? {
        ...p,
        likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1,
        user_has_liked: !p.user_has_liked,
      } : p
    ));
    try { await api.community.posts.likeToggle(postId, user.id); } catch {}
  };

  const handleToggleComments = (postId) => {
    const currentlyExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !currentlyExpanded }));
    if (!currentlyExpanded && !postComments[postId]) {
      api.community.comments.list(postId).then(data => {
        if (data?.length) {
          setPostComments(prev => {
            const existing = prev[postId] || [];
            if (existing.length) {
              const fetchedIds = new Set(data.map(c => c.id));
              const extras = existing.filter(c => !fetchedIds.has(c.id));
              return extras.length ? { ...prev, [postId]: [...extras, ...data] } : prev;
            }
            return { ...prev, [postId]: data };
          });
        }
      }).catch(() => {});
    }
  };

  const handleAddComment = async (postId) => {
    const text = newComments[postId]?.trim();
    if (!text || !user?.id) return;
    setSavingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const newComment = await api.community.comments.create(postId, user.id, text);
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), newComment],
      }));
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
      ));
      setNewComments(prev => ({ ...prev, [postId]: '' }));
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
    if (!editContent.trim() || !user?.id) return;
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, content: editContent.trim() } : p
    ));
    setEditingPostId(null);
    setEditContent('');
    try { await api.community.posts.update(postId, user.id, editContent.trim()); } catch {}
  };

  const handleDelete = (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?') || !user?.id) return;
    setPosts(prev => prev.filter(p => p.id !== postId));
    api.community.posts.delete(postId, user.id).catch(() => {});
  };

  const handleReport = (postId) => {
    setReportPostId(postId);
    setReportReason('');
    setShowReportModal(true);
  };

  const handleSubmitReport = async () => {
    if (!reportReason || !reportPostId || !user?.id) return;
    setShowReportModal(false);
    setReportedPostIds(prev => [...prev, reportPostId]);
    try { await api.community.posts.report(reportPostId, user.id, reportReason); } catch {}
  };

  const handleEditComment = (commentId, content) => {
    setEditingCommentId(commentId);
    setEditCommentContent(content);
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditCommentContent('');
  };

  const handleSaveEditComment = (postId, commentId) => {
    if (!editCommentContent.trim() || !user?.id) return;
    setPostComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(c =>
        c.id === commentId ? { ...c, content: editCommentContent.trim() } : c
      ),
    }));
    setEditingCommentId(null);
    setEditCommentContent('');
    api.community.comments.update(commentId, user.id, editCommentContent.trim()).catch(() => {});
  };

  const handleDeleteComment = (postId, commentId) => {
    if (!window.confirm('Delete this comment?') || !user?.id) return;
    setPostComments(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId),
    }));
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments_count: Math.max(0, p.comments_count - 1) } : p
    ));
    api.community.comments.delete(commentId, user.id).catch(() => {});
  };

  const handleReportComment = (commentId) => {
    setReportPostId('comment_' + commentId);
    setReportReason('');
    setShowReportModal(true);
  };

  const handleSubmitCommentReport = async () => {
    if (!reportReason || !reportPostId || !user?.id) return;
    setShowReportModal(false);
    const commentId = reportPostId.replace('comment_', '');
    setReportedCommentIds(prev => [...prev, commentId]);
    try { await api.community.comments.report(commentId, user.id, reportReason); } catch {}
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
            <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'var(--red)', color: '#fff',
                display: 'grid', placeItems: 'center',
                fontWeight: 800, fontSize: 12, flexShrink: 0,
              }}>
                {user.full_name ? getInitials(user.full_name) : 'U'}
              </div>
            </Link>
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                placeholder="Share something with the community..."
                style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 13, minHeight: 60, fontFamily: 'inherit', padding: 0 }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <select
                  value={newPostTopic}
                  onChange={e => setNewPostTopic(e.target.value)}
                  style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--line)', background: '#fff', cursor: 'pointer' }}
                >
                  {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{ flex: 1 }} />
                <Button variant="primary" size="sm" onClick={handleCreatePost} isDisabled={!newPostContent.trim() || posting}>
                  {posting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <span
          onClick={() => setActiveTopic('')}
          style={{
            padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: !activeTopic ? 'var(--red)' : 'var(--bg)',
            color: !activeTopic ? '#fff' : 'var(--muted)',
            border: '1px solid', borderColor: !activeTopic ? 'var(--red)' : 'var(--line)',
            transition: 'all .15s',
          }}
        >All</span>
        {TOPICS.map(t => (
          <span
            key={t}
            onClick={() => setActiveTopic(t)}
            style={{
              padding: '6px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: activeTopic === t ? 'var(--red)' : 'var(--bg)',
              color: activeTopic === t ? '#fff' : 'var(--muted)',
              border: '1px solid', borderColor: activeTopic === t ? 'var(--red)' : 'var(--line)',
              transition: 'all .15s',
            }}
          >{t}</span>
        ))}
      </div>

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
              onEditComment={handleEditComment}
              onDeleteComment={handleDeleteComment}
              onReportComment={handleReportComment}
              onSaveEditComment={handleSaveEditComment}
              onCancelEditComment={handleCancelEditComment}
              editingCommentId={editingCommentId}
              editCommentContent={editCommentContent}
              onEditCommentContentChange={setEditCommentContent}
              openCommentMenu={openCommentMenuId}
              onToggleCommentMenu={setOpenCommentMenuId}
              reportedCommentIds={reportedCommentIds}
            />
          ))}
        </div>

        <div>
          {user && (
            <Card style={{ marginBottom: 16, padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.User size={16} /> Your Network
              </h3>
              <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
                Click on any user's name or avatar to view their profile, follow them, and remind them to keep their learning streak!
              </p>
              <Link to={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
                <Button variant="ghost" size="sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}>
                  View My Profile
                </Button>
              </Link>
            </Card>
          )}

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
              <Button variant="primary" size="sm" onClick={() => reportPostId?.startsWith('comment_') ? handleSubmitCommentReport() : handleSubmitReport()} isDisabled={!reportReason}>
                Submit Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
