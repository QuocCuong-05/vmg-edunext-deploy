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
      const h = el.style.height;
      if (w || h) updateAttributes({ width: w, height: h });
    });
    observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, [updateAttributes]);

  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: 'center', margin: '14px 0' }}>
      <img
        ref={ref}
        src={node.attrs.src}
        alt={node.attrs.alt || ''}
        style={{
          maxWidth: '100%', resize: 'both', overflow: 'hidden', borderRadius: 12,
          outline: selected ? '2px solid var(--red)' : '2px solid transparent',
          outlineOffset: 2,
          width: node.attrs.width || undefined,
          height: node.attrs.height || undefined,
        }}
      />
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
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

export default ResizableImage;
