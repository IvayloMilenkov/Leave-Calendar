import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayCell } from '../components/Calendar/DayCell';

// ── stable mocks (module-level) ───────────────────────────────────────────────

const { mockDispatch, mockSyncLeaveDay, mockLeaveDays } = vi.hoisted(() => ({
  mockDispatch: vi.fn(),
  mockSyncLeaveDay: vi.fn(),
  mockLeaveDays: { current: {} as Record<string, 'planned' | 'approved'> },
}));

vi.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    state: { leaveDays: mockLeaveDays.current },
    dispatch: mockDispatch,
  }),
}));

vi.mock('../context/TeamContext', () => ({
  useTeam: () => ({
    team: { id: 'team-1', name: 'Test', invite_code: 'x', owner_id: 'u1' },
    syncLeaveDay: mockSyncLeaveDay,
    myColor: '#6366f1',
  }),
}));

vi.mock('motion/react', () => ({
  motion: {
    button: ({ children, onClick, disabled }: React.ComponentProps<'button'>) => (
      <button onClick={onClick} disabled={disabled}>{children}</button>
    ),
  },
}));

vi.mock('../components/Calendar/DayTooltip', () => ({ DayTooltip: () => null }));

beforeEach(() => {
  mockDispatch.mockClear();
  mockSyncLeaveDay.mockClear();
  mockLeaveDays.current = {};
});

// ── basic toggle ──────────────────────────────────────────────────────────────

describe('DayCell — basic toggle', () => {
  it('dispatches TOGGLE_LEAVE_DAY on click', async () => {
    mockSyncLeaveDay.mockResolvedValue(undefined);
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'TOGGLE_LEAVE_DAY',
      payload: '2025-06-10',
    });
  });

  it('calls syncLeaveDay with planned when day is blank', async () => {
    mockSyncLeaveDay.mockResolvedValue(undefined);
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockSyncLeaveDay).toHaveBeenCalledWith('2025-06-10', 'planned');
  });

  it('calls syncLeaveDay with approved when day is planned', async () => {
    mockSyncLeaveDay.mockResolvedValue(undefined);
    mockLeaveDays.current = { '2025-06-10': 'planned' };
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockSyncLeaveDay).toHaveBeenCalledWith('2025-06-10', 'approved');
  });

  it('calls syncLeaveDay with null when day is approved', async () => {
    mockSyncLeaveDay.mockResolvedValue(undefined);
    mockLeaveDays.current = { '2025-06-10': 'approved' };
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockSyncLeaveDay).toHaveBeenCalledWith('2025-06-10', null);
  });

  it('does not dispatch on weekend', async () => {
    render(<DayCell dateStr="2025-06-07" />); // Saturday
    await userEvent.click(screen.getByRole('button'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('does not dispatch on a holiday', async () => {
    render(<DayCell dateStr="2025-06-10" holidayName="Some Holiday" />);
    await userEvent.click(screen.getByRole('button'));
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});

// ── optimistic rollback ───────────────────────────────────────────────────────

describe('DayCell — rollback on syncLeaveDay failure', () => {
  it('dispatches SET_LEAVE_DAY(null) to roll back a blank→planned optimistic update', async () => {
    mockSyncLeaveDay.mockRejectedValue(new Error('network error'));
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const rollback = mockDispatch.mock.calls.find(c => c[0].type === 'SET_LEAVE_DAY');
      expect(rollback).toBeDefined();
      expect(rollback![0]).toEqual({
        type: 'SET_LEAVE_DAY',
        payload: { date: '2025-06-10', status: null },
      });
    });
  });

  it('dispatches SET_LEAVE_DAY(planned) to roll back a planned→approved optimistic update', async () => {
    mockSyncLeaveDay.mockRejectedValue(new Error('fail'));
    mockLeaveDays.current = { '2025-06-10': 'planned' };
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const rollback = mockDispatch.mock.calls.find(c => c[0].type === 'SET_LEAVE_DAY');
      expect(rollback).toBeDefined();
      expect(rollback![0]).toEqual({
        type: 'SET_LEAVE_DAY',
        payload: { date: '2025-06-10', status: 'planned' },
      });
    });
  });

  it('dispatches TOGGLE before SET_LEAVE_DAY (optimistic-then-rollback order)', async () => {
    mockSyncLeaveDay.mockRejectedValue(new Error('fail'));
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const types = mockDispatch.mock.calls.map(c => c[0].type);
      expect(types.indexOf('TOGGLE_LEAVE_DAY')).toBeLessThan(types.indexOf('SET_LEAVE_DAY'));
    });
  });

  it('does not roll back when syncLeaveDay succeeds', async () => {
    mockSyncLeaveDay.mockResolvedValue(undefined);
    render(<DayCell dateStr="2025-06-10" />);
    await userEvent.click(screen.getByRole('button'));

    await waitFor(() => expect(mockSyncLeaveDay).toHaveBeenCalled());
    const types = mockDispatch.mock.calls.map(c => c[0].type);
    expect(types).not.toContain('SET_LEAVE_DAY');
  });
});
