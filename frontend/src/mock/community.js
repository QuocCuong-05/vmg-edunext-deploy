import { MOCK_USERS } from './data';

const TOPICS = ['CLIL', 'Classroom English', 'Assessment', 'Learning Science', 'Translanguaging', 'General'];

const SEED_POSTS = [
  {
    id: 'post-seed-1', user_id: 'user-002', topic: 'CLIL', content: 'Vừa áp dụng CLIL 4Cs cho bài Khoa học lớp 6. Học sinh làm tốt phần Content nhưng còn lúng túng ở Communication. Có ai dùng scaffolding nào hiệu quả không?', created_at: '2026-07-28T09:15:00.000Z',
  },
  {
    id: 'post-seed-2', user_id: 'user-003', topic: 'Classroom English', content: 'Có ai dùng wait time 5 giây chưa? Mình thấy học sinh trả lời dài hơn và tự tin hơn hẳn.', created_at: '2026-07-28T10:30:00.000Z',
  },
  {
    id: 'post-seed-3', user_id: 'user-004', topic: 'Assessment', content: 'Exit ticket hôm nay: "Write one thing you understood better." Kết quả bất ngờ — có em viết "I understood that English is not scary." Đó cũng là learning objective mình không ngờ tới.', created_at: '2026-07-27T14:20:00.000Z',
  },
  {
    id: 'post-seed-4', user_id: 'user-006', topic: 'General', content: 'Cả lớp đã hoàn thành dự án "My Dream Classroom" bằng tiếng Anh. Tuần sau triển lãm — ai có kinh nghiệm tổ chức classroom exhibition không ạ?', created_at: '2026-07-27T08:00:00.000Z',
  },
  {
    id: 'post-seed-5', user_id: 'user-002', topic: 'Learning Science', content: 'Vừa đọc một paper về retrieval practice. Kết luận: 5 phút "brain dump" đầu giờ hiệu quả hơn 20 phút ôn tập thụ động.', created_at: '2026-07-26T16:45:00.000Z',
  },
  {
    id: 'post-seed-6', user_id: 'user-009', topic: 'Translanguaging', content: 'Cho phép học sinh dùng tiếng Việt để brainstorm 2 phút rồi mới viết tiếng Anh — chất lượng bài viết cải thiện rõ rệt.', created_at: '2026-07-26T11:10:00.000Z',
  },
];

const SEED_COMMENTS = [
  { id: 'cmt-seed-1', post_id: 'post-seed-1', user_id: 'user-003', content: 'Mình dùng sentence frames — "The __ is __ because __" — học sinh nói được dài hơn ngay.', created_at: '2026-07-28T10:00:00.000Z' },
  { id: 'cmt-seed-2', post_id: 'post-seed-1', user_id: 'user-004', content: 'Cho mình hỏi lớp mấy? Lớp 6 mình cũng đang thử nhưng chưa hiệu quả lắm.', created_at: '2026-07-28T11:20:00.000Z' },
  { id: 'cmt-seed-3', post_id: 'post-seed-2', user_id: 'user-002', content: 'Mình tăng từ 3s lên 5s, thấy học sinh yếu hơn cũng có thời gian nghĩ. Recommend!', created_at: '2026-07-28T12:00:00.000Z' },
  { id: 'cmt-seed-4', post_id: 'post-seed-5', user_id: 'user-004', content: 'Mình cũng áp dụng brain dump — học sinh viết được 3-5 ý trong 3 phút. Hiệu quả thật.', created_at: '2026-07-27T09:30:00.000Z' },
];

const SEED_LIKES = [
  { post_id: 'post-seed-1', user_id: 'user-003' },
  { post_id: 'post-seed-1', user_id: 'user-004' },
  { post_id: 'post-seed-1', user_id: 'user-006' },
  { post_id: 'post-seed-2', user_id: 'user-002' },
  { post_id: 'post-seed-2', user_id: 'user-004' },
  { post_id: 'post-seed-3', user_id: 'user-002' },
  { post_id: 'post-seed-3', user_id: 'user-003' },
  { post_id: 'post-seed-3', user_id: 'user-006' },
  { post_id: 'post-seed-3', user_id: 'user-007' },
  { post_id: 'post-seed-5', user_id: 'user-003' },
  { post_id: 'post-seed-6', user_id: 'user-002' },
  { post_id: 'post-seed-6', user_id: 'user-004' },
];

function readLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function writeLS(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getPostsData() {
  return readLS('vmg_community_posts', SEED_POSTS);
}

function setPostsData(posts) {
  writeLS('vmg_community_posts', posts);
}

function getCommentsData() {
  return readLS('vmg_community_comments', SEED_COMMENTS);
}

function setCommentsData(comments) {
  writeLS('vmg_community_comments', comments);
}

function getLikesData() {
  return readLS('vmg_community_likes', SEED_LIKES);
}

function setLikesData(likes) {
  writeLS('vmg_community_likes', likes);
}

function getReportsData() {
  return readLS('vmg_community_reports', []);
}

function setReportsData(reports) {
  writeLS('vmg_community_reports', reports);
}

function getCommentReportsData() {
  return readLS('vmg_community_comment_reports', []);
}

function setCommentReportsData(reports) {
  writeLS('vmg_community_comment_reports', reports);
}

function getFollowsData() {
  return readLS('vmg_user_follows', []);
}

function setFollowsData(follows) {
  writeLS('vmg_user_follows', follows);
}

function getNotificationsData() {
  return readLS('vmg_notifications', []);
}

function setNotificationsData(notifs) {
  writeLS('vmg_notifications', notifs);
}

function findUser(userId) {
  return MOCK_USERS.find(u => u.id === userId);
}

function getInitials(name) {
  return (name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export function getMockPosts(userId, topic) {
  let posts = getPostsData();
  if (topic) posts = posts.filter(p => p.topic === topic);
  posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const likes = getLikesData();
  const comments = getCommentsData();
  const reports = getReportsData();

  const likeCountMap = {};
  likes.forEach(l => { likeCountMap[l.post_id] = (likeCountMap[l.post_id] || 0) + 1; });

  const commentCountMap = {};
  comments.forEach(c => { commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1; });

  const userLikedSet = userId ? new Set(likes.filter(l => l.user_id === userId).map(l => l.post_id)) : new Set();
  const userReportedSet = userId ? new Set(reports.filter(r => r.user_id === userId).map(r => r.post_id)) : new Set();

  return posts.map(p => {
    const user = findUser(p.user_id);
    return {
      id: p.id, user_id: p.user_id, created_at: p.created_at, content: p.content, topic: p.topic || 'General',
      author_name: user?.full_name || 'Unknown',
      author_avatar: getInitials(user?.full_name),
      likes_count: likeCountMap[p.id] || 0,
      comments_count: commentCountMap[p.id] || 0, shares_count: 0,
      user_has_liked: userLikedSet.has(p.id),
      user_has_reported: userReportedSet.has(p.id),
    };
  });
}

export function createMockPost(userId, content, topic) {
  const posts = getPostsData();
  const now = new Date().toISOString();
  const newPost = {
    id: 'post-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    user_id: userId, topic: topic || 'General', content, created_at: now,
  };
  posts.push(newPost);
  setPostsData(posts);
  const user = findUser(userId);
  return {
    id: newPost.id, user_id: newPost.user_id, created_at: newPost.created_at,
    content: newPost.content, topic: newPost.topic,
    author_name: user?.full_name || 'Unknown',
    author_avatar: getInitials(user?.full_name),
    likes_count: 0, comments_count: 0, shares_count: 0,
    user_has_liked: false, user_has_reported: false,
  };
}

export function updateMockPost(postId, userId, content) {
  const posts = getPostsData();
  const idx = posts.findIndex(p => p.id === postId && p.user_id === userId);
  if (idx === -1) throw new Error('Not found or not owner');
  posts[idx].content = content;
  setPostsData(posts);
  return { ...posts[idx], content };
}

export function deleteMockPost(postId, userId) {
  let posts = getPostsData();
  const idx = posts.findIndex(p => p.id === postId && p.user_id === userId);
  if (idx === -1) throw new Error('Not found or not owner');
  posts.splice(idx, 1);
  setPostsData(posts);
  let likes = getLikesData();
  likes = likes.filter(l => l.post_id !== postId);
  setLikesData(likes);
  let comments = getCommentsData();
  comments = comments.filter(c => c.post_id !== postId);
  setCommentsData(comments);
}

export function toggleMockLike(postId, userId) {
  const likes = getLikesData();
  const existing = likes.find(l => l.post_id === postId && l.user_id === userId);
  if (existing) {
    setLikesData(likes.filter(l => !(l.post_id === postId && l.user_id === userId)));
    return { liked: false };
  }
  likes.push({ post_id: postId, user_id: userId });
  setLikesData(likes);
  return { liked: true };
}

export function reportMockPost(postId, userId, reason) {
  const reports = getReportsData();
  if (!reports.find(r => r.post_id === postId && r.user_id === userId)) {
    reports.push({ post_id: postId, user_id: userId, reason });
    setReportsData(reports);
  }
  return { reported: true };
}

export function getMockComments(postId) {
  const comments = getCommentsData().filter(c => c.post_id === postId);
  return comments.map(c => {
    const user = findUser(c.user_id);
    return {
      id: c.id, post_id: c.post_id, user_id: c.user_id, content: c.content, created_at: c.created_at,
      author_name: user?.full_name || 'Unknown',
      author_avatar: getInitials(user?.full_name),
    };
  });
}

export function createMockComment(postId, userId, content) {
  const comments = getCommentsData();
  const newComment = {
    id: 'cmt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    post_id: postId, user_id: userId, content, created_at: new Date().toISOString(),
  };
  comments.push(newComment);
  setCommentsData(comments);
  const user = findUser(userId);
  return {
    id: newComment.id, post_id: newComment.post_id, user_id: newComment.user_id,
    content: newComment.content, created_at: newComment.created_at,
    author_name: user?.full_name || 'Unknown',
    author_avatar: getInitials(user?.full_name),
  };
}

export function updateMockComment(commentId, userId, content) {
  const comments = getCommentsData();
  const idx = comments.findIndex(c => c.id === commentId && c.user_id === userId);
  if (idx === -1) throw new Error('Not found or not owner');
  comments[idx].content = content;
  setCommentsData(comments);
  return { ...comments[idx], content };
}

export function deleteMockComment(commentId, userId) {
  let comments = getCommentsData();
  const idx = comments.findIndex(c => c.id === commentId && c.user_id === userId);
  if (idx === -1) throw new Error('Not found or not owner');
  comments.splice(idx, 1);
  setCommentsData(comments);
}

export function reportMockComment(commentId, userId, reason) {
  const reports = getCommentReportsData();
  if (!reports.find(r => r.comment_id === commentId && r.user_id === userId)) {
    reports.push({ comment_id: commentId, user_id: userId, reason });
    setCommentReportsData(reports);
  }
  return { reported: true };
}

export function getMockReportedPosts(userId) {
  return getReportsData().filter(r => r.user_id === userId).map(r => r.post_id);
}

export function getMockReportedComments(userId) {
  return getCommentReportsData().filter(r => r.user_id === userId).map(r => r.comment_id);
}

function mockStreakForUser(userId) {
  const streaks = { 'user-001': 7, 'user-002': 12, 'user-003': 5, 'user-004': 3, 'user-005': 1, 'user-006': 8, 'user-007': 2, 'user-008': 4, 'user-009': 15, 'user-010': 6 };
  return streaks[userId] || 0;
}

function mockLastLogin(userId) {
  const now = Date.now();
  const offsets = {
    'user-001': 0, 'user-002': 0, 'user-003': 0, 'user-004': 0, 'user-005': 86400000 * 2,
    'user-006': 0, 'user-007': 86400000, 'user-008': 0, 'user-009': 0, 'user-010': 86400000 * 3,
  };
  return new Date(now - (offsets[userId] || 0)).toISOString();
}

export function getMockProfile(userId) {
  const user = findUser(userId);
  if (!user) throw new Error('User not found');
  const following = getFollowsData().filter(f => f.follower_id === userId).length;
  const followers = getFollowsData().filter(f => f.following_id === userId).length;
  return {
    id: user.id,
    full_name: user.full_name,
    xp: user.xp,
    school: user.school || '',
    ward: user.ward || '',
    streak_days: mockStreakForUser(userId),
    last_login: mockLastLogin(userId),
    followers_count: followers,
    following_count: following,
  };
}

export function followMockUser(followerId, followingId) {
  if (followerId === followingId) throw new Error('Cannot follow yourself');
  const follows = getFollowsData();
  if (!follows.find(f => f.follower_id === followerId && f.following_id === followingId)) {
    follows.push({ follower_id: followerId, following_id: followingId, created_at: new Date().toISOString() });
    setFollowsData(follows);
  }
}

export function unfollowMockUser(followerId, followingId) {
  let follows = getFollowsData();
  follows = follows.filter(f => !(f.follower_id === followerId && f.following_id === followingId));
  setFollowsData(follows);
}

export function isMockFollowing(followerId, followingId) {
  if (!followerId) return false;
  return getFollowsData().some(f => f.follower_id === followerId && f.following_id === followingId);
}

export function getMockFollowing(userId) {
  const follows = getFollowsData().filter(f => f.follower_id === userId);
  return follows.map(f => {
    const user = findUser(f.following_id);
    return user ? {
      id: user.id, full_name: user.full_name, xp: user.xp, school: user.school,
      streak_days: mockStreakForUser(user.id),
      last_login: mockLastLogin(user.id),
    } : null;
  }).filter(Boolean);
}

export function getMockFollowers(userId) {
  const follows = getFollowsData().filter(f => f.following_id === userId);
  return follows.map(f => {
    const user = findUser(f.follower_id);
    return user ? {
      id: user.id, full_name: user.full_name, xp: user.xp, school: user.school,
      streak_days: mockStreakForUser(user.id),
      last_login: mockLastLogin(user.id),
    } : null;
  }).filter(Boolean);
}

export function sendMockRemind(reminderId, targetId) {
  const notifs = getNotificationsData();
  const reminder = findUser(reminderId);
  const target = findUser(targetId);
  notifs.push({
    id: 'notif-' + Date.now(),
    user_id: targetId,
    from_user_id: reminderId,
    type: 'remind',
    message: `${reminder?.full_name || 'Someone'} đã nhắc bạn học hôm nay. Hãy giữ chuỗi của bạn!`,
    created_at: new Date().toISOString(),
    read: false,
  });
  setNotificationsData(notifs);
  return { sent: true };
}

export function getMockNotifications(userId) {
  return getNotificationsData()
    .filter(n => n.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function markMockNotificationsRead(userId) {
  let notifs = getNotificationsData();
  notifs.forEach(n => { if (n.user_id === userId) n.read = true; });
  setNotificationsData(notifs);
}

export { TOPICS };
