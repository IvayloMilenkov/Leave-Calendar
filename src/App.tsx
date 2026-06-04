import { useState, useEffect, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TeamProvider, useTeam } from './context/TeamContext';
import { CalendarGrid } from './components/Calendar/CalendarGrid';
import { Header } from './components/Header/Header';
import { LeaveCounter } from './components/LeaveCounter/LeaveCounter';
import { CalendarNav } from './components/Calendar/CalendarNav';
import { MonthCarousel } from './components/Calendar/MonthCarousel';
import { YearView } from './components/Calendar/YearView';
import { LoginPage } from './components/Auth/LoginPage';
import { TeamSetup } from './components/Team/TeamSetup';
import { TeamPicker } from './components/Team/TeamPicker';
import styles from './App.module.css';

const mobileQuery = window.matchMedia('(max-width: 599px)');
function useIsMobile() {
  return useSyncExternalStore(
    cb => { mobileQuery.addEventListener('change', cb); return () => mobileQuery.removeEventListener('change', cb); },
    () => mobileQuery.matches,
  );
}

function CalendarView() {
  const { state, dispatch } = useAppContext();
  const { teamLeaveDays } = useTeam();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const yearMode = state.ui.viewMode === 'year';

  // Sync authoritative Supabase data into local state whenever teamLeaveDays loads/changes.
  useEffect(() => {
    const myDays: Record<string, 'planned' | 'approved'> = {};
    for (const d of teamLeaveDays) {
      if (d.user_id === user?.id) myDays[d.date] = d.status;
    }
    dispatch({ type: 'SET_LEAVE_DAYS', payload: myDays });
  }, [teamLeaveDays]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`${styles.card} ${yearMode ? styles.cardWide : styles.cardCarousel}`}>
      <Header />
      <LeaveCounter />
      <CalendarNav />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={yearMode ? 'year' : 'month'}
          initial={{ opacity: 0, scale: yearMode ? 1.04 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: yearMode ? 0.96 : 1.04 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {yearMode ? <YearView /> : isMobile ? <CalendarGrid /> : <MonthCarousel />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function AppInner() {
  const { user, loading: authLoading } = useAuth();
  const { team, allTeams, loading: teamLoading } = useTeam();

  const [joinCode] = useState<string | undefined>(
    () => new URLSearchParams(window.location.search).get('join') ?? undefined
  );

  useEffect(() => {
    if (joinCode) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  if (authLoading || teamLoading) return null;
  if (!user) return <LoginPage />;
  if (allTeams.length === 0) return <TeamSetup initialCode={joinCode} />;
  if (!team) return <TeamPicker initialCode={joinCode} />;
  return <CalendarView />;
}

export default function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <AppProvider>
          <AppInner />
        </AppProvider>
      </TeamProvider>
    </AuthProvider>
  );
}
