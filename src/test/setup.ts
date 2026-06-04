import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

// vitest 4.x doesn't expose jsdom's localStorage as a global in all pool modes.
// Provide a Map-backed implementation that works in any environment.
const _store = new Map<string, string>();

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem:    (k: string)          => _store.get(k) ?? null,
    setItem:    (k: string, v: string) => _store.set(k, String(v)),
    removeItem: (k: string)          => _store.delete(k),
    clear:      ()                   => _store.clear(),
    get length()                     { return _store.size; },
    key:        (n: number)          => [..._store.keys()][n] ?? null,
  },
  configurable: true,
  writable: true,
});

// Auto-clear between every test so tests don't bleed into each other.
beforeEach(() => _store.clear());
