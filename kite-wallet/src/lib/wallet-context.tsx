import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { START_BALANCES, type ChainId } from './data';

/**
 * Mock local vault. In the real app the seed phrase is encrypted with a key
 * derived from the password; this prototype only stores a password fingerprint
 * next to the demo phrase so the create / unlock / backup flows can be clicked through.
 */
type Vault = { mnemonic: string[]; passwordHash: string; backedUp: boolean };

type Status = 'loading' | 'none' | 'locked' | 'unlocked';

type WalletState = {
  status: Status;
  mnemonic: string[];
  backedUp: boolean;
  balances: Record<ChainId, number>;
  toast: string | null;
  flash: (msg: string) => void;
  /** Seed phrase and password held in memory while the create flow is in progress. */
  draft: { mnemonic: string[]; password: string } | null;
  setDraft: (d: { mnemonic: string[]; password: string } | null) => void;
  saveVault: (mnemonic: string[], password: string, backedUp: boolean) => Promise<void>;
  unlock: (password: string) => boolean;
  checkPassword: (password: string) => boolean;
  lock: () => void;
  markBackedUp: () => Promise<void>;
  debit: (chain: ChainId, amount: number) => void;
};

const KEY = 'anthea.vault.v1';
const Ctx = createContext<WalletState | null>(null);

// Prototype-only fingerprint (djb2). Not a KDF and not secure.
function fingerprint(password: string) {
  let h = 5381;
  for (let i = 0; i < password.length; i++) h = ((h << 5) + h + password.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [draft, setDraft] = useState<WalletState['draft']>(null);
  const [balances, setBalances] = useState(START_BALANCES);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const v = raw ? (JSON.parse(raw) as Vault) : null;
        setVault(v);
        setStatus(v ? 'locked' : 'none');
      })
      .catch(() => setStatus('none'));
    return () => clearTimeout(timer.current);
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const persist = useCallback(async (v: Vault) => {
    setVault(v);
    await AsyncStorage.setItem(KEY, JSON.stringify(v));
  }, []);

  const value = useMemo<WalletState>(
    () => ({
      status,
      mnemonic: status === 'unlocked' && vault ? vault.mnemonic : [],
      backedUp: vault?.backedUp ?? false,
      balances,
      toast,
      flash,
      draft,
      setDraft,
      saveVault: async (mnemonic, password, backedUp) => {
        await persist({ mnemonic, passwordHash: fingerprint(password), backedUp });
        setBalances(START_BALANCES);
        setDraft(null);
        setStatus('unlocked');
      },
      unlock: (password) => {
        if (!vault || fingerprint(password) !== vault.passwordHash) return false;
        setStatus('unlocked');
        return true;
      },
      checkPassword: (password) => !!vault && fingerprint(password) === vault.passwordHash,
      lock: () => setStatus(vault ? 'locked' : 'none'),
      markBackedUp: async () => {
        if (vault) await persist({ ...vault, backedUp: true });
      },
      debit: (chain, amount) => setBalances((b) => ({ ...b, [chain]: Math.max(0, b[chain] - amount) })),
    }),
    [status, vault, balances, toast, flash, draft, persist],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
