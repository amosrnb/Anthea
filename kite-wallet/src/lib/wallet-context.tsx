import { WalletManager, generateMnemonic, type Wallet } from '@anthea/wallet-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { START_BALANCES, type ChainId } from './data';

/**
 * Wallet state on top of @anthea/wallet-core. The seed phrase is generated
 * on-device and stored only in wallet-core's vault, encrypted with a key
 * derived from the password (PBKDF2 + AES-GCM); it is decrypted into memory
 * on unlock and dropped on lock. Balances, prices, fees and broadcast are
 * still simulated (see `data.ts`).
 */
type Status = 'loading' | 'none' | 'locked' | 'unlocked';

type Session = { walletId: string; wallet: Wallet; backedUp: boolean };

type WalletState = {
  status: Status;
  mnemonic: string[];
  /** Real receive addresses, derived from the seed phrase (account 0). */
  addresses: Record<ChainId, string>;
  backedUp: boolean;
  balances: Record<ChainId, number>;
  toast: string | null;
  flash: (msg: string) => void;
  /** Seed phrase and password held in memory while the create flow is in progress. */
  draft: { mnemonic: string[]; password: string } | null;
  setDraft: (d: { mnemonic: string[]; password: string } | null) => void;
  /** A fresh seed phrase from secure on-device randomness. */
  newMnemonic: () => string[];
  saveVault: (mnemonic: string[], password: string, backedUp: boolean) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  checkPassword: (password: string) => Promise<boolean>;
  lock: () => void;
  markBackedUp: () => Promise<void>;
  debit: (chain: ChainId, amount: number) => void;
  swap: (from: ChainId, to: ChainId, amountIn: number, amountOut: number) => void;
};

const WALLET_NAME = 'Main';
// Backup status is not secret, so it lives outside the encrypted vault.
const backedUpKey = (walletId: string) => `anthea.backedUp.${walletId}`;
// The earlier prototype kept a demo phrase here in plain text. Never read; removed on startup.
const LEGACY_MOCK_VAULT_KEY = 'anthea.vault.v1';

const NO_ADDRESSES: Record<ChainId, string> = { ethereum: '', solana: '' };

const Ctx = createContext<WalletState | null>(null);

async function openSession(manager: WalletManager): Promise<Session> {
  const [entry] = manager.list();
  if (!entry) throw new Error('The vault on this device has no wallet');
  const backedUp = (await AsyncStorage.getItem(backedUpKey(entry.id))) === '1';
  const wallet = manager.getWallet(entry.id);
  wallet.account(0); // derive (and cache) the keys now, while Unlock shows as busy, not during a render
  return { walletId: entry.id, wallet, backedUp };
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [draft, setDraft] = useState<WalletState['draft']>(null);
  const [balances, setBalances] = useState(START_BALANCES);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Vault writes take a moment (key derivation); a double tap must not start a second one.
  const saving = useRef<Promise<void> | null>(null);

  useEffect(() => {
    AsyncStorage.removeItem(LEGACY_MOCK_VAULT_KEY).catch(() => {});
    WalletManager.exists()
      .then((exists) => setStatus(exists ? 'locked' : 'none'))
      .catch(() => setStatus('none'));
    return () => clearTimeout(timer.current);
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const value = useMemo<WalletState>(() => {
    const account = status === 'unlocked' && session ? session.wallet.account(0) : null;
    return {
      status,
      mnemonic: account && session ? session.wallet.mnemonic.split(' ') : [],
      addresses: account ? { ethereum: account.ethereum.address, solana: account.solana.address } : NO_ADDRESSES,
      backedUp: session?.backedUp ?? false,
      balances,
      toast,
      flash,
      draft,
      setDraft,
      newMnemonic: () => generateMnemonic().split(' '),
      saveVault: (mnemonic, password, backedUp) => {
        saving.current ??= (async () => {
          // One wallet per device: creating or importing replaces any existing vault.
          if (await WalletManager.exists()) await WalletManager.removeAll();
          const manager = await WalletManager.initialize(password);
          const { id, wallet } = await manager.importWallet(WALLET_NAME, mnemonic.join(' '));
          if (backedUp) await AsyncStorage.setItem(backedUpKey(id), '1');
          wallet.account(0); // derive (and cache) the keys before the first render that needs them
          setSession({ walletId: id, wallet, backedUp });
          setBalances(START_BALANCES);
          setDraft(null);
          setStatus('unlocked');
        })().finally(() => {
          saving.current = null;
        });
        return saving.current;
      },
      unlock: async (password) => {
        try {
          setSession(await openSession(await WalletManager.unlock(password)));
          setStatus('unlocked');
          return true;
        } catch {
          return false;
        }
      },
      checkPassword: async (password) => {
        try {
          await WalletManager.unlock(password);
          return true;
        } catch {
          return false;
        }
      },
      lock: () => {
        setSession(null);
        setStatus('locked');
      },
      markBackedUp: async () => {
        if (!session) return;
        await AsyncStorage.setItem(backedUpKey(session.walletId), '1');
        setSession({ ...session, backedUp: true });
      },
      debit: (chain, amount) => setBalances((b) => ({ ...b, [chain]: Math.max(0, b[chain] - amount) })),
      swap: (from, to, amountIn, amountOut) =>
        setBalances((b) => ({ ...b, [from]: Math.max(0, b[from] - amountIn), [to]: b[to] + amountOut })),
    };
  }, [status, session, balances, toast, flash, draft]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
