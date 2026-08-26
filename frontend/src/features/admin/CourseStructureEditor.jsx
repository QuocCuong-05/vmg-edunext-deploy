import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DndContext, closestCorners, PointerSensor, TouchSensor, KeyboardSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '../../lib/api';
import { Icon } from '../../lib/icons';
import { useToast } from '../../components/ui/Toast';
import RichEditor from '../../components/ui/RichEditor';

const TYPES = [
  { value: 'video_lesson', label: '🎬 Video bài giảng', icon: '🎬' },
  { value: 'lesson', label: '📄 Bài đọc (text)', icon: '📄' },
  { value: 'practice', label: '🎤 Luyện nói (practice)', icon: '🎤' },
  { value: 'quiz', label: '📝 Kiểm tra (quiz)', icon: '📝' },
];

const PRACTICE_TYPES = [
  { value: 'speak_passage', label: '📖 Luyện nói từng từ (kiểu LMS)' },
  { value: 'voice_recorder', label: '🎙️ Ghi âm tự do' },
  { value: 'listen_choose', label: '👂 Nghe → chọn đáp án' },
  { value: 'listen_fill', label: '📝 Nghe → điền từ' },
  { value: 'listen_mark', label: '✏️ Nghe → đánh dấu từ' },
];

const QUESTION_PRACTICE_TYPES = ['listen_choose', 'listen_fill', 'listen_mark'];

const ACCESS_TYPES = [
  { value: 'free', label: 'Miễn phí' },
  { value: 'premium', label: 'Premium (cần Plus)' },
];

const LEVELS = ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const EMPTY_ITEM = {
  title: '', item_type: 'video_lesson', module_id: '', video_url: '',
  body_html: '', points: 0, audio_url: '', image_url: '', quiz_slug: '', is_free: false, sort_order: 0,
  practice_type: 'speak_passage',
};

const EMPTY_COURSE = {
  title: '', slug: '', description: '', level: 'B1', category: 'General',
  duration_hours: 0, instructor: 'VMG Academic Team', thumbnail: '', access_type: 'free', is_published: true,
};

const LOOSE_KEY = '__loose__';
const modKeyOf = (item) => item.module_id || LOOSE_KEY;

function typeMeta(t) {
  return TYPES.find(x => x.value === t) || { icon: '📄', label: t };
}

/* ---------- Draggable lesson row ---------- */
function SortableItem({ item, active, onSelect, onDuplicate, onDelete, duplicating }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id, data: { type: 'item' } });
  const meta = typeMeta(item.item_type);
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cs-item-row${active ? ' active' : ''}${isDragging ? ' dragging' : ''}`}
    >
      <button
        ref={setActivatorNodeRef} className="cs-handle" title="Kéo để sắp xếp"
        aria-label="Kéo để sắp xếp" {...attributes} {...listeners}
      >
        <Icon.Dots size={15} />
      </button>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{meta.icon}</span>
      <button type="button" className="cs-item-title" onClick={() => onSelect(item)} title={item.title}>
        {item.title}
      </button>
      {!!item.is_free && <span className="cs-badge free">Free</span>}
      {item.points > 0 && <span className="cs-badge">{item.points}đ</span>}
      <button type="button" className="cs-icon-btn" title="Sửa bài" onClick={() => onSelect(item)}>
        <Icon.Pen size={14} />
      </button>
      <button
        type="button" className="cs-icon-btn" title="Nhân bản bài"
        disabled={duplicating} onClick={() => onDuplicate(item)}
        style={{ opacity: duplicating ? 0.45 : 1 }}
      >
        ⧉
      </button>
      <button
        type="button" className="cs-icon-btn" title="Xóa bài"
        style={{ color: 'var(--red)' }} onClick={() => onDelete(item)}
      >
        <Icon.X size={14} />
      </button>
    </div>
  );
}

/* ---------- Draggable module card ---------- */
function SortableModule({ mod, count, open, onToggle, onRename, onStartRename, onDelete, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: mod.id, data: { type: 'module' } });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`cs-mod${isDragging ? ' dragging' : ''}`}
    >
      <div className="cs-mod-head" onClick={onToggle}>
        <button
          ref={setActivatorNodeRef} className="cs-handle" title="Kéo để đổi thứ tự module"
          aria-label="Kéo để đổi thứ tự module" {...attributes} {...listeners}
          onClick={e => e.stopPropagation()}
        >
          <Icon.Dots size={15} />
        </button>
        {open
          ? <Icon.ArrowDown size={14} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform .2s' }} />
          : <Icon.ArrowRight size={14} style={{ color: 'var(--muted)', flexShrink: 0, transition: 'transform .2s' }} />}
        {onRename ? (
          <span style={{ flex: 1, display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
            <input className="admin-input" style={{ flex: 1 }} value={onRename.title} onChange={e => onRename.onChange(e.target.value)} autoFocus />
            <button className="admin-btn" onClick={(e) => { e.stopPropagation(); onRename.onSave(); }}>Lưu</button>
            <button className="admin-btn-ghost" onClick={(e) => { e.stopPropagation(); onRename.onCancel(); }}>Hủy</button>
          </span>
        ) : (
          <b style={{ fontSize: 14, flex: 1 }}>{mod.title}</b>
        )}
        {!onRename && (
          <>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{count} bài</span>
            <button type="button" className="cs-icon-btn" title="Sửa tên module" onClick={(e) => { e.stopPropagation(); onStartRename(); }}>
              <Icon.Pen size={13} />
            </button>
            <button
              type="button" className="cs-icon-btn" title="Xóa module"
              style={{ color: 'var(--red)' }} onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Icon.Trash size={13} />
            </button>
          </>
        )}
      </div>
      {open && <div className="cs-items">{children}</div>}
    </div>
  );
}

export default function CourseStructureEditor() {
  const showToast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState({});
  const [openMods, setOpenMods] = useState({});
  const [modTitle, setModTitle] = useState('');
  const [renaming, setRenaming] = useState(null); // {id, title}
  const [panel, setPanel] = useState(null); // null | 'course' | 'item'
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [itemForm, setItemForm] = useState(null);
  const [courseForm, setCourseForm] = useState(null); // {..., id?: string}
  const [savingCourse, setSavingCourse] = useState(false);

  const [words, setWords] = useState({});
  const [wordForm, setWordForm] = useState({});
  const [bulkText, setBulkText] = useState({});
  const [questions, setQuestions] = useState({});
  const [questionForm, setQuestionForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [uploading, setUploading] = useState(null);
  const [duplicating, setDuplicating] = useState(null);
  const [quickAdding, setQuickAdding] = useState(null);
  const [editorExpanded, setEditorExpanded] = useState(false);

  // Esc để thoát chế độ toàn màn hình
  useEffect(() => {
    if (!editorExpanded) return;
    const onKey = (e) => { if (e.key === 'Escape') setEditorExpanded(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editorExpanded]);

  // --- DnD ---
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const snapshotRef = useRef(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    api.courses.list().then(d => setCourses(d || [])).catch(() => {});
    api.admin.users({ role: 'teacher' }).then(d => setUsers(d || [])).catch(() => {});
  }, []);

  const rebuildGroups = useCallback((moduleList, itemList) => {
    const map = {};
    moduleList.forEach(m => { map[m.id] = []; });
    itemList.forEach(it => {
      const key = modKeyOf(it);
      if (!map[key]) map[key] = [];
      map[key].push(it);
    });
    Object.keys(map).forEach(k => map[k].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0)));
    return map;
  }, []);

  const loadStructure = useCallback(async (cid) => {
    if (!cid) return;
    try {
      const [m, i] = await Promise.all([api.admin.modules(cid), api.admin.items(cid)]);
      const mods = (m || []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      setModules(mods);
      setItems(i || []);
      setGroups(rebuildGroups(mods, i || []));
    } catch {}
  }, [rebuildGroups]);

  useEffect(() => {
    if (courseId) loadStructure(courseId);
  }, [courseId, loadStructure]);

  /* ---------- Practice words / questions (giữ logic cũ) ---------- */
  const loadWords = async (lessonId) => {
    try {
      const d = await api.admin.practiceWords(lessonId);
      setWords(prev => ({ ...prev, [lessonId]: d || [] }));
    } catch {}
  };

  const addWord = async (lessonId) => {
    const f = wordForm[lessonId];
    if (!f || !f.word.trim()) return;
    try {
      await api.admin.createWord({ lesson_id: lessonId, word: f.word.trim(), audio_url: f.audio_url || null, image_url: f.image_url || null, position: (words[lessonId] || []).length + 1 });
      setWordForm({ ...wordForm, [lessonId]: { word: '', audio_url: '', image_url: '' } });
      await loadWords(lessonId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const addWordsBulk = async (lessonId) => {
    const raw = (bulkText[lessonId] || '').trim();
    if (!raw) return;
    const list = raw
      .split(/[\n,;]+/)
      .map(s => s.trim().replace(/\s+/g, ' '))
      .filter(Boolean);
    if (!list.length) return;
    try {
      let pos = (words[lessonId] || []).length;
      for (const w of list) {
        pos += 1;
        await api.admin.createWord({ lesson_id: lessonId, word: w, audio_url: null, image_url: null, position: pos });
      }
      setBulkText({ ...bulkText, [lessonId]: '' });
      await loadWords(lessonId);
      showToast(`Đã thêm ${list.length} từ`, 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const deleteWordDirect = async (wordId, lessonId) => {
    try {
      await api.admin.deleteWord(wordId);
      await loadWords(lessonId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  const uploadAudio = async (file, lessonId) => {
    setUploading(lessonId);
    try {
      const res = await api.admin.uploadAudio(file);
      setWordForm(prev => ({ ...prev, [lessonId]: { ...(prev[lessonId] || {}), audio_url: res?.url } }));
      showToast('Đã upload audio', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally {
      setUploading(null);
    }
  };

  const uploadImage = async (file, target = 'item') => {
    setUploading(target);
    try {
      const res = await api.cms.upload(file);
      if (target === 'courseThumb') setCourseForm(prev => ({ ...prev, thumbnail: res?.url || '' }));
      else setItemForm(prev => ({ ...prev, image_url: res?.url || '' }));
      showToast('Đã upload ảnh', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally {
      setUploading(null);
    }
  };

  const uploadWordImage = async (file, lessonId) => {
    setUploading(lessonId + ':img');
    try {
      const res = await api.cms.upload(file);
      setWordForm(prev => ({ ...prev, [lessonId]: { ...(prev[lessonId] || {}), image_url: res?.url } }));
      showToast('Đã upload ảnh', 'success');
    } catch (e) { showToast(e.message || 'Upload thất bại', 'error'); } finally {
      setUploading(null);
    }
  };

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
      setQuestionForm(prev => ({ ...prev, [lessonId]: { prompt: '', audio_url: '', optionsText: '', correctText: '', correctIdx: '', text_content: '' } }));
      await loadQuestions(lessonId);
      showToast('Đã thêm câu hỏi', 'success');
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

  /* ---------- Modules CRUD ---------- */
  const addModule = async () => {
    if (!modTitle.trim()) return;
    try {
      await api.admin.createModule({ course_id: courseId, title: modTitle.trim(), position: modules.length + 1 });
      setModTitle('');
      await loadStructure(courseId);
      showToast('Đã thêm module', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  const saveModuleRename = async () => {
    try {
      await api.admin.updateModule(renaming.id, { title: renaming.title });
      setRenaming(null);
      await loadStructure(courseId);
    } catch (e) { showToast(e.message, 'error'); }
  };

  /* ---------- Items: mở form, lưu, xóa ---------- */
  const openItemEditor = useCallback((it) => {
    setSelectedItemId(it.id);
    setPanel('item');
    setItemForm({
      id: it.id, module_id: it.module_id || '', title: it.title,
      item_type: it.item_type || 'video_lesson', video_url: it.video_url || '',
      body_html: it.body_html || '', points: it.points || 0, audio_url: it.audio_url || '',
      image_url: it.image_url || '', quiz_slug: it.quiz_slug || '',
      is_free: !!it.is_free, sort_order: it.sort_order || 0,
      practice_type: !it.practice_type || it.practice_type === 'speak_words' ? 'speak_passage' : it.practice_type,
    });
    if ((it.item_type || '') === 'practice') {
      if (!words[it.id]) loadWords(it.id);
      if (QUESTION_PRACTICE_TYPES.includes(it.practice_type) && !questions[it.id]) loadQuestions(it.id);
    }
    setCourseForm(null);
  }, [words, questions]);

  const saveItem = async () => {
    const f = itemForm;
    if (!f.title.trim()) { showToast('Cần nhập tiêu đề', 'error'); return; }
    const payload = { ...f, module_id: f.module_id || null };
    try {
      if (f.id) await api.admin.updateItem(f.id, payload);
      else await api.admin.createItem({ ...payload, course_id: courseId });
      await loadStructure(courseId);
      showToast('Đã lưu bài học', 'success');
    } catch (e) { showToast(e.message, 'error'); }
  };

  /* ---------- Quick add: tạo bài nháp instant ---------- */
  const quickAdd = async (key) => {
    const groupId = key === LOOSE_KEY ? null : key;
    const nextOrder = (groups[key]?.length || 0) + 1;
    setQuickAdding(key);
    try {
      const created = await api.admin.createItem({
        course_id: courseId, module_id: groupId,
        title: 'Bài học mới', item_type: 'video_lesson', sort_order: nextOrder,
      });
      await loadStructure(courseId);
      openItemEditor(created);
      showToast('Đã tạo bài nháp — sửa nội dung rồi bấm Lưu bài', 'success');
    } catch (e) { showToast(e.message || 'Tạo bài thất bại', 'error'); } finally {
      setQuickAdding(null);
    }
  };

  /* ---------- Duplicate ---------- */
  const duplicateItem = async (it) => {
    setDuplicating(it.id);
    try {
      const created = await api.admin.duplicateItem(it.id);
      await loadStructure(courseId);
      if (created) openItemEditor(created);
      showToast('Đã nhân bản bài học (kèm từ vựng + câu hỏi)', 'success');
    } catch (e) { showToast(e.message || 'Nhân bản thất bại', 'error'); } finally {
      setDuplicating(null);
    }
  };

  /* ---------- Confirm delete ---------- */
  const confirmLabel = confirmDel
    ? (confirmDel.type === 'module' ? 'module này (các bài sẽ về "Chưa phân nhóm")'
      : confirmDel.type === 'item' ? 'bài học này'
        : confirmDel.type === 'word' ? 'từ này'
          : 'câu hỏi này')
    : '';

  const doConfirmDel = async () => {
    if (!confirmDel) return;
    try {
      if (confirmDel.type === 'module') await api.admin.deleteModule(confirmDel.id);
      else if (confirmDel.type === 'item') {
        await api.admin.deleteItem(confirmDel.id);
        if (selectedItemId === confirmDel.id) { setSelectedItemId(null); setPanel(null); setItemForm(null); }
      } else if (confirmDel.type === 'word') await api.admin.deleteWord(confirmDel.id);
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

  /* ---------- Course CRUD ---------- */
  const openNewCourse = () => {
    setPanel('course');
    setSelectedItemId(null);
    setItemForm(null);
    setCourseForm({ ...EMPTY_COURSE });
  };

  const openEditCourse = () => {
    const c = courses.find(x => String(x.id) === String(courseId));
    if (!c) { showToast('Hãy chọn khóa học trước', 'error'); return; }
    setPanel('course');
    setSelectedItemId(null);
    setItemForm(null);
    setCourseForm({
      id: c.id,
      title: c.title || '', slug: c.slug || '', description: c.description || '',
      level: c.level || 'B1', category: c.category || 'General',
      duration_hours: c.duration_hours || 0, instructor: c.instructor || '',
      thumbnail: c.thumbnail || '', access_type: c.access_type || 'free',
      is_published: c.is_published !== false,
    });
  };

  const saveCourse = async () => {
    const f = courseForm;
    if (!f.title.trim()) { showToast('Cần nhập tên khóa học', 'error'); return; }
    setSavingCourse(true);
    try {
      const payload = {
        title: f.title.trim(), slug: f.slug.trim() || undefined,
        description: f.description, level: f.level, category: f.category,
        duration_hours: Number(f.duration_hours) || 0, instructor: f.instructor,
        thumbnail: f.thumbnail || null, access_type: f.access_type,
        is_published: !!f.is_published,
      };
      let saved;
      if (f.id) saved = await api.admin.updateCourse(f.id, payload);
      else saved = await api.admin.createCourse(payload);
      const list = await api.courses.list();
      setCourses(list || []);
      if (saved?.id) setCourseId(String(saved.id));
      setCourseForm(prev => ({ ...prev, id: saved.id }));
      showToast(f.id ? 'Đã cập nhật khóa học' : 'Đã tạo khóa học — giờ thêm module và bài học', 'success');
      await loadStructure(String(saved.id));
    } catch (e) { showToast(e.message || 'Lưu thất bại', 'error'); } finally {
      setSavingCourse(false);
    }
  };

  /* ================= DRAG & DROP ================= */
  const moduleKeys = useMemo(() => modules.map(m => m.id), [modules]);
  const hasLoose = !!groups[LOOSE_KEY]?.length;

  const findContainer = useCallback((id) => {
    if (id === LOOSE_KEY) return LOOSE_KEY;
    if (moduleKeys.includes(id)) return id;
    const it = items.find(i => i.id === id);
    if (it) return modKeyOf(it);
    return null;
  }, [moduleKeys, items]);

  const isModOpen = (key) => openMods[key] !== false;

  const onDragStart = (e) => {
    setActiveId(e.active.id);
    setActiveType(e.active.data.current?.type || null);
    snapshotRef.current = JSON.parse(JSON.stringify(groups));
  };

  const onDragOver = (e) => {
    const { active, over } = e;
    if (!over || activeType !== 'item') return;
    const from = findContainer(active.id);
    let to = findContainer(over.id);
    if (over.data.current?.type === 'module' && over.id !== active.id) to = over.id === LOOSE_KEY ? LOOSE_KEY : over.id;
    if (!from || !to || from === to) return;
    if (!isModOpen(to)) return;
    setGroups(prev => {
      const moved = (prev[from] || []).find(i => i.id === active.id);
      if (!moved) return prev;
      return {
        ...prev,
        [from]: (prev[from] || []).filter(i => i.id !== active.id),
        [to]: [...(prev[to] || []), { ...moved, module_id: to === LOOSE_KEY ? null : to }],
      };
    });
    setOpenMods(prev => ({ ...prev, [to]: true }));
  };

  const onDragEnd = async (e) => {
    const { active, over } = e;
    setActiveId(null);
    const type = activeType;
    setActiveType(null);
    if (!over) { if (snapshotRef.current) setGroups(snapshotRef.current); return; }

    if (type === 'module') {
      const oldIdx = moduleKeys.indexOf(active.id);
      const newIdx = moduleKeys.indexOf(over.id);
      if (oldIdx < 0 || newIdx < 0 || oldIdx === newIdx) return;
      const newModules = arrayMove(modules, oldIdx, newIdx).map((m, i) => ({ ...m, position: i + 1 }));
      setModules(newModules);
      try {
        await api.admin.reorderModules(newModules.map(m => ({ id: m.id, position: m.position })));
        showToast('Đã lưu thứ tự module', 'success');
      } catch (err) { showToast(err.message || 'Lưu thứ tự thất bại', 'error'); loadStructure(courseId); }
      return;
    }

    if (type === 'item') {
      const container = findContainer(over.id) || (over.data.current?.type === 'module' ? over.id : null);
      if (!container) return;

      const arr = [...(groups[container] || [])];
      const oldIdx = arr.findIndex(i => i.id === active.id);
      const newIdx = arr.findIndex(i => i.id === over.id);
      let finalArr;
      if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
        finalArr = arrayMove(arr, oldIdx, newIdx).map((it, i) => ({ ...it, sort_order: i + 1 }));
      } else {
        finalArr = arr.map((it, i) => ({ ...it, sort_order: i + 1 }));
      }
      const newGroups = { ...groups, [container]: finalArr };
      setGroups(newGroups);

      // Persist những gì thay đổi so với snapshot trước kéo
      const snap = snapshotRef.current || {};
      const updates = [];
      Object.entries(newGroups).forEach(([key, list]) => {
        const newMod = key === LOOSE_KEY ? null : key;
        list.forEach((it, idx) => {
          const before = (snap[key] || []).find(x => x.id === it.id);
          const changed = !before || before.module_id !== newMod || Number(before.sort_order) !== idx + 1;
          if (changed) updates.push({ id: it.id, sort_order: idx + 1, module_id: newMod });
        });
      });
      if (!updates.length) return;
      api.admin.reorderItems(updates)
        .then(() => showToast('Đã lưu thứ tự bài học', 'success'))
        .catch(err => { showToast(err.message || 'Lưu thứ tự thất bại', 'error'); loadStructure(courseId); });
    }
  };

  /* ---------- Teacher roles (giữ nguyên) ---------- */
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

  const activeItem = items.find(i => i.id === selectedItemId);
  const selPracticeType = itemForm?.practice_type || 'speak_passage';

  const renderItemForm = () => (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <b style={{ fontSize: 15 }}>{itemForm.id ? '✎ Sửa bài học' : 'Thêm bài học'}</b>
        {activeItem && <span className="cs-badge">{typeMeta(activeItem.item_type).label}</span>}
      </div>

      <label className="admin-label">Tiêu đề bài học *</label>
      <input className="admin-input" placeholder="vd: Monophthongs 1 - the /i:/ sound" value={itemForm.title} onChange={e => setItemForm({ ...itemForm, title: e.target.value })} />

      <label className="admin-label">Loại bài học</label>
      <select className="admin-input" value={itemForm.item_type} onChange={e => setItemForm({ ...itemForm, item_type: e.target.value })}>
        {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {itemForm.item_type === 'practice' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="admin-label">Loại luyện nói</label>
            <select className="admin-input" value={itemForm.practice_type} onChange={e => setItemForm({ ...itemForm, practice_type: e.target.value })}>
              {PRACTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="admin-label">Điểm tối đa</label>
            <input className="admin-input" placeholder="Điểm tối đa" type="number" value={itemForm.points} onChange={e => setItemForm({ ...itemForm, points: Number(e.target.value) })} />
          </div>
        </div>
      )}

      {itemForm.item_type === 'quiz' && (
        <>
          <label className="admin-label">quiz_slug (slug bộ câu hỏi)</label>
          <input className="admin-input" placeholder="vd: monophthongs-1" value={itemForm.quiz_slug} onChange={e => setItemForm({ ...itemForm, quiz_slug: e.target.value })} />
          <div className="admin-note" style={{ marginTop: 4 }}>Slug của bộ câu hỏi trong trang Luyện tập</div>
        </>
      )}

      {itemForm.item_type === 'video_lesson' && (
        <>
          <label className="admin-label">Video URL</label>
          <input className="admin-input" placeholder="https://..." value={itemForm.video_url} onChange={e => setItemForm({ ...itemForm, video_url: e.target.value })} />
          <div className="admin-note" style={{ marginTop: 4 }}>Link YouTube embed hoặc đường dẫn file video</div>
        </>
      )}

      {(itemForm.item_type === 'lesson' || itemForm.item_type === 'video_lesson' || itemForm.item_type === 'practice') && (
        <>
          <label className="admin-label">Nội dung bài</label>
          <RichEditor
            value={itemForm.body_html || ''}
            onChange={html => setItemForm({ ...itemForm, body_html: html })}
            placeholder="Copy-paste nội dung từ LMS vào đây — chèn ảnh/audio bằng nút 🖼 🎵..."
          />
        </>
      )}

      {(itemForm.item_type === 'lesson' || itemForm.item_type === 'video_lesson' || itemForm.item_type === 'practice') && (
        <>
          <label className="admin-label">Audio bài nghe</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {uploading === 'va' ? 'Đang upload...' : (itemForm.audio_url ? '📁 Đổi audio' : '📁 Chọn file audio')}
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
            {itemForm.audio_url && <audio controls src={itemForm.audio_url} style={{ height: 34, maxWidth: 220 }} />}
          </div>
        </>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink)', margin: '14px 0' }}>
        <input type="checkbox" checked={itemForm.is_free} onChange={e => setItemForm({ ...itemForm, is_free: e.target.checked })} />
        Bài miễn phí (xem được khi chưa mua/Plus)
      </label>

      <label className="admin-label">Ảnh bìa</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {uploading === 'img' ? 'Đang upload...' : (itemForm.image_url ? '📁 Đổi ảnh' : '📁 Chọn ảnh')}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
        </label>
        {itemForm.image_url && (
          <>
            <img src={itemForm.image_url} alt="" style={{ height: 44, borderRadius: 8, border: '1px solid var(--line)' }} />
            <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setItemForm({ ...itemForm, image_url: '' })}>Bỏ ảnh</button>
          </>
        )}
      </div>

      <div style={{ margin: '16px 0', border: '1px solid var(--line)', borderRadius: 12, padding: 14, background: 'var(--surface-hover)' }}>
        <div className="admin-note" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>Xem trước bài</div>
        {itemForm.title && <h3 style={{ fontSize: 18, margin: '0 0 8px' }}>{itemForm.title}</h3>}
        {itemForm.audio_url && <audio controls src={itemForm.audio_url} style={{ height: 38, maxWidth: 320, marginBottom: 8 }} />}
        {itemForm.image_url && <img src={itemForm.image_url} alt="" style={{ maxHeight: 160, borderRadius: 10, marginBottom: 8, display: 'block' }} />}
        <div className="article-content" style={{ fontSize: 14, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: itemForm.body_html || '<p style="color:var(--muted)">Chưa có nội dung...</p>' }} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="admin-btn" onClick={saveItem}>💾 Lưu bài</button>
        <button className="admin-btn-ghost" onClick={() => { setPanel(null); setSelectedItemId(null); setItemForm(null); setEditorExpanded(false); }}>Đóng</button>
      </div>
    </>
  );

  const renderPracticeManager = () => (
    <>
      {/* Từ luyện nói */}
      {selPracticeType !== 'voice_recorder' && (
        <section className="cs-manage">
          <b style={{ fontSize: 13 }}>Từ luyện nói ({(words[itemForm.id] || []).length})</b>
          {(words[itemForm.id] || []).map(w => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {w.image_url && <img src={w.image_url} alt="" style={{ width: 26, height: 26, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--line)' }} />}
              <b style={{ fontSize: 13, width: 130 }}>{w.word}</b>
              {w.audio_url && <audio controls src={w.audio_url} style={{ height: 28, maxWidth: 140 }} />}
              <button className="cs-icon-btn" title="Xóa từ" style={{ color: 'var(--red)' }} onClick={() => deleteWordDirect(w.id, itemForm.id)}>
                <Icon.X size={13} />
              </button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="admin-input" style={{ width: 150 }} placeholder="Từ (vd: cheese)" value={wordForm[itemForm.id]?.word || ''} onChange={e => setWordForm({ ...wordForm, [itemForm.id]: { ...(wordForm[itemForm.id] || {}), word: e.target.value } })} />
            <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {uploading === itemForm.id ? 'Đang upload...' : (wordForm[itemForm.id]?.audio_url ? 'Đổi audio ✓' : '📁 Audio mẫu')}
              <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadAudio(e.target.files[0], itemForm.id)} />
            </label>
            <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {uploading === itemForm.id + ':img' ? 'Đang up...' : (wordForm[itemForm.id]?.image_url ? '📁 Đổi ảnh' : '📁 Ảnh từ')}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadWordImage(e.target.files[0], itemForm.id)} />
            </label>
            <button className="admin-btn" onClick={() => addWord(itemForm.id)}>+ Thêm từ</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', marginTop: 10 }}>
            <textarea
              className="admin-input"
              style={{ minHeight: 64, flex: 1, minWidth: 220, whiteSpace: 'pre-wrap' }}
              placeholder="Thêm hàng loạt: dán danh sách từ, mỗi từ 1 dòng (hoặc cách/phẩy)"
              value={bulkText[itemForm.id] || ''}
              onChange={e => setBulkText({ ...bulkText, [itemForm.id]: e.target.value })}
            />
            <button className="admin-btn" onClick={() => addWordsBulk(itemForm.id)}>➕ Thêm hàng loạt</button>
          </div>
        </section>
      )}

      {/* Câu hỏi nghe */}
      {QUESTION_PRACTICE_TYPES.includes(selPracticeType) && (
        <section className="cs-manage">
          <b style={{ fontSize: 13 }}>Câu hỏi nghe ({(questions[itemForm.id] || []).length})</b>
          {(questions[itemForm.id] || []).map(q => (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, flex: 1, minWidth: 120 }}>{q.prompt || q.text_content || `Câu ${q.position}`}</span>
              {q.audio_url && <audio controls src={q.audio_url} style={{ height: 26, maxWidth: 110 }} />}
              <button className="cs-icon-btn" title="Xóa câu hỏi" style={{ color: 'var(--red)' }} onClick={() => setConfirmDel({ type: 'question', id: q.id, extra: itemForm.id })}>
                <Icon.X size={13} />
              </button>
            </div>
          ))}
          <label className="admin-btn" style={{ cursor: 'pointer', alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {uploading === itemForm.id + ':qa' ? 'Đang upload...' : (questionForm[itemForm.id]?.audio_url ? '📁 Đổi audio câu hỏi' : '📁 Audio câu hỏi')}
            <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadQuestionAudio(e.target.files[0], itemForm.id)} />
          </label>
          <input className="admin-input" placeholder="Hướng dẫn / câu hỏi (prompt)" value={questionForm[itemForm.id]?.prompt || ''} onChange={e => setQuestionForm({ ...questionForm, [itemForm.id]: { ...(questionForm[itemForm.id] || {}), prompt: e.target.value } })} />
          {selPracticeType === 'listen_choose' ? (
            <>
              <textarea className="admin-input" style={{ minHeight: 70, whiteSpace: 'pre-wrap' }} placeholder="Các đáp án (mỗi dòng 1 đáp án)" value={questionForm[itemForm.id]?.optionsText || ''} onChange={e => setQuestionForm({ ...questionForm, [itemForm.id]: { ...(questionForm[itemForm.id] || {}), optionsText: e.target.value } })} />
              <select className="admin-input" value={questionForm[itemForm.id]?.correctIdx ?? ''} onChange={e => setQuestionForm({ ...questionForm, [itemForm.id]: { ...(questionForm[itemForm.id] || {}), correctIdx: e.target.value } })}>
                <option value="">-- Đáp án đúng --</option>
                {(questionForm[itemForm.id]?.optionsText || '').split('\n').map((s, i) => s.trim() ? <option key={i} value={i}>{i + 1}. {s.trim()}</option> : null)}
              </select>
            </>
          ) : (
            <>
              <textarea className="admin-input" style={{ minHeight: 80, whiteSpace: 'pre-wrap' }} placeholder="Đoạn text gốc — điền chỗ trống bằng ____ / đoạn text cần chọn từ" value={questionForm[itemForm.id]?.text_content || ''} onChange={e => setQuestionForm({ ...questionForm, [itemForm.id]: { ...(questionForm[itemForm.id] || {}), text_content: e.target.value } })} />
              <textarea className="admin-input" style={{ minHeight: 54, whiteSpace: 'pre-wrap' }} placeholder={selPracticeType === 'listen_fill' ? 'Đáp án điền (mỗi dòng 1 từ, theo thứ tự)' : 'Các từ đúng cần chọn (mỗi dòng 1 từ)'} value={questionForm[itemForm.id]?.correctText || ''} onChange={e => setQuestionForm({ ...questionForm, [itemForm.id]: { ...(questionForm[itemForm.id] || {}), correctText: e.target.value } })} />
            </>
          )}
          <button className="admin-btn" style={{ alignSelf: 'flex-start' }} onClick={() => saveQuestion(itemForm.id, selPracticeType)}>+ Thêm câu hỏi</button>
        </section>
      )}
    </>
  );

  const renderCourseForm = () => (
    <>
      <b style={{ fontSize: 15, display: 'block', marginBottom: 12 }}>{courseForm.id ? '⚙ Sửa thông tin khóa' : '✨ Khóa học mới'}</b>

      <label className="admin-label">Tên khóa học *</label>
      <input className="admin-input" placeholder="vd: PRONUNCIATION ALL IN ONE" value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} />

      <label className="admin-label">Slug (URL)</label>
      <input className="admin-input" placeholder="Bỏ trống để tự sinh từ tên khóa" value={courseForm.slug} onChange={e => setCourseForm({ ...courseForm, slug: e.target.value })} disabled={!!courseForm.id} />

      <label className="admin-label">Mô tả</label>
      <textarea className="admin-input" style={{ minHeight: 70 }} placeholder="Mô tả ngắn hiển thị ở trang danh sách khóa" value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label className="admin-label">Cấp độ</label>
          <select className="admin-input" value={courseForm.level} onChange={e => setCourseForm({ ...courseForm, level: e.target.value })}>
            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="admin-label">Phân loại</label>
          <input className="admin-input" placeholder="vd: Pronunciation" value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })} />
        </div>
        <div>
          <label className="admin-label">Thời lượng (giờ)</label>
          <input className="admin-input" type="number" value={courseForm.duration_hours} onChange={e => setCourseForm({ ...courseForm, duration_hours: Number(e.target.value) })} />
        </div>
        <div>
          <label className="admin-label">Giảng viên</label>
          <input className="admin-input" value={courseForm.instructor} onChange={e => setCourseForm({ ...courseForm, instructor: e.target.value })} />
        </div>
      </div>

      <label className="admin-label">Quyền truy cập</label>
      <select className="admin-input" value={courseForm.access_type} onChange={e => setCourseForm({ ...courseForm, access_type: e.target.value })}>
        {ACCESS_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </select>

      <label className="admin-label">Ảnh bìa khóa</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="admin-btn" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {uploading === 'courseThumb' ? 'Đang upload...' : (courseForm.thumbnail ? '📁 Đổi ảnh' : '📁 Chọn ảnh')}
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'courseThumb')} />
        </label>
        {courseForm.thumbnail && (
          <>
            <img src={courseForm.thumbnail} alt="" style={{ height: 44, borderRadius: 8, border: '1px solid var(--line)' }} />
            <button className="admin-btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setCourseForm({ ...courseForm, thumbnail: '' })}>Bỏ ảnh</button>
          </>
        )}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink)', margin: '14px 0' }}>
        <input type="checkbox" checked={courseForm.is_published} onChange={e => setCourseForm({ ...courseForm, is_published: e.target.checked })} />
        Xuất bản khóa học (học viên thấy được)
      </label>

      <div style={{ display: 'flex', gap: 8 }}>
        <button className="admin-btn" onClick={saveCourse} disabled={savingCourse}>{savingCourse ? 'Đang lưu...' : '💾 Lưu khóa học'}</button>
        <button className="admin-btn-ghost" onClick={() => { setPanel(null); setCourseForm(null); setEditorExpanded(false); }}>Đóng</button>
      </div>
    </>
  );

  return (
    <div className="admin-panel">
      <h3>Cấu trúc khóa học</h3>
      <p className="admin-note" style={{ marginBottom: 14 }}>
        Kéo thả ⠿ để sắp xếp module và bài học · ＋ Thêm bài học tạo nhanh bản nháp · ⧉ nhân bản bài (kèm từ vựng/câu hỏi)
      </p>

      {/* Toolbar */}
      <div className="cs-toolbar">
        <select className="admin-input" style={{ flex: 1, minWidth: 200 }} value={courseId} onChange={e => { setCourseId(e.target.value); setPanel(null); setSelectedItemId(null); }}>
          <option value="">-- Chọn khóa học --</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}{c.is_published === false ? ' (nháp)' : ''}</option>)}
        </select>
        <button className="admin-btn" onClick={openNewCourse}>+ Khóa học mới</button>
        <button className="admin-btn-ghost" onClick={openEditCourse} disabled={!courseId}>⚙ Thông tin khóa</button>
      </div>

      {courseId ? (
        <div className="cs-layout">
          {/* ===== Cột trái: Curriculum ===== */}
          <div className="cs-curriculum">
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="admin-input" style={{ flex: 1 }} placeholder="Tên module mới (vd: VOWELS 1 - /i:/)" value={modTitle} onChange={e => setModTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addModule()} />
              <button className="admin-btn" onClick={addModule}>+ Module</button>
            </div>

            {modules.length === 0 && items.length === 0 && (
              <div className="cs-empty">
                <div style={{ fontSize: 34, marginBottom: 8 }}>📚</div>
                <b>Khóa này chưa có nội dung</b>
                <p style={{ fontSize: 13, margin: '6px 0 0' }}>Tạo module đầu tiên ở trên, hoặc bấm "+ Module".</p>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDragCancel={() => { setActiveId(null); setActiveType(null); if (snapshotRef.current) setGroups(snapshotRef.current); }}
            >
              <SortableContext items={moduleKeys} strategy={verticalListSortingStrategy}>
                {modules.map(mod => {
                  const key = mod.id;
                  const list = groups[key] || [];
                  return (
                    <SortableModule
                      key={key}
                      mod={mod}
                      count={list.length}
                      open={isModOpen(key)}
                      onToggle={() => setOpenMods(prev => ({ ...prev, [key]: !isModOpen(key) }))}
                      onRename={renaming?.id === key ? {
                        title: renaming.title,
                        onChange: (v) => setRenaming({ ...renaming, title: v }),
                        onSave: saveModuleRename,
                        onCancel: () => setRenaming(null),
                      } : null}
                      onStartRename={() => setRenaming({ id: key, title: mod.title })}
                      onDelete={() => setConfirmDel({ type: 'module', id: key })}
                    >
                      <SortableContext items={list.map(i => i.id)} strategy={verticalListSortingStrategy}>
                        {list.map(it => (
                          <SortableItem
                            key={it.id}
                            item={it}
                            active={it.id === selectedItemId}
                            onSelect={openItemEditor}
                            onDuplicate={duplicateItem}
                            onDelete={(x) => setConfirmDel({ type: 'item', id: x.id })}
                            duplicating={duplicating === it.id}
                          />
                        ))}
                      </SortableContext>
                      <button className="cs-add" disabled={quickAdding === key} onClick={() => quickAdd(key)}>
                        {quickAdding === key ? 'Đang tạo...' : '＋ Thêm bài học'}
                      </button>
                    </SortableModule>
                  );
                })}
              </SortableContext>

              {hasLoose && (
                <div className="cs-mod">
                  <div className="cs-mod-head" style={{ cursor: 'default' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)', flex: 1 }}>📦 Chưa phân nhóm</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{groups[LOOSE_KEY].length} bài</span>
                  </div>
                  <div className="cs-items">
                    <SortableContext items={groups[LOOSE_KEY].map(i => i.id)} strategy={verticalListSortingStrategy}>
                      {groups[LOOSE_KEY].map(it => (
                        <SortableItem
                          key={it.id}
                          item={it}
                          active={it.id === selectedItemId}
                          onSelect={openItemEditor}
                          onDuplicate={duplicateItem}
                          onDelete={(x) => setConfirmDel({ type: 'item', id: x.id })}
                          duplicating={duplicating === it.id}
                        />
                      ))}
                    </SortableContext>
                  </div>
                </div>
              )}

              <DragOverlay>
                {activeId && activeType === 'item' ? (
                  (() => {
                    const it = items.find(i => i.id === activeId);
                    if (!it) return null;
                    return (
                      <div className="cs-item-row dragging" style={{ width: 300 }}>
                        <Icon.Dots size={15} style={{ color: 'var(--muted)' }} />
                        <span style={{ fontSize: 14 }}>{typeMeta(it.item_type).icon}</span>
                        <span className="cs-item-title">{it.title}</span>
                      </div>
                    );
                  })()
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>

          {/* ===== Cột phải: Editor panel ===== */}
          <div className={`cs-editor${editorExpanded ? ' cs-editor-full' : ''}`}>
            {panel && (
              <div className="cs-editor-bar">
                <span className="admin-note" style={{ flex: 1 }}>
                  {editorExpanded ? '🖥 Chế độ toàn màn hình — Esc để thoát' : ''}
                </span>
                <button className="admin-btn-ghost" onClick={() => setEditorExpanded(x => !x)}
                  title={editorExpanded ? 'Thu nhỏ (Esc)' : 'Soạn ở màn hình lớn'}>
                  {editorExpanded ? '⤡ Thu nhỏ' : '⤢ Mở rộng'}
                </button>
              </div>
            )}
            {panel === 'course' && courseForm ? renderCourseForm()
              : panel === 'item' && itemForm ? (
                <>
                  {renderItemForm()}
                  {itemForm.item_type === 'practice' && renderPracticeManager()}
                </>
              ) : (
                <div className="cs-empty" style={{ padding: '60px 20px' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>👈</div>
                  <b>Chọn một bài học để chỉnh sửa</b>
                  <p style={{ fontSize: 13, margin: '8px auto 0', maxWidth: 340 }}>
                    Bấm vào tên bài ở cột bên trái. Hoặc "＋ Thêm bài học" trong module để tạo bài mới ngay lập tức.
                  </p>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="cs-empty">
          <div style={{ fontSize: 34, marginBottom: 8 }}>🎓</div>
          <b>Hãy chọn một khóa học</b>
          <p style={{ fontSize: 13, margin: '6px 0 0' }}>Hoặc bấm "+ Khóa học mới" để tạo khóa từ đầu.</p>
        </div>
      )}

      {/* Gán vai trò giáo viên */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
        <h3>Gán vai trò giáo viên</h3>
        <p className="admin-note" style={{ marginBottom: 12 }}>Giáo viên được vào trang "Chấm bài phát âm" để nghe và chấm lại bài học viên gửi.</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input className="admin-input" style={{ flex: 1 }} placeholder="Tìm theo email / tên..." value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()} />
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
        <div className="cs-confirm">
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
