'use client';

import { useEffect, useState } from 'react';
import { fetchTaskState, upsertTaskState } from '@/lib/supabase';

interface Task {
  id: number;
  day: string;
  label: string;
}

const TASKS: Task[] = [
  { id: 0, day: 'Mon', label: 'Get EasyTask link from Daisuke' },
  { id: 1, day: 'Mon', label: 'Set up Camp Greece EasyTask board' },
  { id: 2, day: 'Mon', label: 'Set up MRI EasyTask board' },
  { id: 3, day: 'Mon', label: 'Send week 1 KPI commit to Daisuke' },
  { id: 4, day: 'Mon', label: 'Connect Stripe to Payhip' },
  { id: 5, day: 'Tue', label: 'Post MRI story thread on X' },
  { id: 6, day: 'Tue', label: 'Post EasyTask screenshot on X' },
  { id: 7, day: 'Tue', label: 'Door-knock sprint 1 — 15 min' },
  { id: 8, day: 'Wed', label: 'Reply to all X engagement' },
  { id: 9, day: 'Wed', label: 'Post in r/vibecoding' },
  { id: 10, day: 'Wed', label: 'Door-knock sprint 2 — 15 min' },
  { id: 11, day: 'Thu', label: 'Post before/after EasyTask thread' },
  { id: 12, day: 'Thu', label: 'Door-knock sprint 3 — 15 min' },
  { id: 13, day: 'Fri', label: 'Friday KPI report to Daisuke' },
  { id: 14, day: 'Week', label: 'Talk to 3 doctors (MRI)' },
];

const DAY_COLORS: Record<string, string> = {
  Mon: '#00ff41',
  Tue: '#00cc33',
  Wed: '#00aa2a',
  Thu: '#008821',
  Fri: '#006618',
  Week: '#00ff99',
};

interface TaskTrackerProps {
  sessionId: string;
}

export default function TaskTracker({ sessionId }: TaskTrackerProps) {
  const [done, setDone] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!sessionId) return;
    fetchTaskState(sessionId).then((states) => {
      const map: Record<number, boolean> = {};
      states.forEach((s) => { map[s.task_id] = s.done; });
      setDone(map);
    });
  }, [sessionId]);

  const toggle = async (taskId: number) => {
    const newDone = !done[taskId];
    setDone((prev) => ({ ...prev, [taskId]: newDone }));
    await upsertTaskState({ session_id: sessionId, task_id: taskId, done: newDone });
  };

  const completedCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="task-tracker">
      <div className="task-header">
        <span className="section-label">WEEK 1 TASKS</span>
        <span className="task-count">{completedCount}/{TASKS.length}</span>
      </div>
      <div className="task-pills">
        {TASKS.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className={`task-pill ${done[task.id] ? 'done' : ''}`}
            style={{ '--day-color': DAY_COLORS[task.day] } as React.CSSProperties}
          >
            <span className="task-day">[{task.day}]</span>
            <span className="task-label">{task.label}</span>
            {done[task.id] && <span className="task-check">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
