'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Lead } from '@/lib/leads-fetcher';

const SOURCE_LABELS: Record<Lead['source'], string> = {
  reddit: 'REDDIT',
  hackernews: 'HN',
  devto: 'DEV.TO',
};

const SOURCE_COLORS: Record<Lead['source'], string> = {
  reddit: '#ff4500',
  hackernews: '#ff6600',
  devto: '#3b49df',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.floor(diff / 60000)}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Filter = 'all' | Lead['source'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads ?? []);
      setFetchedAt(data.fetchedAt ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadLeads(); }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadLeads();
  }

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.source === filter);

  const counts = {
    all: leads.length,
    reddit: leads.filter((l) => l.source === 'reddit').length,
    hackernews: leads.filter((l) => l.source === 'hackernews').length,
    devto: leads.filter((l) => l.source === 'devto').length,
  };

  return (
    <div className="leads-page">
      <header className="leads-header">
        <div className="leads-title-row">
          <Link href="/" className="back-link">← YODA</Link>
          <h1 className="leads-title">◉ HELP SEEKERS FEED</h1>
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            {refreshing ? '⟳ …' : '⟳ REFRESH'}
          </button>
        </div>
        <p className="leads-subtitle">
          People on Reddit · HN · Dev.to who need help with vibe coding, project management,
          freelancing &amp; solopreneurship — updated daily.
        </p>
        {fetchedAt && (
          <p className="leads-meta">Last fetch: {new Date(fetchedAt).toLocaleString()}</p>
        )}
      </header>

      <div className="filter-bar">
        {(['all', 'reddit', 'hackernews', 'devto'] as const).map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'ALL' : SOURCE_LABELS[f]} ({counts[f]})
          </button>
        ))}
      </div>

      <main className="leads-list">
        {loading && (
          <div className="leads-loading">
            <span className="blink">█</span> Scanning feeds…
          </div>
        )}

        {error && !loading && (
          <div className="leads-error">ERROR: {error}</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="leads-empty">No leads found for this filter. Try refreshing.</div>
        )}

        {filtered.map((lead) => (
          <article key={lead.id} className="lead-card">
            <div className="lead-card-top">
              <span
                className="lead-source"
                style={{ color: SOURCE_COLORS[lead.source] }}
              >
                [{SOURCE_LABELS[lead.source]}
                {lead.subreddit ? ` · r/${lead.subreddit}` : ''}]
              </span>
              <span className="lead-time">{timeAgo(lead.createdAt)}</span>
            </div>

            <a href={lead.url} target="_blank" rel="noopener noreferrer" className="lead-title">
              {lead.title}
            </a>

            {lead.excerpt && lead.excerpt !== lead.title && (
              <p className="lead-excerpt">{lead.excerpt}</p>
            )}

            <div className="lead-footer">
              <span className="lead-author">{lead.author}</span>
              {lead.score !== undefined && (
                <span className="lead-score">▲ {lead.score}</span>
              )}
              <div className="lead-keywords">
                {lead.matchedKeywords.slice(0, 4).map((kw) => (
                  <span key={kw} className="keyword-tag">{kw}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </main>

      <style>{`
        .leads-page {
          min-height: 100vh;
          background: #000;
          color: #00ff41;
          font-family: 'Space Mono', monospace;
          padding: 24px 16px;
          max-width: 860px;
          margin: 0 auto;
        }
        .leads-header { margin-bottom: 20px; }
        .leads-title-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        .back-link {
          color: #00ff41;
          text-decoration: none;
          font-size: 12px;
          opacity: 0.7;
          white-space: nowrap;
        }
        .back-link:hover { opacity: 1; }
        .leads-title {
          font-size: clamp(14px, 3vw, 18px);
          margin: 0;
          flex: 1;
          letter-spacing: 2px;
        }
        .refresh-btn {
          background: none;
          border: 1px solid #00ff41;
          color: #00ff41;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          padding: 4px 10px;
          cursor: pointer;
          letter-spacing: 1px;
          white-space: nowrap;
        }
        .refresh-btn:hover:not(:disabled) { background: #00ff4120; }
        .refresh-btn:disabled { opacity: 0.4; cursor: default; }
        .leads-subtitle {
          font-size: 11px;
          color: #00ff4199;
          margin: 0 0 4px;
          line-height: 1.5;
        }
        .leads-meta {
          font-size: 10px;
          color: #00ff4155;
          margin: 0;
        }
        .filter-bar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .filter-btn {
          background: none;
          border: 1px solid #00ff4155;
          color: #00ff4199;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          padding: 4px 10px;
          cursor: pointer;
          letter-spacing: 1px;
          transition: all 0.1s;
        }
        .filter-btn:hover, .filter-btn.active {
          border-color: #00ff41;
          color: #00ff41;
          background: #00ff4115;
        }
        .leads-list { display: flex; flex-direction: column; gap: 12px; }
        .leads-loading, .leads-error, .leads-empty {
          font-size: 13px;
          padding: 24px 0;
          color: #00ff4188;
        }
        .leads-error { color: #ff4141; }
        .lead-card {
          border: 1px solid #00ff4133;
          padding: 12px 14px;
          background: #00080000;
          transition: border-color 0.15s;
        }
        .lead-card:hover { border-color: #00ff4177; }
        .lead-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
          gap: 8px;
        }
        .lead-source {
          font-size: 10px;
          letter-spacing: 1px;
          font-weight: bold;
        }
        .lead-time {
          font-size: 10px;
          color: #00ff4155;
          white-space: nowrap;
        }
        .lead-title {
          display: block;
          color: #00ff41;
          text-decoration: none;
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .lead-title:hover { text-decoration: underline; }
        .lead-excerpt {
          font-size: 11px;
          color: #00ff4188;
          margin: 0 0 8px;
          line-height: 1.5;
          font-family: 'DM Sans', sans-serif;
        }
        .lead-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .lead-author {
          font-size: 10px;
          color: #00ff4166;
        }
        .lead-score {
          font-size: 10px;
          color: #00ff4166;
        }
        .lead-keywords {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-left: auto;
        }
        .keyword-tag {
          font-size: 9px;
          padding: 2px 6px;
          border: 1px solid #00ff4133;
          color: #00ff4188;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .blink {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (max-width: 600px) {
          .leads-title-row { flex-direction: column; align-items: flex-start; }
          .lead-keywords { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}
