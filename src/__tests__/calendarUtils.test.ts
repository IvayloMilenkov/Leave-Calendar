import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildCalendarGrid, isWeekend, isToday, monthName } from '../components/Calendar/calendarUtils';

afterEach(() => vi.useRealTimers());

// ── buildCalendarGrid ─────────────────────────────────────────────────────────

describe('buildCalendarGrid', () => {
  it('starts on Monday (no leading nulls for a Monday-starting month)', () => {
    // June 2025 starts on Sunday → Monday offset = 6 leading nulls
    const cells = buildCalendarGrid(2025, 6);
    expect(cells[0]).toBeNull();
    expect(cells.filter(c => c === null).slice(0, 1)).toHaveLength(1);
  });

  it('contains all days of the month as date strings', () => {
    const cells = buildCalendarGrid(2025, 6);
    const dates = cells.filter(Boolean) as string[];
    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe('2025-06-01');
    expect(dates[29]).toBe('2025-06-30');
  });

  it('total length is a multiple of 7', () => {
    for (const month of [1, 2, 3, 6, 12]) {
      expect(buildCalendarGrid(2025, month).length % 7).toBe(0);
    }
  });

  it('handles February in a leap year', () => {
    const cells = buildCalendarGrid(2024, 2);
    const dates = cells.filter(Boolean) as string[];
    expect(dates).toHaveLength(29);
    expect(dates[28]).toBe('2024-02-29');
  });

  it('handles February in a non-leap year', () => {
    const cells = buildCalendarGrid(2025, 2);
    expect(cells.filter(Boolean)).toHaveLength(28);
  });

  it('pads the grid end with nulls so length % 7 === 0', () => {
    const cells = buildCalendarGrid(2025, 3);
    expect(cells.length % 7).toBe(0);
    const lastNonNull = cells.findLastIndex(c => c !== null);
    expect(cells.slice(lastNonNull + 1).every(c => c === null)).toBe(true);
  });
});

// ── isWeekend ─────────────────────────────────────────────────────────────────

describe('isWeekend', () => {
  it('returns true for Sunday', () => expect(isWeekend('2025-06-01')).toBe(true));
  it('returns true for Saturday', () => expect(isWeekend('2025-05-31')).toBe(true));
  it('returns false for Monday', () => expect(isWeekend('2025-06-02')).toBe(false));
  it('returns false for Friday', () => expect(isWeekend('2025-06-06')).toBe(false));
});

// ── isToday ───────────────────────────────────────────────────────────────────

describe('isToday', () => {
  it('returns true for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isToday(today)).toBe(true);
  });

  it('returns false for yesterday', () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    expect(isToday(d.toISOString().slice(0, 10))).toBe(false);
  });
});

// ── monthName ─────────────────────────────────────────────────────────────────

describe('monthName', () => {
  it('returns January for month 1', () => expect(monthName(1)).toBe('January'));
  it('returns December for month 12', () => expect(monthName(12)).toBe('December'));
  it('returns June for month 6', () => expect(monthName(6)).toBe('June'));
});
