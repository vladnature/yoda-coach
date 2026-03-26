'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'kodo_messages';
const MAX_STORED = 50;

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const persist = (msgs: Message[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED)));
    } catch {}
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    persist(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const assistantMsg: Message = { role: 'assistant', content: data.reply };
      const withReply = [...updated, assistantMsg];
      setMessages(withReply);
      persist(withReply);
    } catch {
      const errMsg: Message = { role: 'assistant', content: 'Error reaching Kodo. Check your API key.' };
      const withErr = [...updated, errMsg];
      setMessages(withErr);
      persist(withErr);
    } finally {
      setLoading(false);
    }
  }, [loading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (!ready) return null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">◉ KODO</div>
        <div className="app-subtitle">ACCOUNTABILITY COACH</div>
      </header>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty-state">
            <p>Kodo is ready. What do you need?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="message-prefix">
              {msg.role === 'user' ? '> YOU' : '◉ KODO'}
            </span>
            <p className="message-content">{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="message assistant">
            <span className="message-prefix">◉ KODO</span>
            <p className="message-content blinking">▋</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="input-area">
        <div className="input-row">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type here... (Enter to send)"
            className="chat-input"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="send-btn"
            aria-label="Send"
          >
            ▶
          </button>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="clear-btn">
            CLEAR HISTORY
          </button>
        )}
      </div>
    </div>
  );
}
