import * as ExpoSecureStore from 'expo-secure-store';
import { createExpoSecureStore, createMemorySecureStore } from '../secureStore';

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  getItemAsync: jest.fn(async () => 'value'),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

describe('expo secure store', () => {
  it('keeps every item on this device only, available while unlocked', async () => {
    const store = createExpoSecureStore();
    const options = { keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' };
    expect(await store.get('k')).toBe('value');
    await store.set('k', 'v');
    await store.delete('k');
    expect(ExpoSecureStore.getItemAsync).toHaveBeenCalledWith('k', options);
    expect(ExpoSecureStore.setItemAsync).toHaveBeenCalledWith('k', 'v', options);
    expect(ExpoSecureStore.deleteItemAsync).toHaveBeenCalledWith('k', options);
  });
});

describe('memory store (tests only)', () => {
  it('stores, reads and deletes', async () => {
    const store = createMemorySecureStore({ a: '1' });
    expect(await store.get('a')).toBe('1');
    await store.set('b', '2');
    await store.delete('a');
    expect(store.dump()).toEqual({ b: '2' });
    expect(await store.get('a')).toBeNull();
  });
});
