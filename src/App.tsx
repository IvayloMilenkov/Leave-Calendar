import { useState, useEffect, useSyncExternalStore } from 'react';
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

  // On first load, replace localStorage days with the authoritative Supabase data
  useEffect(() => {
    const myDays: Record<string, 'planned' | 'approved'> = {};
    for (const d of teamLeaveDays) {
      if (d.user_id === user?.id) myDays[d.date] = d.status;
    }
    dispatch({ type: 'SET_LEAVE_DAYS', payload: myDays });
  }, []);

  const [displayYear, setDisplayYear] = useState(yearMode);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (yearMode !== displayYear && !leaving) setLeaving(true);
  }, [yearMode, displayYear, leaving]);

  function handleAnimEnd(e: React.AnimationEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || !leaving) return;
    setDisplayYear(yearMode);
    setLeaving(false);
  }

  return (
    <div className={`${styles.card} ${displayYear ? styles.cardWide : styles.cardCarousel}`}>
      <Header />
      <LeaveCounter />
      <CalendarNav />
      <div
        key={String(displayYear)}
        className={[
          styles.viewWrapper,
          leaving
            ? (yearMode ? styles.viewLeaveToYear : styles.viewLeaveToMonth)
            : (displayYear ? styles.viewEnterYear : styles.viewEnterMonth),
        ].join(' ')}
        onAnimationEnd={handleAnimEnd}
      >
        {displayYear ? <YearView /> : isMobile ? <CalendarGrid /> : <MonthCarousel />}
      </div>
    </div>
  );
}

function AppInner() {
  const { user, loading: authLoading } = useAuth();
  const { team, loading: teamLoading } = useTeam();

  const [joinCode] = useState<string | undefined>(
    () => new URLSearchParams(window.location.search).get('join') ?? undefined
  );

  useEffect(() => {
    if (joinCode) window.history.replaceState({}, '', window.location.pathname);
  }, []);

  if (authLoading || teamLoading) return null;
  if (!user) return <LoginPage />;
  if (!team) return <TeamSetup initialCode={joinCode} />;
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
