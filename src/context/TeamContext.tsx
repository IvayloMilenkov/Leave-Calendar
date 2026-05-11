import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import { supabase, type TeamRow, type TeamMemberRow, type LeaveDayRow, type LeaveStatus } from '../lib/supabase';
import { useAuth } from './AuthContext';

const MEMBER_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

interface TeamContextValue {
  team: TeamRow | null;
  members: TeamMemberRow[];
  myColor: string;
  teamLeaveDays: LeaveDayRow[];
  loading: boolean;
  createTeam: (name: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMyColor: (color: string) => Promise<void>;
  regenerateInviteCode: () => Promise<void>;
  syncLeaveDay: (date: string, status: LeaveStatus | null) => Promise<void>;
}

const TeamContext = createContext<TeamContextValue | null>(null);

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [teamLeaveDays, setTeamLeaveDays] = useState<LeaveDayRow[]>([]);
  const [loading, setLoading] = useState(true);

  const myColor = members.find(m => m.user_id === user?.id)?.color ?? MEMBER_COLORS[0];

  const loadTeam = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!membership) { setTeam(null); setMembers([]); setLoading(false); return; }

    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', membership.team_id)
      .single();

    const { data: membersData } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', membership.team_id);

    const { data: leaveData } = await supabase
      .from('leave_days')
      .select('*')
      .eq('team_id', membership.team_id);

    setTeam(teamData ?? null);
    setMembers(membersData ?? []);
    setTeamLeaveDays(leaveData ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  // Real-time subscriptions
  useEffect(() => {
    if (!team) return;

    const leaveSub = supabase
      .channel(`leave:${team.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_days', filter: `team_id=eq.${team.id}` },
        () => { loadTeam(); })
      .subscribe();

    const memberSub = supabase
      .channel(`members:${team.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${team.id}` },
        () => { loadTeam(); })
      .subscribe();

    return () => {
      supabase.removeChannel(leaveSub);
      supabase.removeChannel(memberSub);
    };
  }, [team, loadTeam]);

  async function createTeam(name: string) {
    if (!user) return;
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({ name, owner_id: user.id })
      .select()
      .single();
    if (error || !newTeam) throw error;

    const color = MEMBER_COLORS[0];
    const display_name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null;
    await supabase.from('team_members').insert({ team_id: newTeam.id, user_id: user.id, color, display_name });
    await loadTeam();
  }

  async function joinTeam(inviteCode: string) {
    if (!user) return;
    const { data: rows, error } = await supabase
      .rpc('find_team_by_invite_code', { code: inviteCode.trim() });
    if (error) throw error;
    const found = rows?.[0] ?? null;
    if (!found) throw new Error('Team not found — check the invite code.');

    const { data: existingMembers } = await supabase
      .from('team_members')
      .select('color')
      .eq('team_id', found.id);

    const usedColors = new Set((existingMembers ?? []).map(m => m.color));
    const color = MEMBER_COLORS.find(c => !usedColors.has(c)) ?? MEMBER_COLORS[0];

    const display_name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null;
    await supabase.from('team_members').insert({ team_id: found.id, user_id: user.id, color, display_name });
    await loadTeam();
  }

  async function leaveTeam() {
    if (!user || !team) return;
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', user.id);
    setTeam(null); setMembers([]); setTeamLeaveDays([]);
  }

  async function removeMember(userId: string) {
    if (!team) return;
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', userId);
    await loadTeam();
  }

  async function updateMyColor(color: string) {
    if (!user || !team) return;
    await supabase.from('team_members').update({ color }).eq('team_id', team.id).eq('user_id', user.id);
    setMembers(prev => prev.map(m => m.user_id === user.id ? { ...m, color } : m));
  }

  async function regenerateInviteCode() {
    if (!team) return;
    const newCode = Math.random().toString(36).slice(2, 10);
    const { data } = await supabase.from('teams').update({ invite_code: newCode }).eq('id', team.id).select().single();
    if (data) setTeam(data);
  }

  async function syncLeaveDay(date: string, status: LeaveStatus | null) {
    if (!user || !team) return;
    if (status === null) {
      await supabase.from('leave_days').delete().eq('user_id', user.id).eq('team_id', team.id).eq('date', date);
      setTeamLeaveDays(prev => prev.filter(d => !(d.user_id === user.id && d.date === date)));
    } else {
      const { data } = await supabase.from('leave_days')
        .upsert({ user_id: user.id, team_id: team.id, date, status }, { onConflict: 'user_id,team_id,date' })
        .select().single();
      if (data) {
        setTeamLeaveDays(prev => {
          const filtered = prev.filter(d => !(d.user_id === user.id && d.date === date));
          return [...filtered, data];
        });
      }
    }
  }

  return (
    <TeamContext.Provider value={{
      team, members, myColor, teamLeaveDays, loading,
      createTeam, joinTeam, leaveTeam, removeMember,
      updateMyColor, regenerateInviteCode, syncLeaveDay,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext);
  if (!ctx) throw new Error('useTeam must be used within TeamProvider');
  return ctx;
}
