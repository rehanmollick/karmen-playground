'use client';

import StreamingText from '../shared/StreamingText';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onActivityClick?: (id: string) => void;
}

export default function ChatMessage({ message, onActivityClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 ${
          isUser
            ? 'bg-[var(--blue-primary)] text-white'
            : 'bg-[var(--accent-pink-light)] text-[var(--accent-pink)]'
        }`}
      >
        {isUser ? 'U' : 'K'}
      </div>
      <div
        className={`max-w-[85%] px-3 py-2 rounded-[var(--radius-md)] text-sm ${
          isUser
            ? 'bg-[var(--blue-primary)] text-white rounded-tr-sm'
            : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-tl-sm border border-[var(--border-subtle)]'
        }`}
      >
        {message.streaming ? (
          <StreamingText text={message.content} onActivityClick={isUser ? undefined : onActivityClick} />
        ) : (
          <span>{message.content}</span>
        )}
      </div>
    </div>
  );
}
