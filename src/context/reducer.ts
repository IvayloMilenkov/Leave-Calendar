export interface AppState {
  config: {
    totalAllowanceDays: number;
  };
  leaveDays: Record<string, 'planned' | 'approved'>;
  ui: {
    viewYear: number;
    viewMonth: number;
    viewMode: 'month' | 'year';
  };
}

export type Action =
  | { type: 'TOGGLE_LEAVE_DAY'; payload: string }
  | { type: 'SET_ALLOWANCE'; payload: number }
  | { type: 'SET_VIEW'; payload: { year: number; month: number } }
  | { type: 'SET_VIEW_MODE'; payload: 'month' | 'year' }
  | { type: 'SET_LEAVE_DAYS'; payload: AppState['leaveDays'] }
  | { type: 'CLEAR_ALL' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_LEAVE_DAY': {
      const next = { ...state.leaveDays };
      if (next[action.payload] === 'planned') {
        next[action.payload] = 'approved';
      } else if (next[action.payload] === 'approved') {
        delete next[action.payload];
      } else {
        next[action.payload] = 'planned';
      }
      return { ...state, leaveDays: next };
    }
    case 'SET_ALLOWANCE':
      return { ...state, config: { ...state.config, totalAllowanceDays: action.payload } };
    case 'SET_VIEW':
      return { ...state, ui: { ...state.ui, viewYear: action.payload.year, viewMonth: action.payload.month } };
    case 'SET_VIEW_MODE':
      return { ...state, ui: { ...state.ui, viewMode: action.payload } };
    case 'SET_LEAVE_DAYS':
      return { ...state, leaveDays: action.payload };
    case 'CLEAR_ALL': {
      const next: AppState['leaveDays'] = {};
      for (const [k, v] of Object.entries(state.leaveDays)) {
        if (v === 'approved') next[k] = 'approved';
      }
      return { ...state, leaveDays: next };
    }
    default:
      return state;
  }
}
