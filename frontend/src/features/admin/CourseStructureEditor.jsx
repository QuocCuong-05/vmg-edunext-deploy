import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { useToast } from '../../components/ui/Toast';

const TYPES = [
  { value: 'video_lesson', label: '🎬 Video bài giảng' },
  { value: 'lesson', label: '📄 Bài đọc (text)' },
  { value: 'practice', label: '🎤 Luyện nói (practice)' },
  { value: 'quiz', label: '📝 Kiểm tra (quiz)' },
];

const EMPTY_ITEM = {
  title: '', item_type: 'video_lesson', module_id: '', video_url: '',
  body_html: '', points: 0, audio_url: '', image_url: '', quiz_slug: '', is_free: false, sort_order: 0,
  practice_type: 'speak_words',
};

const PRACTICE_TYPES = [
  { value: 'speak_words', label: '🎤 Đọc từ (mic)' },
  { value: 'voice_recorder', label: '🎙️ Ghi âm tự do' },
  { value: 'listen_choose', label: '👂 Nghe → chọn đáp án' },
  { value: 'listen_fill', label: '📝 Nghe → điền từ' },
  { value: 'listen_mark', label: '✏️ Nghe → đánh dấu từ' },
];

export default function CourseStructureEditor() {
  const showToast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [items, setItems] = useState([]);
  const [modTitle, setModTitle] = useState('');
  const [editingModule, setEditingModule] = useState(null);
  const [itemForm, setItemForm] = useState(null); // {id?, module_id, ...}
  const [words, setWords] = useState({});
  const [wordForm, setWordForm] = useState({}); // lessonId -> {word, audio_url, image_url}
  const [questions, setQuestions] = useState({});
  const [questionForm, setQuestionForm] = useState({});
  const [openMods, setOpenMods] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    api.courses.list().then(d => setCourses(d || [])).catch(() => {});
    api.admin.users({ role: 'teacher' }).then(d => setUsers(d || [])).catch(() => {});
  }, []);

  const loadStructure = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const [m, i] = await Promise.all([api.admin.modules(cid), api.admin.items(cid)]);
      setModules(m || []);
      setItems(i || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (courseId) loadStructure(courseId);
  }, [courseId, loadStructure]);

  const loadWords = async (lessonId) => {
    try {
      const d = await api.admin.practiceWords(lessonId);
      setWords(prev => ({ ...prev, [lessonId]: d || [] }));
    } catch {}
  };

  const reloadWords = async (lessonId) => {
    await loadWords(lessonId);
  };

  // --- Modules ---
  const addModule = async () => {
    if (!modTitle.trim()) return;
    try {
      await api.admin.createModule({ course_id: courseId, title: modTitle.trim(), position: modules.length + 1 });
      setModTitle('');
      await loadStructure(courseId);
      showToast('Đã thêm module', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const saveModule = async (id) => {
    try {
      await api.admin.updateModule(id, { title: editingModule.title });
      setEditingModule(null);
      await loadStructure(courseId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteModule = async (id) => {
    try {
      await api.admin.deleteModule(id);
      await loadStructure(courseId);
      setConfirmDel(null);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // --- Items ---
  const openItemForm = (moduleId, item) => {
    if (item) {
      setItemForm({
        id: item.id, module_id: item.module_id || moduleId || '', title: item.title,
        item_type: item.item_type || 'video_lesson', video_url: item.video_url || '',
        body_html: item.body_html || '', points: item.points || 0, audio_url: item.audio_url || '',
        image_url: item.image_url || '', quiz_slug: item.quiz_slug || '',
        is_free: !!item.is_free, sort_order: item.sort_order || 0,
        practice_type: item.practice_type || 'speak_words',
      });
    } else {
      setItemForm({ ...EMPTY_ITEM, module_id: moduleId || '', sort_order: items.length + 1 });
    }
    setTimeout(() => document.getElementById('item-form-box')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  const saveItem = async () => {
    const f = itemForm;
    if (!f.title.trim()) { showToast('Cần nhập tiêu đề', 'error'); return; }
    const payload = { ...f, module_id: f.module_id || null };
    try {
      if (f.id) await api.admin.updateItem(f.id, payload);
      else await api.admin.createItem({ ...payload, course_id: courseId });
      setItemForm(null);
      await loadStructure(courseId);
      showToast('Đã lưu item', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteItem = async (id) => {
    try {
      await api.admin.deleteItem(id);
      await loadStructure(courseId);
      setConfirmDel(null);
    } catch (e) { showToast(e.message, 'error'); }
  };

  // --- Words ---
  const addWord = async (lessonId) => {
    const f = wordForm[lessonId];
    if (!f || !f.word.trim()) return;
    try {
      await api.admin.createWord({ lesson_id: lessonId, word: f.word.trim(), audio_url: f.audio_url || null, image_url: f.image_url || null, position: (words[lessonId] || []).length + 1 });
      setWordForm({ ...wordForm, [lessonId]: { word: '', audio_url: '', image_url: '' } });
      await reloadWords(lessonId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteWord = async (id, lessonId) => {
    try {
      await api.admin.deleteWord(id);
      await reloadWords(lessonId);
      setConfirmDel(null);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const uploadAudio = async (file, lessonId) => {
    setUploading(lessonId);
    try {
      const res = await api.admin.uploadAudio(file);
      const url = res?.url;
      setWordForm({ ...wordForm, [lessonId]: { ...(wordForm[lessonId] || {}), audio_url: url } });
      showToast('Đã upload audio', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally {
      setUploading(null);
    }
  };

  const uploadImage = async (file) => {
    setUploading('img');
    try {
      const res = await api.cms.upload(file);
      setItemForm(prev => ({ ...prev, image_url: res?.url || '' }));
      showToast('Đã upload ảnh', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally {
      setUploading(null);
    }
  };

  const uploadWordImage = async (file, lessonId) => {
    setUploading(lessonId + ':img');
    try {
      const res = await api.cms.upload(file);
      const url = res?.url;
      setWordForm({ ...wordForm, [lessonId]: { ...(wordForm[lessonId] || {}), image_url: url } });
      showToast('Đã upload ảnh', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally {
      setUploading(null);
    }
  };

  // --- Câu hỏi nghe (choose/fill/mark) ---
  const loadQuestions = async (lessonId) => {
    try {
      const d = await api.admin.practiceQuestions(lessonId);
      setQuestions(prev => ({ ...prev, [lessonId]: d || [] }));
    } catch {}
  };

  const qtypeOf = (pt) => pt === 'listen_fill' ? 'fill' : pt === 'listen_mark' ? 'mark' : 'choose';

  const saveQuestion = async (lessonId, pt) => {
    const f = questionForm[lessonId] || {};
    if (pt === 'listen_fill' || pt === 'listen_mark') {
      if (!f.text_content || !f.text_content.trim()) { showToast('Cần nhập đoạn text', 'error'); return; }
    }
    let options = null;
    let correct = null;
    if (pt === 'listen_choose') {
      options = (f.optionsText || '').split('\n').map(s => s.trim()).filter(Boolean);
      const idx = Number(f.correctIdx);
      if (!options.length) { showToast('Nhập các đáp án (mỗi dòng 1 đáp án)', 'error'); return; }
      if (idx < 0 || idx >= options.length) { showToast('Chọn đáp án đúng', 'error'); return; }
      correct = [idx];
    } else {
      correct = (f.correctText || '').split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (!correct.length) { showToast('Nhập đáp án (fill) / từ đúng (mark)', 'error'); return; }
    }
    try {
      await api.admin.createQuestion({
        lesson_id: lessonId,
        qtype: qtypeOf(pt),
        position: (questions[lessonId] || []).length + 1,
        audio_url: f.audio_url || null,
        prompt: f.prompt || null,
        text_content: pt === 'listen_choose' ? null : (f.text_content || null),
        options,
        correct,
      });
      setQuestionForm({ ...questionForm, [lessonId]: { prompt: '', audio_url: '', optionsText: '', correctText: '', correctIdx: '', text_content: '' } });
      await loadQuestions(lessonId);
      showToast('Đã thêm câu hỏi', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteQuestion = async (id, lessonId) => {
    try {
      await api.admin.deleteQuestion(id);
      await loadQuestions(lessonId);
      setConfirmDel(null);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const uploadQuestionAudio = async (file, lessonId) => {
    setUploading(lessonId + ':qa');
    try {
      const res = await api.admin.uploadAudio(file);
      setQuestionForm(prev => ({ ...prev, [lessonId]: { ...(prev[lessonId] || {}), audio_url: res?.url } }));
      showToast('Đã upload audio', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally { setUploading(null); }
  };

  const setRole = async (userId, role) => {
    try {
      await api.admin.setRole(userId, role);
      const d = await api.admin.users({ role: 'teacher' });
      setUsers(d || []);
      showToast('Đã cập nhật vai trò', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const searchUsers = async () => {
    const d = await api.admin.users({ search: userSearch });
    setUsers(d || []);
  };

  const confirmLabel = confirmDel
    ? (confirmDel.type === 'module' ? 'module này (item sẽ về "Chưa phân nhóm")'
      : confirmDel.type === 'item' ? 'item này'
        : confirmDel.type === 'word' ? 'từ này'
          : 'câu hỏi này')
    : '';

  const doConfirmDel = async () => {
    if (!confirmDel) return;
    try {
      if (confirmDel.type === 'module') await api.admin.deleteModule(confirmDel.id);
      else if (confirmDel.type === 'item') await api.admin.deleteItem(confirmDel.id);
      else if (confirmDel.type === 'word') await api.admin.deleteWord(confirmDel.id);
      else if (confirmDel.type === 'question') await api.admin.deleteQuestion(confirmDel.id);
      if (confirmDel.type === 'word' || confirmDel.type === 'question') {
        await loadWords(confirmDel.extra);
        if (confirmDel.type === 'question') await loadQuestions(confirmDel.extra);
      }
      if (confirmDel.type === 'module' || confirmDel.type === 'item') await loadStructure(courseId);
      showToast('Đã xóa', 'success');
    } catch (e) { showToast(e.message, 'error'); }
    setConfirmDel(null);
  };

  const grouped = (moduleId) => items.filter(i => (i.module_id || null) === (moduleId || null));
  const firstKey = (grouped(null).length ? 'loose' : (modules[0]?.id ?? null));

  return (
    <div className="admin-panel">
      <h3>Cấu trúc khóa học</h3>
      <p className="admin-note" style={{ marginBottom: 14 }}>
        Tạo module (unit), thêm item theo loại: video / bài đọc / luyện nói / kiểm tra. Với luyện nói, thêm từng từ kèm audio mẫu.
      </p>

      <select className="admin-input" style={{ marginBottom: 16 }} value={courseId} onChange={e => setCourseId(e.target.value)}>
        <option value="">-- Chọn khóa học --</option>
        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
      </select>

      {courseId && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
            <input className="admin-input" style={{ flex: 1 }} placeholder="Tên module mới (vd: Monophthongs 1 - /i:/)" value={modTitle} onChange={e => setModTitle(e.target.value)} />
            <button className="admin-btn" onClick={addModule}>+ Thêm module</button>
          </div>

          {modules.length === 0 && items.length === 0 && (
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Khóa này chưa có module/item. Tạo module đầu tiên hoặc thêm item "Chưa phân nhóm".</p>
          )}

          {[{ id: null, title: 'Chưa phân nhóm' }, ...modules].map(mod => {
            const list = grouped(mod.id);
            if (!list.length && mod.id === null) return null;
            const key = mod.id || 'loose';
            const isOpen = openMods[key] === undefined ? (key === firstKey) : openMods[key];
            return (
              <div key={key} style={{ marginBottom: 10, border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-hover)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer' }} onClick={() => setOpenMods({ ...openMods, [key]: !isOpen })}>
                  <Icon.ArrowDown size={14} style={{ transition: 'transform .2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', color: 'var(--muted)', flexShrink: 0 }} />
                  {editingModule?.id === mod.id ? (
                    <span style={{ flex: 1, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      <input className="admin-input" style={{ flex: 1 }} value={editingModule.title} onChange={e => setEditingModule({ ...editingModule, title: e.target.value })} />
                      <button className="admin-btn" onClick={() => saveModule(mod.id)}>Lưu</button>
                      <button className="admin-btn-ghost" onClick={() => setEditingModule(null)}>Hủy</button>
                    </span>
                  ) : (
                    <b style={{ fontSize: 14, flex: 1 }}>{mod.title}</b>
                  )}
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{list.length} item</span>
                </div>
                <div style={{ borderTop: '1px solid var(--line)', padding: '6px 12px 8px', display: isOpen ? 'flex' : 'none', gap: 6, flexWrap: 'wrap', background: 'var(--card)' }}>
                  {mod.id != null && (
                    <>
                      <button className="admin-btn-ghost" onClick={() => setEditingModule({ id: mod.id, title: mod.title })}>Sửa tên</button>
                      <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setConfirmDel({ type: 'module', id: mod.id })}>Xóa module</button>
                    </>
                  )}
                  <button className="admin-btn-ghost" onClick={() => openItemForm(mod.id, null)}>+ Thêm item</button>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {list.map(it => (
                      <div key={it.id} style={{ padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--card)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 15 }}>{TYPES.find(t => t.value === it.item_type)?.label || '📄'}</span>
                          <b style={{ fontSize: 13, flex: 1, minWidth: 140 }}>{it.title}</b>
                          {it.is_free && <span className="admin-badge green">Miễn phí</span>}
                          {it.points > 0 && <span className="admin-badge gray">{it.points} điểm</span>}
                          <button className="admin-btn-ghost" onClick={() => openItemForm(mod.id, it)}>Sửa</button>
                          <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setConfirmDel({ type: 'item', id: it.id })}>Xóa</button>
                        </div>
                        {it.item_type === 'practice' && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                            <button className="admin-btn-ghost" onClick={() => { if (!words[it.id]) loadWords(it.id); setWords(prev => ({ ...prev, _open: it.id })); }}>
                              Từ luyện nói ({words[it.id]?.length ?? 0}) ▼
                            </button>
                            {words._open === it.id && (
                              <div style={{ marginTop: 8 }}>
                                {(words[it.id] || []).map(w => (
                                  <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                    {w.image_url && <img src={w.image_url} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />}
                                    <b style={{ fontSize: 13, width: 140 }}>{w.word}</b>
                                    {w.audio_url && <audio controls src={w.audio_url} style={{ height: 30, maxWidth: 140 }} />}
                                    <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setConfirmDel({ type: 'word', id: w.id, extra: it.id })}>Xóa</button>
                                  </div>
                                ))}
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
                                  <input className="admin-input" style={{ width: 160 }} placeholder="Từ (vd: cheese)" value={wordForm[it.id]?.word || ''} onChange={e => setWordForm({ ...wordForm, [it.id]: { ...(wordForm[it.id] || {}), word: e.target.value } })} />
                                  <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {uploading === it.id ? 'Đang upload...' : (wordForm[it.id]?.audio_url ? 'Đổi audio ✓' : '📁 Audio mẫu')}
                                    <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadAudio(e.target.files[0], it.id)} />
                                  </label>
                                  {wordForm[it.id]?.audio_url && <audio controls src={wordForm[it.id].audio_url} style={{ height: 30, maxWidth: 140 }} />}
                                  <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {uploading === it.id + ':img' ? 'Đang up...' : (wordForm[it.id]?.image_url ? '📁 Đổi ảnh' : '📁 Ảnh từ')}
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadWordImage(e.target.files[0], it.id)} />
                                  </label>
                                  {wordForm[it.id]?.image_url && <img src={wordForm[it.id].image_url} alt="word" style={{ height: 34, borderRadius: 6, border: '1px solid var(--line)' }} />}
                                  <button className="admin-btn" onClick={() => addWord(it.id)}>+ Thêm từ</button>
                                </div>
                              </div>
                            )}
                            {it.practice_type && it.practice_type !== 'speak_words' && it.practice_type !== 'voice_recorder' && (
                              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px dashed var(--line)' }}>
                                <button className="admin-btn-ghost" onClick={() => { if (!questions[it.id]) loadQuestions(it.id); setQuestions(prev => ({ ...prev, _openQ: it.id })); }}>
                                  Câu hỏi nghe ({questions[it.id]?.length ?? 0}) ▼
                                </button>
                                {questions._openQ === it.id && (
                                  <div style={{ marginTop: 8 }}>
                                    {(questions[it.id] || []).map(q => (
                                      <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: 12, flex: 1, minWidth: 140 }}>{q.prompt || q.text_content || `Câu ${q.position}`}</span>
                                        {q.audio_url && <audio controls src={q.audio_url} style={{ height: 28, maxWidth: 120 }} />}
                                        <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setConfirmDel({ type: 'question', id: q.id, extra: it.id })}>Xóa</button>
                                      </div>
                                    ))}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                      <label className="admin-btn" style={{ cursor: 'pointer', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                        {uploading === it.id + ':qa' ? 'Đang upload...' : (questionForm[it.id]?.audio_url ? '📁 Đổi audio câu hỏi' : '📁 Audio câu hỏi')}
                                        <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadQuestionAudio(e.target.files[0], it.id)} />
                                      </label>
                                      {questionForm[it.id]?.audio_url && <audio controls src={questionForm[it.id].audio_url} style={{ height: 30, maxWidth: 180 }} />}
                                      <input className="admin-input" placeholder="Hướng dẫn / câu hỏi (prompt)" value={questionForm[it.id]?.prompt || ''} onChange={e => setQuestionForm({ ...questionForm, [it.id]: { ...(questionForm[it.id] || {}), prompt: e.target.value } })} />
                                      {it.practice_type === 'listen_choose' ? (
                                        <>
                                          <textarea className="admin-input" style={{ minHeight: 80, whiteSpace: 'pre-wrap' }} placeholder="Các đáp án (mỗi dòng 1 đáp án)" value={questionForm[it.id]?.optionsText || ''} onChange={e => setQuestionForm({ ...questionForm, [it.id]: { ...(questionForm[it.id] || {}), optionsText: e.target.value } })} />
                                          <select className="admin-input" value={questionForm[it.id]?.correctIdx ?? ''} onChange={e => setQuestionForm({ ...questionForm, [it.id]: { ...(questionForm[it.id] || {}), correctIdx: e.target.value } })}>
                                            <option value="">-- Đáp án đúng --</option>
                                            {(questionForm[it.id]?.optionsText || '').split('\n').map((s, i) => s.trim() ? <option key={i} value={i}>{i + 1}. {s.trim()}</option> : null)}
                                          </select>
                                        </>
                                      ) : (
                                        <>
                                          <textarea className="admin-input" style={{ minHeight: 90, whiteSpace: 'pre-wrap' }} placeholder="Đoạn text gốc — điền chỗ trống bằng ____ (listen_fill) / đoạn text cần chọn từ (listen_mark)" value={questionForm[it.id]?.text_content || ''} onChange={e => setQuestionForm({ ...questionForm, [it.id]: { ...(questionForm[it.id] || {}), text_content: e.target.value } })} />
                                          <textarea className="admin-input" style={{ minHeight: 60, whiteSpace: 'pre-wrap' }} placeholder={it.practice_type === 'listen_fill' ? 'Đáp án điền (mỗi dòng 1 từ, theo thứ tự)' : 'Các từ đúng cần chọn (mỗi dòng 1 từ)'} value={questionForm[it.id]?.correctText || ''} onChange={e => setQuestionForm({ ...questionForm, [it.id]: { ...(questionForm[it.id] || {}), correctText: e.target.value } })} />
                                        </>
                                      )}
                                      <button className="admin-btn" style={{ alignSelf: 'flex-start' }} onClick={() => saveQuestion(it.id, it.practice_type)}>+ Thêm câu hỏi</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {itemForm && (
        <div id="item-form-box" style={{ marginTop: 20, padding: 18, border: '1px solid var(--red)', borderRadius: 14, background: 'var(--surface-hover)' }}>
          <b style={{ fontSize: 14, display: 'block', marginBottom: 12 }}>{itemForm.id ? 'Sửa item' : 'Thêm item'}</b>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input className="admin-input" placeholder="Tiêu đề item" value={itemForm.title} onChange={e => setItemForm({ ...itemForm, title: e.target.value })} />
            <select className="admin-input" value={itemForm.item_type} onChange={e => setItemForm({ ...itemForm, item_type: e.target.value })}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <input className="admin-input" placeholder="sort_order (thứ tự)" type="number" value={itemForm.sort_order} onChange={e => setItemForm({ ...itemForm, sort_order: Number(e.target.value) })} />
            {itemForm.item_type === 'practice' ? (
              <select className="admin-input" value={itemForm.practice_type} onChange={e => setItemForm({ ...itemForm, practice_type: e.target.value })}>
                {PRACTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            ) : (
              <input className="admin-input" placeholder="Điểm tối đa (nếu là practice)" type="number" value={itemForm.points} onChange={e => setItemForm({ ...itemForm, points: Number(e.target.value) })} />
            )}
          </div>
          {itemForm.item_type === 'practice' && (
            <input className="admin-input" style={{ marginBottom: 10 }} placeholder="Điểm tối đa" type="number" value={itemForm.points} onChange={e => setItemForm({ ...itemForm, points: Number(e.target.value) })} />
          )}
          {itemForm.item_type === 'practice' && itemForm.practice_type === 'voice_recorder' && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
              <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {uploading === 'va' ? 'Đang upload...' : (itemForm.audio_url ? '📁 Đổi audio mẫu' : '📁 Audio mẫu')}
                <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setUploading('va');
                  api.admin.uploadAudio(file).then(res => {
                    setItemForm(prev => ({ ...prev, audio_url: res?.url || '' }));
                    showToast('Đã upload audio', 'success');
                  }).catch(err => showToast(err.message || 'Upload thất bại', 'error')).finally(() => setUploading(null));
                }} />
              </label>
              {itemForm.audio_url && <audio controls src={itemForm.audio_url} style={{ height: 34, maxWidth: 200 }} />}
            </div>
          )}
          {itemForm.item_type === 'video_lesson' && (
            <input className="admin-input" style={{ marginBottom: 10 }} placeholder="Video URL (YouTube embed / https...)" value={itemForm.video_url} onChange={e => setItemForm({ ...itemForm, video_url: e.target.value })} />
          )}
          {itemForm.item_type === 'quiz' && (
            <input className="admin-input" style={{ marginBottom: 10 }} placeholder="quiz_slug (slug bộ câu hỏi)" value={itemForm.quiz_slug} onChange={e => setItemForm({ ...itemForm, quiz_slug: e.target.value })} />
          )}
          {(itemForm.item_type === 'lesson' || itemForm.item_type === 'video_lesson' || itemForm.item_type === 'practice') && (
            <textarea
              className="admin-input" style={{ marginBottom: 10, minHeight: 140, whiteSpace: 'pre-wrap' }}
              placeholder="Nội dung chữ (copy-paste từ LMS, có thể dán HTML)..."
              value={itemForm.body_html}
              onChange={e => setItemForm({ ...itemForm, body_html: e.target.value })}
            />
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
            <input type="checkbox" checked={itemForm.is_free} onChange={e => setItemForm({ ...itemForm, is_free: e.target.checked })} />
            Item miễn phí
          </label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
            <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {uploading === 'img' ? 'Đang upload...' : (itemForm.image_url ? '📁 Đổi ảnh' : '📁 Ảnh bài')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
            </label>
            {itemForm.image_url && (
              <>
                <img src={itemForm.image_url} alt="preview" style={{ height: 44, borderRadius: 8, border: '1px solid var(--line)' }} />
                <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setItemForm({ ...itemForm, image_url: '' })}>Bỏ ảnh</button>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn" onClick={saveItem}>Lưu</button>
            <button className="admin-btn-ghost" onClick={() => setItemForm(null)}>Hủy</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <h3>Gán vai trò giáo viên</h3>
        <p className="admin-note" style={{ marginBottom: 12 }}>Giáo viên được vào trang "Chấm bài phát âm" để nghe và chấm lại bài học viên gửi.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="admin-input" style={{ flex: 1 }} placeholder="Tìm theo email / tên..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
          <button className="admin-btn" onClick={searchUsers}>Tìm</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {users.map(u => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 10, background: 'var(--surface-hover)' }}>
              <span style={{ fontSize: 13, flex: 1 }}>{u.full_name || u.email} <span style={{ color: 'var(--muted)', fontSize: 12 }}>{u.email}</span></span>
              <span className="admin-badge gray">{u.role}</span>
              <select className="admin-input" style={{ width: 130 }} value={u.role} onChange={e => setRole(u.id, e.target.value)}>
                <option value="learner">learner</option>
                <option value="teacher">teacher</option>
                <option value="admin">admin</option>
                <option value="super_admin">super_admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {confirmDel && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
          background: 'var(--card)', border: '1px solid var(--red)', borderRadius: 14,
          padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,.18)', maxWidth: '92vw',
        }}>
          <b style={{ fontSize: 13 }}>Xóa {confirmLabel}?</b>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="admin-btn" style={{ background: 'var(--red)', color: '#fff', border: 'none' }} onClick={doConfirmDel}>Có, xóa</button>
            <button className="admin-btn-ghost" onClick={() => setConfirmDel(null)}>Không</button>
          </div>
        </div>
      )}
    </div>
  );
}