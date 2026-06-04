import { describe, it, expect } from 'vitest';
import { getHolidays } from '../components/Calendar/bulgarianHolidays';

describe('getHolidays', () => {
  it('includes all fixed holidays for 2025', () => {
    const h = getHolidays(2025);
    expect(h['2025-01-01']).toBe("New Year's Day");
    expect(h['2025-03-03']).toBe('Liberation Day');
    expect(h['2025-05-01']).toBe('Labour Day');
    expect(h['2025-05-06']).toBe("St. George's Day");
    expect(h['2025-05-24']).toBe('Education & Culture Day');
    expect(h['2025-09-06']).toBe('Unification Day');
    expect(h['2025-09-22']).toBe('Independence Day');
    expect(h['2025-11-01']).toBe('National Revival Day');
    expect(h['2025-12-24']).toBe('Christmas Eve');
    expect(h['2025-12-25']).toBe('Christmas Day');
    expect(h['2025-12-26']).toBe('Christmas Day (2nd day)');
  });

  it('includes Orthodox Easter and surrounding days for 2025', () => {
    // Orthodox Easter 2025: April 20
    const h = getHolidays(2025);
    expect(h['2025-04-18']).toBe('Good Friday');
    expect(h['2025-04-19']).toBe('Holy Saturday');
    expect(h['2025-04-20']).toBe('Easter Sunday');
    expect(h['2025-04-21']).toBe('Easter Monday');
  });

  it('includes Orthodox Easter days for 2026', () => {
    // Orthodox Easter 2026: April 12
    const h = getHolidays(2026);
    expect(h['2026-04-10']).toBe('Good Friday');
    expect(h['2026-04-12']).toBe('Easter Sunday');
    expect(h['2026-04-13']).toBe('Easter Monday');
  });

  it('creates substitute Monday when a fixed holiday falls on Sunday', () => {
    // In 2025, Labour Day (May 1) is a Thursday — no substitute needed
    // In 2026, Labour Day (May 1) is a Friday — no substitute needed
    // Find a year where a fixed holiday is on Sunday and check the substitute
    // Liberation Day (Mar 3) in 2024 is a Sunday
    const h = getHolidays(2024);
    expect(h['2024-03-04']).toBe('Liberation Day (substitute)');
  });

  it('returns an object (not undefined) for any valid year', () => {
    expect(typeof getHolidays(2000)).toBe('object');
    expect(typeof getHolidays(2099)).toBe('object');
  });
});
