import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Message {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface TaskState {
  session_id: string;
  task_id: number;
  done: boolean;
}

export interface Funnel {
  session_id: string;
  replies: number;
  dms: number;
  signups: number;
}

export async function fetchMessages(sessionId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(30);
  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return (data as Message[]) || [];
}

export async function saveMessage(message: Message): Promise<void> {
  const { error } = await supabase.from('conversations').insert([message]);
  if (error) console.error('Error saving message:', error);
}

export async function fetchTaskState(sessionId: string): Promise<TaskState[]> {
  const { data, error } = await supabase
    .from('task_state')
    .select('*')
    .eq('session_id', sessionId);
  if (error) {
    console.error('Error fetching task state:', error);
    return [];
  }
  return (data as TaskState[]) || [];
}

export async function upsertTaskState(state: TaskState): Promise<void> {
  const { error } = await supabase.from('task_state').upsert([state]);
  if (error) console.error('Error upserting task state:', error);
}

export async function fetchFunnel(sessionId: string): Promise<Funnel | null> {
  const { data, error } = await supabase
    .from('funnel')
    .select('*')
    .eq('session_id', sessionId)
    .single();
  if (error) {
    if (error.code !== 'PGRST116') console.error('Error fetching funnel:', error);
    return null;
  }
  return data as Funnel;
}

export async function upsertFunnel(funnel: Funnel): Promise<void> {
  const { error } = await supabase.from('funnel').upsert([funnel]);
  if (error) console.error('Error upserting funnel:', error);
}
