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
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!sessionId) return;
    fetchMessages(sessionId).then((msgs) => setMessages(msgs));
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 0.85;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, []);

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
      speak(data.reply);
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
  }, [loading, messages, sessionId, speak]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
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
          <button
            onClick={startListening}
            className={`voice-btn ${listening ? 'active' : ''}`}
            aria-label={listening ? 'Stop listening' : 'Start voice input'}
            title={listening ? 'Stop listening' : 'Speak'}
          >
            {listening ? '⏹' : '🎙'}
          </button>

          {speaking && (
            <button
              onClick={stopSpeaking}
              className="stop-btn"
              aria-label="Stop speaking"
              title="Stop Yoda"
            >
              🔇
            </button>
          )}

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
