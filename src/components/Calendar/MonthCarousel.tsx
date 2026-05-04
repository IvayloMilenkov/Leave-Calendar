import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { CalendarGrid } from './CalendarGrid';
import styles from './MonthCarousel.module.css';

function offsetMonth(year: number, month: number, delta: number) {
  let m = month + delta;
  let y = year;
  if (m > 12) { m -= 12; y++; }
  if (m < 1)  { m += 12; y--; }
  return { year: y, month: m };
}

function makeSlots(year: number, month: number) {
  return [-2, -1, 0, 1, 2].map(d => offsetMonth(year, month, d));
}

export function MonthCarousel() {
  const { state } = useAppContext();
  const { viewYear, viewMonth } = state.ui;

  const [slots, setSlots] = useState(() => makeSlots(viewYear, viewMonth));
  const [offset, setOffset] = useState(-1); // -1=center, -2=forward end, 0=backward end
  const [animated, setAnimated] = useState(false);
  const [slotWidth, setSlotWidth] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef({ year: viewYear, month: viewMonth });
  const pendingRef = useRef({ year: viewYear, month: viewMonth });

  // Measure slot width from actual DOM pixels
  useLayoutEffect(() => {
    if (viewportRef.current) setSlotWidth(viewportRef.current.offsetWidth / 3);
  }, []);

  useEffect(() => {
    if (!viewportRef.current) return;
    const ro = new ResizeObserver(() => {
      if (viewportRef.current) setSlotWidth(viewportRef.current.offsetWidth / 3);
    });
    ro.observe(viewportRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const prev = prevRef.current;
    if (prev.year === viewYear && prev.month === viewMonth) return;

    const goingForward = viewYear * 12 + viewMonth > prev.year * 12 + prev.month;
    prevRef.current = { year: viewYear, month: viewMonth };
    pendingRef.current = { year: viewYear, month: viewMonth };

    setAnimated(true);
    setOffset(goingForward ? -2 : 0);
  }, [viewYear, viewMonth]);

  function handleTransitionEnd() {
    const { year, month } = pendingRef.current;
    setSlots(makeSlots(year, month));
    setOffset(-1);
    setAnimated(false);
  }

  // Each slot is slotWidth px. 5 slots total. Offset -1 shows slots[1,2,3].
  const translateX = offset * slotWidth;

  return (
    <div ref={viewportRef} className={styles.viewport}>
      <div
        className={styles.track}
        style={{
          width: slotWidth * 5,
          transform: `translateX(${translateX}px)`,
          transition: animated ? 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {slots.map((slot, i) => (
          <div
            key={i}
            style={{ width: slotWidth }}
            className={`${styles.slot} ${i !== 2 ? styles.side : ''}`}
          >
            <CalendarGrid year={slot.year} month={slot.month} />
          </div>
        ))}
      </div>
    </div>
  );
}
