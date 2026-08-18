import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import ResizableImage from './ResizableImage.jsx';
import { useRef } from 'react';
import { api } from '../../lib/api';

const TOOL = (label, onClick, active = false) => (
  <button
    key={label}
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick(); }}
    style={{
      border: 'none', background: active ? 'var(--red-bg)' : 'none', color: active ? 'var(--red)' : 'var(--ink)',
      borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    }}
  >
    {label}
  </button>
);

const AlignIcon = ({ align }) => {
  const lines =
    align === 'left'   ? [{ x1: 2, x2: 16 }, { x1: 2, x2: 12 }, { x1: 2, x2: 14 }]
    : align === 'right' ? [{ x1: 2, x2: 16 }, { x1: 6, x2: 16 }, { x1: 4, x2: 16 }]
    :                      [{ x1: 2, x2: 16 }, { x1: 4, x2: 14 }, { x1: 5, x2: 13 }];
  return (
    <svg width="14" height="14" viewBox="0 0 18 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {lines.map((l, i) => <line key={i} x1={l.x1} y1={2 + i * 6} x2={l.x2} y2={2 + i * 6} />)}
    </svg>
  );
};

const AlignBtn = ({ align, editor }) => (
  <button
    key={'align-' + align}
    type="button"
    title={`Căn ${align === 'center' ? 'giữa' : align === 'left' ? 'trái' : 'phải'}`}
    onMouseDown={e => { e.preventDefault(); editor.chain().focus().setTextAlign(align).run(); }}
    style={{
      border: 'none', background: editor.isActive({ textAlign: align }) ? 'var(--red-bg)' : 'none',
      color: editor.isActive({ textAlign: align }) ? 'var(--red)' : 'var(--ink)',
      borderRadius: 6, padding: '5px 7px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    }}
  >
    <AlignIcon align={align} />
  </button>
);

export default function RichEditor({ value, onChange, placeholder = 'Soạn nội dung...' }) {
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-area article-content',
        style: 'min-height: 260px; outline: none; font-size: 15px; line-height: 1.85; max-width: 780px; margin: 0 auto;',
      },
    },
  });

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt('Nhập link (https://...)', 'https://');
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleUpload = async (file) => {
    if (!editor || !file) return;
    try {
      const url = await api.cms.upload(file);
      editor.chain().focus().setResizableImage({ src: url }).run();
    } catch (err) {
      alert('Upload ảnh thất bại: ' + err.message);
    }
  };

  if (!editor) return null;

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden', background: 'var(--card)' }}>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', padding: '6px 8px', borderBottom: '1px solid var(--line)', background: 'var(--surface-hover)' }}>
        {TOOL('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
        {TOOL('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
        {TOOL('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'))}
        {TOOL('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        {TOOL('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
        {TOOL('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
        {TOOL('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {TOOL('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        <AlignBtn align="left" editor={editor} />
        <AlignBtn align="center" editor={editor} />
        <AlignBtn align="right" editor={editor} />
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        {TOOL('Link', setLink)}
        {TOOL('❝ Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {TOOL('🖼 Ảnh', () => fileRef.current?.click())}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
      <div style={{ padding: '12px 14px' }}>
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
