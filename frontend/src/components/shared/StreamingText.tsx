'use client';

import { useEffect, useState } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // ms per character
  onDone?: () => void;
  onActivityClick?: (activityId: string) => void;
}

// Parse text to find activity IDs like A1010, B2030, C5010 etc.
function parseActivityIds(text: string): Array<{ type: 'text' | 'activity'; content: string }> {
  const parts: Array<{ type: 'text' | 'activity'; content: string }> = [];
  const regex = /\b([A-C]\d{4})\b/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'activity', content: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }
  return parts;
}

export default function StreamingText({ text, speed = 12, onDone, onActivityClick }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) return;

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onDone]);

  const parts = parseActivityIds(displayed);

  return (
    <span>
      {parts.map((part, i) =>
        part.type === 'activity' && onActivityClick ? (
          <button
            key={i}
            onClick={() => onActivityClick(part.content)}
            className="font-mono text-[var(--blue-primary)] hover:underline cursor-pointer bg-[var(--blue-light)] px-1 rounded text-xs"
          >
            {part.content}
          </button>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
      {!done && <span className="animate-pulse">▋</span>}
    </span>
  );
}
