import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
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

export default function RichEditor({ value, onChange, placeholder = 'Soạn nội dung...' }) {
  const fileRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'rich-editor-area',
        style: 'min-height: 260px; outline: none; font-size: 14px; line-height: 1.7;',
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
      editor.chain().focus().setImage({ src: url }).run();
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
