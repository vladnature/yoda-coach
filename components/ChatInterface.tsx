'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { fetchMessages, saveMessage, Message } from '@/lib/supabase';

interface ChatInterfaceProps {
  sessionId: string;
}

export default function ChatInterface({ sessionId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetchMessages(sessionId).then((msgs) => setMessages(msgs));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { session_id: sessionId, role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    await saveMessage(userMsg);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      const assistantMsg: Message = {
        session_id: sessionId,
        role: 'assistant',
        content: data.reply,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage(assistantMsg);
    } catch (err) {
      console.error(err);
      const errMsg: Message = {
        session_id: sessionId,
        role: 'assistant',
        content: 'Error reaching Yoda. Check your API key and try again.',
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.length === 0 && !loading && (
          <div className="empty-state">
            <span className="empty-icon">▸</span>
            <p>Yoda is ready. What do you need?</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <span className="message-prefix">
              {msg.role === 'user' ? '> VLAD' : '◉ YODA'}
            </span>
            <p className="message-content">{msg.content}</p>
          </div>
        ))}
        {loading && (
          <div className="message assistant loading">
            <span className="message-prefix">◉ YODA</span>
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
            placeholder="Talk to Yoda... (Enter to send)"
            className="chat-input"
            rows={2}
            disabled={loading}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="send-btn"
            aria-label="Send message"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
}
