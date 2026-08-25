import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Node, mergeAttributes } from '@tiptap/core';
import { TextStyle, Color, FontSize, BackgroundColor } from '@tiptap/extension-text-style';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import ResizableImage from './ResizableImage.jsx';
import { useRef, useState, useEffect } from 'react';
import { api } from '../../lib/api';

const TEXT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
const BG_COLORS = ['#fde68a', '#fecaca', '#bbf7d0', '#bfdbfe', '#e9d5ff'];
const FONT_SIZES = ['12px', '13px', '14px', '15px', '16px', '18px', '20px', '22px', '24px', '28px', '32px'];

const AudioNode = Node.create({
  name: 'audio',
  group: 'block',
  atom: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'audio' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['audio', mergeAttributes(HTMLAttributes, { controls: 'true', style: 'width:100%;max-width:520px;' })];
  },
  addCommands() {
    return {
      setAudio: (src) => ({ commands }) => commands.insertContent({ type: 'audio', attrs: { src } }),
    };
  },
});

const TOOL = (label, onClick, active = false, title = '') => (
  <button
    key={label}
    type="button"
    title={title || label}
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
  const audioRef = useRef(null);
  const [colorOpen, setColorOpen] = useState(false);
  const [tableOpen, setTableOpen] = useState(false);
  const [tableCfg, setTableCfg] = useState({ rows: 3, cols: 3 });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ResizableImage,
      AudioNode,
      TextStyle,
      Color,
      FontSize,
      BackgroundColor,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
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

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    if (!colorOpen && !tableOpen) return;
    const close = (e) => {
      if (!e.target.closest?.('.re-pop') && !e.target.closest?.('[data-color-btn]') && !e.target.closest?.('[data-table-btn]')) {
        setColorOpen(false);
        setTableOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [colorOpen, tableOpen]);

  if (!editor) return null;

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Nhập link (https://...) — xóa trắng rồi OK để GỠ link:', prev || 'https://');
    if (url === null) return;
    if (!url.trim()) { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const curColor = editor.getAttributes('textStyle').color || '';
  const curBg = editor.getAttributes('textStyle').backgroundColor || '';
  const curSize = editor.getAttributes('textStyle').fontSize || '';

  const insertTable = () => {
    if (!editor) return;
    const rows = Math.min(10, Math.max(1, Number(tableCfg.rows) || 3));
    const cols = Math.min(10, Math.max(1, Number(tableCfg.cols) || 3));
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setTableOpen(false);
  };

  const handleUpload = async (file) => {
    if (!editor || !file) return;
    try {
      const res = await api.cms.upload(file);
      const url = res?.url || res;
      editor.chain().focus().setResizableImage({ src: url }).run();
    } catch (err) {
      alert('Upload ảnh thất bại: ' + err.message);
    }
  };

  const handleAudioUpload = async (file) => {
    if (!editor || !file) return;
    try {
      const res = await api.admin.uploadAudio(file);
      const url = res?.url || res;
      editor.chain().focus().setAudio(url).run();
    } catch (err) {
      alert('Upload audio thất bại: ' + err.message);
    }
  };

  const swatchRow = (label, colors, current, setCmd, unsetCmd) => (
    <div className="re-pop-row">
      <span className="re-pop-label">{label}</span>
      {colors.map(c => (
        <button
          key={c} type="button"
          className={`re-swatch${current.toLowerCase() === c.toLowerCase() ? ' active' : ''}`}
          style={{ background: c }} title={c}
          onMouseDown={e => { e.preventDefault(); setCmd(c); }}
        />
      ))}
      <span className="re-custom" title="Màu tùy chọn">
        <input type="color" value={current || '#000000'} onChange={e => setCmd(e.target.value)} />
      </span>
      <button type="button" className="re-reset" onMouseDown={e => { e.preventDefault(); unsetCmd(); }}>
        Mặc định
      </button>
    </div>
  );

  return (
    <div style={{ border: '1px solid var(--line)', borderRadius: 12, overflow: 'visible', background: 'var(--card)' }}>
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', padding: '6px 8px', borderBottom: '1px solid var(--line)', background: 'var(--surface-hover)', borderRadius: '12px 12px 0 0', position: 'relative' }}>
        {TOOL('↺', () => editor.chain().focus().undo().run(), false, 'Hoàn tác')}
        {TOOL('↻', () => editor.chain().focus().redo().run(), false, 'Làm lại')}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        {TOOL('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), 'In đậm')}
        {TOOL('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), 'In nghiêng')}
        {TOOL('U', () => editor.chain().focus().toggleUnderline().run(), editor.isActive('underline'), 'Gạch chân')}
        {TOOL('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), 'Gạch ngang chữ')}
        {TOOL('</>', () => editor.chain().focus().toggleCode().run(), editor.isActive('code'), 'Code / phiên âm')}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        {TOOL('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }), 'Tiêu đề lớn')}
        {TOOL('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }), 'Tiêu đề nhỏ')}
        {TOOL('• List', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
        {TOOL('1. List', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        <AlignBtn align="left" editor={editor} />
        <AlignBtn align="center" editor={editor} />
        <AlignBtn align="right" editor={editor} />
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        <select
          className="re-select"
          value={FONT_SIZES.includes(curSize) ? curSize : ''}
          title="Cỡ chữ"
          onChange={e => {
            const v = e.target.value;
            if (v) editor.chain().focus().setFontSize(v).run();
            else editor.chain().focus().unsetFontSize().run();
          }}
        >
          <option value="">Aa</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{parseInt(s, 10)}px</option>)}
        </select>
        <button
          type="button" data-color-btn
          title="Màu chữ & màu nền"
          onMouseDown={e => { e.preventDefault(); setColorOpen(o => !o); }}
          style={{
            border: 'none', background: colorOpen ? 'var(--red-bg)' : 'none', color: 'var(--ink)',
            borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 3,
          }}
        >
          🎨<span style={{ fontSize: 9, fontWeight: 800 }}>▾</span>
        </button>
        {TOOL('❝ Quote', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
        {TOOL('―', () => editor.chain().focus().setHorizontalRule().run(), false, 'Gạch ngang phân cách')}
        <span style={{ width: 1, background: 'var(--line)', margin: '4px 6px' }} />
        {TOOL('🖼 Ảnh', () => fileRef.current?.click(), false, 'Chèn ảnh')}
        {TOOL('🎵 Audio', () => audioRef.current?.click(), false, 'Chèn audio')}
        <button
          type="button" data-table-btn
          title="Chèn bảng"
          onMouseDown={e => { e.preventDefault(); setTableOpen(o => !o); setColorOpen(false); }}
          style={{
            border: 'none', background: tableOpen || editor.isActive('table') ? 'var(--red-bg)' : 'none', color: 'var(--ink)',
            borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 3,
          }}
        >
          ⊞<span style={{ fontSize: 9, fontWeight: 800 }}>▾</span>
        </button>
        {editor.isActive('table') && (
          <>
            {TOOL('🗑', () => editor.chain().focus().deleteTable().run(), false, 'Xóa bảng')}
            <span style={{ flexBasis: '100%', height: 0 }} />
            <span className="re-tbl-tools">
              {TOOL('◀ Cột', () => editor.chain().focus().addColumnBefore().run(), false, 'Thêm cột bên trái')}
              {TOOL('Cột ▶', () => editor.chain().focus().addColumnAfter().run(), false, 'Thêm cột bên phải')}
              {TOOL('✕ Cột', () => editor.chain().focus().deleteColumn().run(), false, 'Xóa cột')}
              {TOOL('▲ Dòng', () => editor.chain().focus().addRowBefore().run(), false, 'Thêm dòng bên trên')}
              {TOOL('Dòng ▼', () => editor.chain().focus().addRowAfter().run(), false, 'Thêm dòng bên dưới')}
              {TOOL('✕ Dòng', () => editor.chain().focus().deleteRow().run(), false, 'Xóa dòng')}
              {TOOL('▦ Gộp', () => editor.chain().focus().mergeCells().run(), false, 'Gộp ô')}
              {TOOL('⬚ Tách', () => editor.chain().focus().splitCell().run(), false, 'Tách ô')}
              {TOOL('🔝 Header', () => editor.chain().focus().toggleHeaderRow().run(), false, 'Bật/tắt hàng tiêu đề')}
            </span>
          </>
        )}
        {TOOL('✕Định dạng', () => editor.chain().focus().unsetAllMarks().clearNodes().run(), false, 'Xóa định dạng vùng chọn')}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { handleUpload(e.target.files?.[0]); e.target.value = ''; }}
        />
        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          style={{ display: 'none' }}
          onChange={e => { handleAudioUpload(e.target.files?.[0]); e.target.value = ''; }}
        />

        {colorOpen && (
          <div className="re-pop">
            {swatchRow('Chữ', TEXT_COLORS, curColor,
              c => editor.chain().focus().setColor(c).run(),
              () => editor.chain().focus().unsetColor().run())}
            {swatchRow('Nền', BG_COLORS, curBg,
              c => editor.chain().focus().setBackgroundColor(c).run(),
              () => editor.chain().focus().unsetBackgroundColor().run())}
          </div>
        )}

        {tableOpen && (
          <div className="re-pop">
            <div className="re-pop-title">Chèn bảng</div>
            <div className="re-pop-row">
              <span className="re-pop-label">Hàng</span>
              <input type="number" min="1" max="10" className="re-num" value={tableCfg.rows}
                onChange={e => setTableCfg(prev => ({ ...prev, rows: e.target.value }))} />
              <span className="re-pop-label">Cột</span>
              <input type="number" min="1" max="10" className="re-num" value={tableCfg.cols}
                onChange={e => setTableCfg(prev => ({ ...prev, cols: e.target.value }))} />
            </div>
            <button type="button" className="admin-btn" style={{ alignSelf: 'stretch' }}
              onMouseDown={e => { e.preventDefault(); insertTable(); }}>
              ⊞ Chèn bảng
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: '12px 14px' }}>
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
