import { createPortal } from 'react-dom';
import styles from './DayTooltip.module.css';

export interface TooltipEntry {
  color: string;
  name: string;
  status: 'planned' | 'approved';
}

interface Props {
  entries: TooltipEntry[];
  anchorRect: DOMRect;
}

export function DayTooltip({ entries, anchorRect }: Props) {
  if (entries.length === 0) return null;

  const spaceAbove = anchorRect.top;
  const above = spaceAbove > 80;

  const style: React.CSSProperties = {
    left: anchorRect.left + anchorRect.width / 2,
    ...(above
      ? { top: anchorRect.top + window.scrollY - 8 }
      : { top: anchorRect.bottom + window.scrollY + 8 }),
  };

  return createPortal(
    <div
      className={`${styles.tooltip} ${above ? styles.above : styles.below}`}
      style={style}
      role="tooltip"
    >
      {entries.map((e, i) => (
        <div key={i} className={styles.entry}>
          <span className={styles.dot} style={{ background: e.color }} />
          <span className={styles.name}>{e.name}</span>
          <span className={`${styles.status} ${styles[e.status]}`}>{e.status}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
