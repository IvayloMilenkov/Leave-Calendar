import { useState } from 'react';
import { useTeam } from '../../context/TeamContext';
import styles from './TeamSetup.module.css';

export function TeamSetup() {
  const { createTeam, joinTeam } = useTeam();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(''); setLoading(true);
    try { await createTeam(name.trim()); }
    catch { setError('Failed to create team. Try again.'); }
    finally { setLoading(false); }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError(''); setLoading(true);
    try { await joinTeam(code.trim()); }
    catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join team.');
    }
    finally { setLoading(false); }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <h2 className={styles.title}>Set up your team</h2>
        <p className={styles.subtitle}>Create a new team or join an existing one with an invite code.</p>

        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'create' ? styles.tabActive : ''}`} onClick={() => setTab('create')}>Create team</button>
          <button className={`${styles.tab} ${tab === 'join' ? styles.tabActive : ''}`} onClick={() => setTab('join')}>Join team</button>
        </div>

        {tab === 'create' ? (
          <form className={styles.form} onSubmit={handleCreate}>
            <input className={styles.input} placeholder="Team name" value={name} onChange={e => setName(e.target.value)} required />
            <button className={styles.btn} type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create'}</button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleJoin}>
            <input className={styles.input} placeholder="Invite code" value={code} onChange={e => setCode(e.target.value)} required />
            <button className={styles.btn} type="submit" disabled={loading}>{loading ? 'Joining…' : 'Join'}</button>
          </form>
        )}

        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
}
