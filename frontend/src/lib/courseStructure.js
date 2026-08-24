const SUFFIX_RE = /^(.*?)\s*-\s*(VIDEO LESSON|LESSON|PRACTICE\s*\d+)\s*$/i;

export function hasSoundStructure(items) {
  return (items || []).some(it => SUFFIX_RE.test(it.title || ''));
}

export function groupSounds(items) {
  const map = new Map();
  (items || []).forEach(it => {
    const m = SUFFIX_RE.exec(it.title || '');
    const key = m ? m[1].trim() : (it.title || '').trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(it);
  });
  return [...map.entries()]
    .map(([title, its]) => ({ title, items: its.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) }))
    .sort((a, b) => (a.items[0]?.sort_order || 0) - (b.items[0]?.sort_order || 0));
}

export function findModule(course, moduleId) {
  return (course?.modules || []).find(m => m.id === moduleId) || null;
}

export function findLesson(course, lessonId) {
  return (course?.lessons || []).find(l => l.id === lessonId) || null;
}

export function soundContext(course, lessonId) {
  const lesson = findLesson(course, lessonId);
  if (!lesson) return null;
  const module_ = findModule(course, lesson.module_id);
  const moduleTitle = module_?.title || null;
  if (module_ && hasSoundStructure(module_.items)) {
    const sounds = groupSounds(module_.items);
    const sound = sounds.find(s => s.items.some(it => it.id === lessonId)) || null;
    const soundNo = sound ? sounds.indexOf(sound) + 1 : null;
    return { moduleId: module_.id, moduleTitle, sound, soundNo, sounds };
  }
  return { moduleId: module_.id, moduleTitle, sound: null, soundNo: null, sounds: [] };
}