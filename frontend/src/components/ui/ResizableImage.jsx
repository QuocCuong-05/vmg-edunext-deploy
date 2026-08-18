import { useEffect, useRef } from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { Node } from '@tiptap/core';

function ResizableImageView({ node, updateAttributes, selected }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new MutationObserver(() => {
      const w = el.style.width;
      if (w) updateAttributes({ width: w });
    });
    observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [updateAttributes]);

  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
      <div
        ref={ref}
        style={{
          resize: 'horizontal', overflow: 'hidden', display: 'inline-block', lineHeight: 0,
          borderRadius: 12,
          border: selected ? '2px solid var(--red)' : '2px solid transparent',
          width: node.attrs.width || undefined,
          maxWidth: '100%',
        }}
      >
        <img
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          draggable={false}
          style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 10, pointerEvents: 'none' }}
        />
      </div>
    </NodeViewWrapper>
  );
}

const ResizableImage = Node.create({
  name: 'resizableImage',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      width: { default: null },
      height: { default: null },
    };
  },
  parseHTML() {
    return [{ tag: 'img' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes];
  },
  addCommands() {
    return {
      setResizableImage: attrs => ({ commands }) => commands.insertContent({ type: this.name, attrs }),
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
