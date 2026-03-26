# Yoda Coach

Direct, no-fluff accountability coach for Vlad. Built on Next.js + Anthropic + Supabase.

**April KPI: 100 free EasyTask signups by April 30.**

## Features

- AI chat powered by Claude (Anthropic)
- Persistent memory via Supabase (last 30 messages per session)
- 15 task pills with day labels, toggleable and synced to Supabase
- Funnel counter (replies / DMs / signups) with progress bar
- Voice input via Web Speech API
- Voice output via SpeechSynthesis API
- Dark terminal aesthetic (dark green on black, Space Mono + DM Sans)
- Mobile responsive PWA

---

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then open the **SQL Editor** and run:

```sql
create table conversations (
  id uuid default gen_random_uuid() primary key,
  session_id text,
  role text,
  content text,
  created_at timestamp default now()
);

create table task_state (
  session_id text,
  task_id int,
  done boolean default false,
  primary key (session_id, task_id)
);

create table funnel (
  session_id text primary key,
  replies int default 0,
  dms int default 0,
  signups int default 0
);
```

### 2. Get your Supabase credentials

From your Supabase project dashboard → **Settings → API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Get your Anthropic API key

Go to [console.anthropic.com](https://console.anthropic.com), create an API key.

### 4. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
```

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 5. Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

1. Push repo to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) → **New Project** → import `vladnature/yoda-coach`
3. Add environment variables in Vercel dashboard:
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Next.js

---

## Supabase Row Level Security (optional but recommended)

After creating the tables, you can enable RLS and add a policy to allow all operations (since the app uses a session ID stored in localStorage — no auth):

```sql
alter table conversations enable row level security;
alter table task_state enable row level security;
alter table funnel enable row level security;

create policy "Allow all" on conversations for all using (true);
create policy "Allow all" on task_state for all using (true);
create policy "Allow all" on funnel for all using (true);
```

---

## Architecture

```
app/
  page.tsx          — Main page, session management, tab navigation
  layout.tsx        — HTML shell, metadata, PWA tags
  globals.css       — All styles (dark terminal aesthetic)
  api/
    chat/route.ts   — Anthropic API proxy, Yoda system prompt

components/
  ChatInterface.tsx — Messages, voice input/output, send
  TaskTracker.tsx   — 15 task pills, Supabase sync
  FunnelCounter.tsx — Replies/DMs/Signups + progress bar

lib/
  supabase.ts       — Supabase client + typed helpers
```

---

## Week 1 Schedule

| Day | Tasks |
|-----|-------|
| Mon | Get EasyTask link · Set up boards · KPI commit to Daisuke · Stripe to Payhip |
| Tue | Post MRI thread · EasyTask screenshot · Door-knock sprint 1 |
| Wed | Reply to engagement · Post r/vibecoding · Door-knock sprint 2 |
| Thu | Before/after EasyTask thread · Door-knock sprint 3 |
| Fri | Count funnel · Message Daisuke · Score channels 0–100 |

---

Built by Vlad with Yoda watching.
