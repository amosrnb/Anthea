/**
 * Development-build helper for the Phase 1 acceptance criterion "KDF duration measured on a mid-range Android and an
 * iPhone": adds "Vault-KDF messen" to the Expo dev menu. Runs scrypt with the production parameters on random input
 * (no wallet data involved) and shows the timings.
 */
import { Alert, Platform } from 'react-native';
import { randomBytes } from '../core/bytes';
import { DEFAULT_SCRYPT } from '../core/vault';
import { scryptKdf } from '../platform/crypto';

export async function measureKdf(runs = 3): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < runs; i++) {
    const start = Date.now();
    await scryptKdf(randomBytes(6), randomBytes(16), DEFAULT_SCRYPT);
    times.push(Date.now() - start);
  }
  return times;
}

export function registerKdfBenchmark(): void {
  if (!__DEV__ || Platform.OS === 'web') return;
  // Loaded lazily: the dev menu module only exists in development builds.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerDevMenuItems } = require('expo-dev-client') as typeof import('expo-dev-client');
  void registerDevMenuItems([
    {
      name: 'Vault-KDF messen',
      callback: async () => {
        const times = await measureKdf();
        const { N, r, p } = DEFAULT_SCRYPT;
        const device =
          Platform.OS === 'android' ? `${(Platform.constants as { Model?: string }).Model ?? 'Android'} (API ${Platform.Version})` : `iOS ${Platform.Version}`;
        Alert.alert('scrypt N=2^' + Math.log2(N) + ', r=' + r + ', p=' + p, `${device}\n${times.map((t) => t + ' ms').join(' · ')}`);
      },
    },
  ]);
}
