import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamPicker } from '../components/Team/TeamPicker';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));

vi.mock('../context/TeamContext', () => ({
  useTeam: () => ({
    allTeams: [{ id: '1', name: 'Alpha', invite_code: 'abc123', owner_id: 'u1' }],
    selectTeam: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../components/Team/TeamSetup', () => ({
  TeamSetup: ({ initialCode }: { initialCode?: string }) => (
    <div data-testid="team-setup" data-initial-code={initialCode ?? ''} />
  ),
}));

describe('TeamPicker', () => {
  it('shows team list when no initialCode', () => {
    render(<TeamPicker />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByTestId('team-setup')).toBeNull();
  });

  it('renders TeamSetup immediately when initialCode is provided', () => {
    render(<TeamPicker initialCode="invite99" />);
    expect(screen.getByTestId('team-setup')).toBeInTheDocument();
  });

  it('forwards initialCode to TeamSetup', () => {
    render(<TeamPicker initialCode="invite99" />);
    expect(screen.getByTestId('team-setup').getAttribute('data-initial-code')).toBe('invite99');
  });

  it('shows TeamSetup (without code) when join button is clicked', async () => {
    render(<TeamPicker />);
    await userEvent.click(screen.getByText('+ Join or create another team'));
    expect(screen.getByTestId('team-setup').getAttribute('data-initial-code')).toBe('');
  });
});
