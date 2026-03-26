'use client';

import { useEffect, useState } from 'react';
import TaskTracker from '@/components/TaskTracker';
import FunnelCounter from '@/components/FunnelCounter';
import ChatInterface from '@/components/ChatInterface';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem('yoda_session_id');
  if (!sessionId) {
    sessionId = 'vlad_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem('yoda_session_id', sessionId);
  }
  return sessionId;
}

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'funnel'>('chat');

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  if (!sessionId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ fontFamily: 'Space Mono, monospace', color: '#00ff41', fontSize: '0.8rem' }}>
          INITIALIZING...
        </span>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <div className="app-title">◉ YODA COACH</div>
          <div className="app-subtitle">ACCOUNTABILITY SYSTEM v1</div>
        </div>
        <div style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', color: '#003d0f', textAlign: 'right' }}>
          <div>APRIL KPI</div>
          <div style={{ color: '#00ff41' }}>100 SIGNUPS</div>
        </div>
      </header>

      {/* Desktop: all panels visible. Mobile: tab navigation */}
      <div className="desktop-layout">
        <FunnelCounter sessionId={sessionId} />
        <TaskTracker sessionId={sessionId} />
        <ChatInterface sessionId={sessionId} />
      </div>

      <div className="mobile-layout">
        <div className="tab-nav">
          {(['chat', 'tasks', 'funnel'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab === 'chat' ? '◉ YODA' : tab === 'tasks' ? '☐ TASKS' : '▲ KPI'}
            </button>
          ))}
        </div>

        {activeTab === 'funnel' && <FunnelCounter sessionId={sessionId} />}
        {activeTab === 'tasks' && <TaskTracker sessionId={sessionId} />}
        {activeTab === 'chat' && <ChatInterface sessionId={sessionId} />}
      </div>

      <style jsx>{`
        .desktop-layout {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .mobile-layout {
          display: none;
        }

        .tab-nav {
          display: flex;
          gap: 2px;
          margin-bottom: 10px;
        }

        .tab-btn {
          flex: 1;
          padding: 8px 4px;
          background: #050f05;
          border: 1px solid #003d0f;
          color: #008822;
          font-family: 'Space Mono', monospace;
          font-size: 0.65rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          border-radius: 3px;
          transition: all 0.15s;
          outline: none;
        }

        .tab-btn.active {
          background: #003d0f;
          border-color: #00ff41;
          color: #00ff41;
        }

        @media (max-width: 640px) {
          .desktop-layout {
            display: none;
          }

          .mobile-layout {
            display: flex;
            flex-direction: column;
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
