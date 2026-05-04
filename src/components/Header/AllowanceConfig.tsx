import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import styles from './AllowanceConfig.module.css';

export function AllowanceConfig() {
  const { state, dispatch } = useAppContext();
  const [value, setValue] = useState(String(state.config.totalAllowanceDays));

  useEffect(() => {
    setValue(String(state.config.totalAllowanceDays));
  }, [state.config.totalAllowanceDays]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    const n = parseInt(e.target.value, 10);
    if (!isNaN(n) && n >= 0 && n <= 365) {
      dispatch({ type: 'SET_ALLOWANCE', payload: n });
    }
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor="allowance-input">Days / year</label>
      <input
        id="allowance-input"
        className={styles.input}
        type="number"
        min={0}
        max={365}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
}
