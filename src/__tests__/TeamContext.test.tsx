import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { TeamProvider, useTeam } from '../context/TeamContext';

// ── vi.hoisted ensures mock vars are available inside the vi.mock factory ─────

const { fromMock, MOCK_USER } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  MOCK_USER: {
    id: 'user-1',
    email: 'test@example.com',
    user_metadata: { full_name: 'Test User' },
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    auth: {
      onAuthStateChange: (cb: (e: string, s: null) => void) => {
        cb('INITIAL_SESSION', null);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
    channel: () => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  },
}));

// MOCK_USER must be the same reference on every render so that loadAll's
// useCallback dep doesn't change and avoids an infinite re-run loop.
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: MOCK_USER }),
}));

// ── fluent mock builder ───────────────────────────────────────────────────────
// arrayResult: returned when awaiting the chain directly (for list queries)
// singleResult: returned when .single() is called (for single-row queries)

function makeBuilder(
  arrayResult: { data: unknown; error: unknown },
  singleResult = arrayResult,
) {
  const b: Record<string, unknown> = {};
  for (const m of ['select', 'insert', 'update', 'delete', 'upsert', 'eq', 'neq', 'in', 'order']) {
    b[m] = vi.fn(() => b);
  }
  // .single() returns a proper Promise for the single-row result
  b.single = vi.fn(() => Promise.resolve(singleResult));
  // Direct await uses the array result
  b.then  = (res: (v: unknown) => unknown) => Promise.resolve(arrayResult).then(res);
  b.catch = (rej: (v: unknown) => unknown) => Promise.resolve(arrayResult).catch(rej);
  return b;
}

// ── fixtures ──────────────────────────────────────────────────────────────────

const TEAM = { id: 'team-1', name: 'Test Team', invite_code: 'abc', owner_id: 'user-1' };
const MEMBER = { team_id: 'team-1', user_id: 'user-1', color: '#6366f1', display_name: 'Test User' };

// Mocks needed to load one team on mount
function setupLoadAll() {
  fromMock.mockImplementation((table: string) => {
    if (table === 'team_members')
      return makeBuilder({ data: [MEMBER], error: null }, { data: MEMBER, error: null });
    if (table === 'teams')
      return makeBuilder({ data: [TEAM], error: null }, { data: TEAM, error: null });
    if (table === 'leave_days')
      return makeBuilder({ data: [], error: null }, { data: null, error: null });
    return makeBuilder({ data: null, error: null });
  });
}

function wrapper({ children }: { children: ReactNode }) {
  return <TeamProvider>{children}</TeamProvider>;
}

// ── leaveTeam ─────────────────────────────────────────────────────────────────

describe('leaveTeam', () => {
  beforeEach(() => fromMock.mockReset());

  it('deletes from team_members AND leave_days', async () => {
    setupLoadAll();
    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    const deletedTables: string[] = [];
    fromMock.mockImplementation((table: string) => {
      const b = makeBuilder({ data: null, error: null });
      const origDelete = b.delete as ReturnType<typeof vi.fn>;
      b.delete = vi.fn((...args) => {
        deletedTables.push(table);
        return origDelete(...args);
      });
      return b;
    });

    await act(async () => { await result.current.leaveTeam(); });

    expect(deletedTables).toContain('team_members');
    expect(deletedTables).toContain('leave_days');
  });

  it('throws when team_members delete returns an error', async () => {
    setupLoadAll();
    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    fromMock.mockImplementation((table: string) => {
      if (table === 'team_members')
        return makeBuilder({ data: null, error: { message: 'RLS denied', code: '42501' } });
      return makeBuilder({ data: null, error: null });
    });

    // Call without act so the rejection propagates directly
    await expect(result.current.leaveTeam()).rejects.toBeTruthy();
  });
});

// ── regenerateInviteCode ──────────────────────────────────────────────────────

describe('regenerateInviteCode', () => {
  beforeEach(() => fromMock.mockReset());

  it('throws when the current user is not the team owner', async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === 'team_members')
        return makeBuilder({ data: [MEMBER], error: null }, { data: MEMBER, error: null });
      if (table === 'teams')
        return makeBuilder({ data: [{ ...TEAM, owner_id: 'other-user' }], error: null }, { data: { ...TEAM, owner_id: 'other-user' }, error: null });
      if (table === 'leave_days')
        return makeBuilder({ data: [], error: null });
      return makeBuilder({ data: null, error: null });
    });

    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    await expect(result.current.regenerateInviteCode())
      .rejects.toThrow('Only the team owner can regenerate the invite code.');
  });

  it('does not call Supabase update when user is not owner', async () => {
    const updateSpy = vi.fn(() => makeBuilder({ data: null, error: null }));

    fromMock.mockImplementation((table: string) => {
      if (table === 'team_members')
        return makeBuilder({ data: [MEMBER], error: null }, { data: MEMBER, error: null });
      if (table === 'teams') {
        const b = makeBuilder(
          { data: [{ ...TEAM, owner_id: 'other-user' }], error: null },
          { data: { ...TEAM, owner_id: 'other-user' }, error: null },
        );
        b.update = updateSpy;
        return b;
      }
      if (table === 'leave_days') return makeBuilder({ data: [], error: null });
      return makeBuilder({ data: null, error: null });
    });

    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    await result.current.regenerateInviteCode().catch(() => {});

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('succeeds when the current user is the team owner', async () => {
    setupLoadAll();
    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    fromMock.mockImplementation(() =>
      makeBuilder({ data: { ...TEAM, invite_code: 'newcode' }, error: null }),
    );

    await expect(result.current.regenerateInviteCode()).resolves.not.toThrow();
  });
});

// ── loadTeamData error handling ───────────────────────────────────────────────

describe('loadTeamData error propagation', () => {
  beforeEach(() => fromMock.mockReset());

  it('does not leave loading=true when a Supabase query fails on initial load', async () => {
    fromMock.mockImplementation(() =>
      makeBuilder({ data: null, error: { message: 'network error' } }),
    );

    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    expect(result.current.loading).toBe(false);
  });
});

// ── syncLeaveDay error propagation ────────────────────────────────────────────

describe('syncLeaveDay', () => {
  beforeEach(() => fromMock.mockReset());

  it('throws when upsert returns an error', async () => {
    setupLoadAll();
    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    fromMock.mockImplementation(() =>
      makeBuilder(
        { data: null, error: { message: 'upsert failed', code: '23505' } },
        { data: null, error: { message: 'upsert failed', code: '23505' } },
      ),
    );

    await expect(result.current.syncLeaveDay('2025-06-10', 'planned')).rejects.toBeTruthy();
  });

  it('throws when delete returns an error', async () => {
    setupLoadAll();
    const { result } = renderHook(() => useTeam(), { wrapper });
    await act(async () => {});

    fromMock.mockImplementation(() =>
      makeBuilder({ data: null, error: { message: 'delete failed', code: '42501' } }),
    );

    await expect(result.current.syncLeaveDay('2025-06-10', null)).rejects.toBeTruthy();
  });
});
