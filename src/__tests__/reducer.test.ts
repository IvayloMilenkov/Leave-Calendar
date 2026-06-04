import { describe, it, expect } from 'vitest';
import { reducer, nextLeaveStatus, type AppState } from '../context/reducer';

const base: AppState = {
  config: { totalAllowanceDays: 20 },
  leaveDays: {},
  ui: { viewYear: 2025, viewMonth: 6, viewMode: 'month' },
};

// ── nextLeaveStatus ───────────────────────────────────────────────────────────

describe('nextLeaveStatus', () => {
  it('undefined → planned', () => expect(nextLeaveStatus(undefined)).toBe('planned'));
  it('planned → approved', () => expect(nextLeaveStatus('planned')).toBe('approved'));
  it('approved → null', () => expect(nextLeaveStatus('approved')).toBeNull());
});

// ── TOGGLE_LEAVE_DAY ──────────────────────────────────────────────────────────

describe('TOGGLE_LEAVE_DAY', () => {
  it('sets a blank day to planned', () => {
    const s = reducer(base, { type: 'TOGGLE_LEAVE_DAY', payload: '2025-06-10' });
    expect(s.leaveDays['2025-06-10']).toBe('planned');
  });

  it('advances planned → approved', () => {
    const s = reducer(
      { ...base, leaveDays: { '2025-06-10': 'planned' } },
      { type: 'TOGGLE_LEAVE_DAY', payload: '2025-06-10' },
    );
    expect(s.leaveDays['2025-06-10']).toBe('approved');
  });

  it('clears approved → removes the key', () => {
    const s = reducer(
      { ...base, leaveDays: { '2025-06-10': 'approved' } },
      { type: 'TOGGLE_LEAVE_DAY', payload: '2025-06-10' },
    );
    expect('2025-06-10' in s.leaveDays).toBe(false);
  });

  it('does not mutate other days', () => {
    const init: AppState = { ...base, leaveDays: { '2025-06-11': 'approved' } };
    const s = reducer(init, { type: 'TOGGLE_LEAVE_DAY', payload: '2025-06-10' });
    expect(s.leaveDays['2025-06-11']).toBe('approved');
  });
});

// ── SET_LEAVE_DAY ─────────────────────────────────────────────────────────────

describe('SET_LEAVE_DAY', () => {
  it('sets a day to planned', () => {
    const s = reducer(base, { type: 'SET_LEAVE_DAY', payload: { date: '2025-06-10', status: 'planned' } });
    expect(s.leaveDays['2025-06-10']).toBe('planned');
  });

  it('sets a day to approved', () => {
    const s = reducer(base, { type: 'SET_LEAVE_DAY', payload: { date: '2025-06-10', status: 'approved' } });
    expect(s.leaveDays['2025-06-10']).toBe('approved');
  });

  it('removes the day when status is null', () => {
    const init: AppState = { ...base, leaveDays: { '2025-06-10': 'planned' } };
    const s = reducer(init, { type: 'SET_LEAVE_DAY', payload: { date: '2025-06-10', status: null } });
    expect('2025-06-10' in s.leaveDays).toBe(false);
  });

  it('overrides an existing status', () => {
    const init: AppState = { ...base, leaveDays: { '2025-06-10': 'planned' } };
    const s = reducer(init, { type: 'SET_LEAVE_DAY', payload: { date: '2025-06-10', status: 'approved' } });
    expect(s.leaveDays['2025-06-10']).toBe('approved');
  });

  it('does not touch other days', () => {
    const init: AppState = { ...base, leaveDays: { '2025-06-11': 'approved', '2025-06-10': 'planned' } };
    const s = reducer(init, { type: 'SET_LEAVE_DAY', payload: { date: '2025-06-10', status: null } });
    expect(s.leaveDays['2025-06-11']).toBe('approved');
  });
});

// ── SET_LEAVE_DAYS ────────────────────────────────────────────────────────────

describe('SET_LEAVE_DAYS', () => {
  it('replaces all leave days', () => {
    const init: AppState = { ...base, leaveDays: { '2025-01-01': 'planned' } };
    const payload = { '2025-06-10': 'approved' as const };
    const s = reducer(init, { type: 'SET_LEAVE_DAYS', payload });
    expect(s.leaveDays).toEqual(payload);
  });

  it('sets to empty map when payload is {}', () => {
    const init: AppState = { ...base, leaveDays: { '2025-01-01': 'planned' } };
    const s = reducer(init, { type: 'SET_LEAVE_DAYS', payload: {} });
    expect(s.leaveDays).toEqual({});
  });
});

// ── CLEAR_ALL ─────────────────────────────────────────────────────────────────

describe('CLEAR_ALL', () => {
  it('retains approved days', () => {
    const init: AppState = { ...base, leaveDays: { '2025-06-10': 'approved', '2025-06-11': 'planned' } };
    const s = reducer(init, { type: 'CLEAR_ALL' });
    expect(s.leaveDays['2025-06-10']).toBe('approved');
  });

  it('removes planned days', () => {
    const init: AppState = { ...base, leaveDays: { '2025-06-11': 'planned' } };
    const s = reducer(init, { type: 'CLEAR_ALL' });
    expect('2025-06-11' in s.leaveDays).toBe(false);
  });
});

// ── SET_ALLOWANCE ─────────────────────────────────────────────────────────────

describe('SET_ALLOWANCE', () => {
  it('updates totalAllowanceDays', () => {
    const s = reducer(base, { type: 'SET_ALLOWANCE', payload: 25 });
    expect(s.config.totalAllowanceDays).toBe(25);
  });
});
