import { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Header } from './components/Header/Header';
import { LeaveCounter } from './components/LeaveCounter/LeaveCounter';
import { CalendarNav } from './components/Calendar/CalendarNav';
import { MonthCarousel } from './components/Calendar/MonthCarousel';
import { YearView } from './components/Calendar/YearView';
import styles from './App.module.css';

function AppInner() {
  const { state } = useAppContext();
  const yearMode = state.ui.viewMode === 'year';

  const [displayYear, setDisplayYear] = useState(yearMode);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (yearMode !== displayYear && !leaving) {
      setLeaving(true);
    }
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
        {displayYear ? <YearView /> : <MonthCarousel />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
