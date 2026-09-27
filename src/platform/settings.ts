/**
 * Non-secret settings (BUILD_PLAN 7: MMKV). Values are validated on read so a corrupted entry falls back to the
 * default instead of breaking the app.
 */
import type { MMKV } from 'react-native-mmkv';

export const AUTO_LOCK_OPTIONS = [1, 5, 15] as const;
export type AutoLockMinutes = (typeof AUTO_LOCK_OPTIONS)[number];

export interface Settings {
  autoLockMinutes(): AutoLockMinutes;
  setAutoLockMinutes(m: AutoLockMinutes): void;
  /** Deletes all settings (wallet reset, BUILD_PLAN 5.3). */
  clear(): void;
}

const KEY_AUTO_LOCK = 'autoLockMinutes';

interface KV {
  getNumber(key: string): number | undefined;
  set(key: string, value: number): void;
  clearAll(): void;
}

function settingsOn(kv: KV): Settings {
  return {
    autoLockMinutes: () => {
      const v = kv.getNumber(KEY_AUTO_LOCK);
      return (AUTO_LOCK_OPTIONS as readonly number[]).includes(v ?? -1) ? (v as AutoLockMinutes) : 5;
    },
    setAutoLockMinutes: (m) => kv.set(KEY_AUTO_LOCK, m),
    clear: () => kv.clearAll(),
  };
}

export function createMmkvSettings(): Settings {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded lazily so tests never touch the native module
  const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
  const mmkv: MMKV = createMMKV({ id: 'anthea.settings' });
  return settingsOn(mmkv);
}

/** In-memory settings for tests. */
export function createMemorySettings(): Settings {
  const data = new Map<string, number>();
  return settingsOn({ getNumber: (k) => data.get(k), set: (k, v) => void data.set(k, v), clearAll: () => data.clear() });
}
