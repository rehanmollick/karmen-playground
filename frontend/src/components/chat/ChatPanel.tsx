'use client';

import { useRef, useEffect, useState } from 'react';
import type { Message } from './ChatMessage';
import ChatMessage from './ChatMessage';
import { api } from '../../lib/api';

interface ChatPanelProps {
  projectId: string;
  onScheduleUpdate?: () => void;
  onActivityClick?: (id: string) => void;
}

export default function ChatPanel({ projectId, onScheduleUpdate, onActivityClick }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "I'm your scheduling assistant. Ask me anything about this project's schedule, or tell me to make changes.",
      streaming: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };

    // Build history from current messages (excluding welcome)
    const history = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const thinkingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: 'assistant', content: '…', streaming: false },
    ]);

    try {
      const result = await api.chat(projectId, text, history) as { type: string; content?: string };
      const isEdit = result?.type === 'edit';
      const responseText = result?.content || (isEdit ? 'Schedule updated.' : 'Done.');

      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { ...m, content: responseText, streaming: true }
            : m
        )
      );

      if (isEdit) {
        onScheduleUpdate?.();
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong. Try again.';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === thinkingId
            ? { ...m, content: errMsg, streaming: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-full border border-[var(--border-default)] rounded-[var(--radius-md)] overflow-hidden bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] flex items-center gap-2">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H8l-3 2V10H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="var(--text-muted)" strokeWidth="1.2" fill="none" />
        </svg>
        <span className="text-xs font-medium text-[var(--text-secondary)]">Chat Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onActivityClick={onActivityClick} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question or request a change..."
            rows={2}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm text-[var(--text-primary)] bg-white border border-[var(--border-default)] rounded-[var(--radius-sm)] resize-none outline-none focus:border-[var(--blue-primary)] transition-colors placeholder:text-[var(--text-muted)] disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 text-sm font-medium text-white rounded-[var(--radius-sm)] transition-all disabled:opacity-50 self-end"
            style={{ backgroundColor: 'var(--blue-primary)' }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
            ) : (
              '↑'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
