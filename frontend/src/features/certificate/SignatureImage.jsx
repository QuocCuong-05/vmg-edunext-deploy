import { useEffect, useRef } from 'react';

export default function SignatureImage({ src, height, style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      const w = img.naturalWidth;
      const h = img.naturalHeight;

      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

        if (brightness > 160) {
          data[i + 3] = 0;
        } else {
          data[i] = 26;
          data[i + 1] = 26;
          data[i + 2] = 26;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };
    img.src = src;
  }, [src]);

  const h = height || 45;

  return (
    <canvas
      ref={canvasRef}
      style={{ height: h, width: 'auto', display: 'block', imageRendering: 'auto', ...style }}
    />
  );
}
