import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, type TeamRow, type TeamMemberRow, type LeaveDayRow, type LeaveStatus } from '../lib/supabase';
import { useAuth } from './AuthContext';

const MEMBER_COLORS = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
];

const ACTIVE_TEAM_KEY = 'leave-calendar-active-team';

interface TeamContextValue {
  team: TeamRow | null;
  allTeams: TeamRow[];
  members: TeamMemberRow[];
  myColor: string;
  teamLeaveDays: LeaveDayRow[];
  loading: boolean;
  activeTeamId: string | null;
  createTeam: (name: string) => Promise<void>;
  joinTeam: (inviteCode: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  updateMyColor: (color: string) => Promise<void>;
  updateMyDisplayName: (name: string) => Promise<void>;
  updateTeamName: (name: string) => Promise<void>;
  regenerateInviteCode: () => Promise<void>;
  syncLeaveDay: (date: string, status: LeaveStatus | null) => Promise<void>;
  selectTeam: (id: string) => Promise<void>;
  clearActiveTeam: () => void;
}

const TeamContext = createContext<TeamContextValue | null>(null);

function displayNameFor(user: User): string | null {
  return user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? null;
}

export function TeamProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allTeams, setAllTeams] = useState<TeamRow[]>([]);
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [teamLeaveDays, setTeamLeaveDays] = useState<LeaveDayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTeamId, setActiveTeamIdRaw] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_TEAM_KEY),
  );

  const myColor = members.find(m => m.user_id === user?.id)?.color ?? MEMBER_COLORS[0];

  const loadTeamData = useCallback(async (teamId: string) => {
    const [
      { data: teamData, error: teamError },
      { data: membersData, error: membersError },
      { data: leaveData, error: leaveError },
    ] = await Promise.all([
      supabase.from('teams').select('*').eq('id', teamId).single(),
      supabase.from('team_members').select('*').eq('team_id', teamId),
      supabase.from('leave_days').select('*').eq('team_id', teamId),
    ]);
    if (teamError) throw teamError;
    if (membersError) throw membersError;
    if (leaveError) throw leaveError;
    setTeam(teamData ?? null);
    setMembers(membersData ?? []);
    setTeamLeaveDays(leaveData ?? []);
  }, []);

  const loadAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);

    try {
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);

      if (!memberships?.length) {
        setAllTeams([]);
        setTeam(null);
        setMembers([]);
        setTeamLeaveDays([]);
        return;
      }

      const { data: teamsData } = await supabase
        .from('teams')
        .select('*')
        .in('id', memberships.map(m => m.team_id));

      const teams = teamsData ?? [];
      setAllTeams(teams);

      const storedId = localStorage.getItem(ACTIVE_TEAM_KEY);
      const validStored = storedId ? teams.find(t => t.id === storedId) : null;

      let targetId: string | null = null;
      if (validStored) {
        targetId = validStored.id;
      } else if (teams.length === 1) {
        targetId = teams[0].id as string;
        localStorage.setItem(ACTIVE_TEAM_KEY, targetId);
        setActiveTeamIdRaw(targetId);
      }

      if (targetId) {
        await loadTeamData(targetId);
      } else {
        setTeam(null);
        setMembers([]);
        setTeamLeaveDays([]);
      }
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, loadTeamData]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime subscriptions for the active team
  useEffect(() => {
    if (!team) return;

    const leaveSub = supabase
      .channel(`leave:${team.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leave_days', filter: `team_id=eq.${team.id}` },
        () => { loadTeamData(team.id).catch(console.error); })
      .subscribe();

    const memberSub = supabase
      .channel(`members:${team.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${team.id}` },
        () => { loadTeamData(team.id).catch(console.error); })
      .subscribe();

    return () => {
      supabase.removeChannel(leaveSub);
      supabase.removeChannel(memberSub);
    };
  }, [team, loadTeamData]);

  async function selectTeam(id: string) {
    localStorage.setItem(ACTIVE_TEAM_KEY, id);
    setActiveTeamIdRaw(id);
    await loadTeamData(id);
  }

  function clearActiveTeam() {
    localStorage.removeItem(ACTIVE_TEAM_KEY);
    setActiveTeamIdRaw(null);
    setTeam(null);
    setMembers([]);
    setTeamLeaveDays([]);
  }

  async function createTeam(name: string) {
    if (!user) return;
    const invite_code = Math.random().toString(36).slice(2, 10);
    const { data: newTeam, error } = await supabase
      .from('teams')
      .insert({ name, owner_id: user.id, invite_code })
      .select()
      .single();
    if (error || !newTeam) throw error;

    const display_name = displayNameFor(user);
    await supabase.from('team_members').insert({
      team_id: newTeam.id, user_id: user.id, color: MEMBER_COLORS[0], display_name,
    });
    setAllTeams(prev => [...prev, newTeam]);
    await selectTeam(newTeam.id);
  }

  async function joinTeam(inviteCode: string) {
    if (!user) return;
    const { data: rows, error } = await supabase
      .rpc('find_team_by_invite_code', { code: inviteCode.trim() });
    if (error) throw error;
    const found = rows?.[0] ?? null;
    if (!found) throw new Error('Team not found — check the invite code.');

    const alreadyMember = allTeams.find(t => t.id === found.id);
    if (alreadyMember) { await selectTeam(found.id); return; }

    const { data: existingMembers } = await supabase
      .from('team_members')
      .select('color')
      .eq('team_id', found.id);

    const usedColors = new Set((existingMembers ?? []).map(m => m.color));
    const color = MEMBER_COLORS.find(c => !usedColors.has(c)) ?? MEMBER_COLORS[0];

    const display_name = displayNameFor(user);
    await supabase.from('team_members').insert({ team_id: found.id, user_id: user.id, color, display_name });
    setAllTeams(prev => [...prev, found]);
    await selectTeam(found.id);
  }

  async function leaveTeam() {
    if (!user || !team) return;
    const { error } = await supabase
      .from('team_members').delete().eq('team_id', team.id).eq('user_id', user.id);
    if (error) throw error;
    await supabase.from('leave_days').delete().eq('team_id', team.id).eq('user_id', user.id);
    const remaining = allTeams.filter(t => t.id !== team.id);
    setAllTeams(remaining);
    if (remaining.length === 1) {
      await selectTeam(remaining[0].id);
    } else {
      clearActiveTeam();
    }
  }

  async function removeMember(userId: string) {
    if (!team) return;
    await supabase.from('team_members').delete().eq('team_id', team.id).eq('user_id', userId);
    setMembers(prev => prev.filter(m => m.user_id !== userId));
    setTeamLeaveDays(prev => prev.filter(d => d.user_id !== userId));
  }

  async function updateMyColor(color: string) {
    if (!user || !team) return;
    await supabase.from('team_members').update({ color }).eq('team_id', team.id).eq('user_id', user.id);
    setMembers(prev => prev.map(m => m.user_id === user.id ? { ...m, color } : m));
  }

  async function updateMyDisplayName(name: string) {
    if (!user || !team) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await supabase.from('team_members').update({ display_name: trimmed }).eq('team_id', team.id).eq('user_id', user.id);
    setMembers(prev => prev.map(m => m.user_id === user.id ? { ...m, display_name: trimmed } : m));
  }

  async function updateTeamName(name: string) {
    if (!team || !user) return;
    if (user.id !== team.owner_id) throw new Error('Only the team owner can rename the team.');
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data } = await supabase.from('teams').update({ name: trimmed }).eq('id', team.id).select().single();
    if (data) {
      setTeam(data);
      setAllTeams(prev => prev.map(t => t.id === team.id ? data : t));
    }
  }

  async function regenerateInviteCode() {
    if (!team || !user) return;
    if (user.id !== team.owner_id) throw new Error('Only the team owner can regenerate the invite code.');
    const newCode = Math.random().toString(36).slice(2, 10);
    const { data } = await supabase.from('teams').update({ invite_code: newCode }).eq('id', team.id).select().single();
    if (data) {
      setTeam(data);
      setAllTeams(prev => prev.map(t => t.id === team.id ? data : t));
    }
  }

  async function syncLeaveDay(date: string, status: LeaveStatus | null) {
    if (!user || !team) return;
    if (status === null) {
      const { error } = await supabase
        .from('leave_days').delete().eq('user_id', user.id).eq('team_id', team.id).eq('date', date);
      if (error) throw error;
      setTeamLeaveDays(prev => prev.filter(d => !(d.user_id === user.id && d.date === date)));
    } else {
      const { data, error } = await supabase.from('leave_days')
        .upsert({ user_id: user.id, team_id: team.id, date, status }, { onConflict: 'user_id,team_id,date' })
        .select().single();
      if (error) throw error;
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
      team, allTeams, members, myColor, teamLeaveDays, loading, activeTeamId,
      createTeam, joinTeam, leaveTeam, removeMember,
      updateMyColor, updateMyDisplayName, updateTeamName, regenerateInviteCode, syncLeaveDay, selectTeam, clearActiveTeam,
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
