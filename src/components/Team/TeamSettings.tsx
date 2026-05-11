import { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useTeam } from '../../context/TeamContext';
import styles from './TeamSettings.module.css';

const PALETTE = [
  '#6366f1', '#f59e0b', '#ef4444', '#10b981',
  '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6',
  '#f97316', '#84cc16',
];

interface Props {
  onClose: () => void;
}

export function TeamSettings({ onClose }: Props) {
  const { user, signOut } = useAuth();
  const { team, members, myColor, leaveTeam, removeMember, updateMyColor, regenerateInviteCode } = useTeam();
  const [copied, setCopied] = useState(false);

  if (!team) return null;

  const inviteLink = `${window.location.origin}${window.location.pathname}?join=${team.invite_code}`;
  const isOwner = team.owner_id === user?.id;

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleLeave() {
    if (!confirm('Leave this team? Your leave data will be removed.')) return;
    await leaveTeam();
    onClose();
  }

  async function handleRemove(memberId: string, memberEmail: string) {
    if (!confirm(`Remove ${memberEmail} from the team?`)) return;
    await removeMember(memberId);
  }

  return (
    <motion.div
      className={styles.overlay}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className={styles.panel}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      >
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>{team.name}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Invite link</h3>
          <div className={styles.inviteRow}>
            <code className={styles.code}>{team.invite_code}</code>
            <button className={styles.smallBtn} onClick={handleCopy}>{copied ? 'Copied!' : 'Copy link'}</button>
            {isOwner && (
              <button className={styles.smallBtn} onClick={regenerateInviteCode} title="Generate a new code">Regenerate</button>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Your colour</h3>
          <div className={styles.palette}>
            {PALETTE.map(c => (
              <button
                key={c}
                className={`${styles.swatch} ${myColor === c ? styles.swatchActive : ''}`}
                style={{ background: c }}
                onClick={() => updateMyColor(c)}
                aria-label={c}
              />
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Members</h3>
          <ul className={styles.memberList}>
            {members.map(m => {
              const isMe = m.user_id === user?.id;
              const label = isMe ? 'You' : (m.display_name ?? m.user_id.slice(0, 8));
              return (
                <li key={m.user_id} className={styles.memberItem}>
                  <span className={styles.dot} style={{ background: m.color }} />
                  <span className={styles.memberName}>{label}{m.user_id === team.owner_id ? ' (owner)' : ''}</span>
                  {isOwner && !isMe && (
                    <button className={styles.removeBtn} onClick={() => handleRemove(m.user_id, label)}>Remove</button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <div className={styles.footer}>
          <button className={styles.dangerBtn} onClick={handleLeave}>Leave team</button>
          <button className={styles.smallBtn} onClick={signOut}>Sign out</button>
        </div>
      </motion.div>
    </motion.div>
  );
}
