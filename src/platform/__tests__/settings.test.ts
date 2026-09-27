import { createMemorySettings, createMmkvSettings } from '../settings';

jest.mock('react-native-mmkv', () => {
  const data = new Map<string, number>();
  return {
    createMMKV: () => ({ getNumber: (k: string) => data.get(k), set: (k: string, v: number) => data.set(k, v), clearAll: () => data.clear() }),
  };
});

describe.each([
  ['memory', createMemorySettings],
  ['mmkv', createMmkvSettings],
])('%s settings', (_name, create) => {
  it('defaults to 5 minutes, stores valid values and clears', () => {
    const s = create();
    expect(s.autoLockMinutes()).toBe(5);
    s.setAutoLockMinutes(15);
    expect(s.autoLockMinutes()).toBe(15);
    s.clear();
    expect(s.autoLockMinutes()).toBe(5);
  });

  it('ignores invalid stored values', () => {
    const s = create();
    s.setAutoLockMinutes(7 as 5);
    expect(s.autoLockMinutes()).toBe(5);
  });
});
