'use client';

import { useEffect, useState } from 'react';
import { fetchFunnel, upsertFunnel, Funnel } from '@/lib/supabase';

interface FunnelCounterProps {
  sessionId: string;
}

const SIGNUP_GOAL = 100;

export default function FunnelCounter({ sessionId }: FunnelCounterProps) {
  const [funnel, setFunnel] = useState<Funnel>({
    session_id: sessionId,
    replies: 0,
    dms: 0,
    signups: 0,
  });

  useEffect(() => {
    if (!sessionId) return;
    fetchFunnel(sessionId).then((data) => {
      if (data) setFunnel(data);
      else setFunnel({ session_id: sessionId, replies: 0, dms: 0, signups: 0 });
    });
  }, [sessionId]);

  const increment = async (field: 'replies' | 'dms' | 'signups') => {
    const updated = { ...funnel, [field]: funnel[field] + 1 };
    setFunnel(updated);
    await upsertFunnel(updated);
  };

  const progress = Math.min((funnel.signups / SIGNUP_GOAL) * 100, 100);

  return (
    <div className="funnel-counter">
      <div className="funnel-header">
        <span className="section-label">APRIL KPI — 100 SIGNUPS</span>
      </div>

      <div className="funnel-stats">
        {(['replies', 'dms', 'signups'] as const).map((field) => (
          <div key={field} className="funnel-stat">
            <span className="stat-label">{field.toUpperCase()}</span>
            <span className="stat-value">{funnel[field]}</span>
            <button
              onClick={() => increment(field)}
              className="increment-btn"
              aria-label={`Increment ${field}`}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="progress-bar-container">
        <div className="progress-label">
          <span>SIGNUPS</span>
          <span>{funnel.signups} / {SIGNUP_GOAL}</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
