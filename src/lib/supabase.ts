import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export type LeaveStatus = 'planned' | 'approved';

export interface TeamRow {
  id: string;
  name: string;
  invite_code: string;
  owner_id: string;
}

export interface TeamMemberRow {
  team_id: string;
  user_id: string;
  color: string;
  profile?: { display_name: string; email: string };
}

export interface LeaveDayRow {
  id: string;
  user_id: string;
  team_id: string;
  date: string;
  status: LeaveStatus;
}
