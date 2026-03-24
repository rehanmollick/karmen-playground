import { useCallback, useRef, useState } from 'react';

interface UseResizableOptions {
  direction: 'horizontal' | 'vertical';
  initialSize: number; // percentage (0-100)
  minSize?: number;    // percentage
  maxSize?: number;    // percentage
}

export function useResizable({
  direction,
  initialSize,
  minSize = 15,
  maxSize = 85,
}: UseResizableOptions) {
  const [size, setSize] = useState(initialSize);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;

      const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const startSize = size;
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerLength =
        direction === 'horizontal' ? containerRect.width : containerRect.height;

      function onMouseMove(ev: MouseEvent) {
        if (!dragging.current) return;
        const currentPos = direction === 'horizontal' ? ev.clientX : ev.clientY;
        const delta = currentPos - startPos;
        const deltaPercent = (delta / containerLength) * 100;
        const newSize = Math.min(maxSize, Math.max(minSize, startSize + deltaPercent));
        setSize(newSize);
      }

      function onMouseUp() {
        dragging.current = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }

      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [direction, size, minSize, maxSize],
  );

  return { size, containerRef, onMouseDown };
}
