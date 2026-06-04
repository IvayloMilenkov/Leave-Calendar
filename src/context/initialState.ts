import type { AppState } from './reducer';

const STORAGE_KEY = 'leave-calendar-v1';

const now = new Date();

export const defaultState: AppState = {
  config: { totalAllowanceDays: 20 },
  leaveDays: {},
  ui: { viewYear: now.getFullYear(), viewMonth: now.getMonth() + 1, viewMode: 'month' },
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const savedUi = (parsed.ui ?? {}) as Partial<AppState['ui']>;
    const rawDays = parsed.leaveDays ?? {};
    const leaveDays: AppState['leaveDays'] = {};
    for (const [k, v] of Object.entries(rawDays)) {
      if (v === 'planned' || v === 'approved') leaveDays[k] = v;
    }
    return {
      config: parsed.config ?? defaultState.config,
      leaveDays,
      ui: {
        viewYear:  savedUi.viewYear  ?? defaultState.ui.viewYear,
        viewMonth: savedUi.viewMonth ?? defaultState.ui.viewMonth,
        viewMode:  savedUi.viewMode  ?? 'month',
      },
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
