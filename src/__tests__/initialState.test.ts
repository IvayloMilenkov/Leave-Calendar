import { describe, it, expect } from 'vitest';
import { loadState } from '../context/initialState';

const KEY = 'leave-calendar-v1';

describe('loadState', () => {
  it('returns defaultState when localStorage is empty', () => {
    const s = loadState();
    expect(s.config.totalAllowanceDays).toBe(20);
    expect(s.leaveDays).toEqual({});
    expect(s.ui.viewMode).toBe('month');
  });

  it('returns defaultState when stored JSON is malformed', () => {
    localStorage.setItem(KEY, '{bad json}');
    const s = loadState();
    expect(s.leaveDays).toEqual({});
  });

  it('preserves planned and approved values', () => {
    localStorage.setItem(KEY, JSON.stringify({
      leaveDays: { '2025-06-10': 'planned', '2025-06-11': 'approved' },
    }));
    const s = loadState();
    expect(s.leaveDays['2025-06-10']).toBe('planned');
    expect(s.leaveDays['2025-06-11']).toBe('approved');
  });

  it('drops unknown status values instead of coercing to approved', () => {
    localStorage.setItem(KEY, JSON.stringify({
      leaveDays: { '2025-06-10': 'pending', '2025-06-11': 'rejected', '2025-06-12': 'planned' },
    }));
    const s = loadState();
    expect('2025-06-10' in s.leaveDays).toBe(false);
    expect('2025-06-11' in s.leaveDays).toBe(false);
    expect(s.leaveDays['2025-06-12']).toBe('planned');
  });

  it('does NOT promote unknown values to approved', () => {
    localStorage.setItem(KEY, JSON.stringify({
      leaveDays: { '2025-06-10': 'pending' },
    }));
    const s = loadState();
    expect(s.leaveDays['2025-06-10']).toBeUndefined();
  });

  it('restores config and ui', () => {
    localStorage.setItem(KEY, JSON.stringify({
      config: { totalAllowanceDays: 30 },
      ui: { viewYear: 2026, viewMonth: 3, viewMode: 'year' },
    }));
    const s = loadState();
    expect(s.config.totalAllowanceDays).toBe(30);
    expect(s.ui.viewYear).toBe(2026);
    expect(s.ui.viewMonth).toBe(3);
    expect(s.ui.viewMode).toBe('year');
  });
});
