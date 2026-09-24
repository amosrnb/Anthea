import { WalletManager, generateMnemonic, type TransactionStatus, type Wallet } from '@anthea/wallet-core';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { DEFAULT_NETWORK, rpcConfig } from './config';
import { CHAINS, type ChainId, type Network } from './data';
import { fetchSpot, type Spot } from './prices';

/**
 * Wallet state on top of @anthea/wallet-core. The seed phrase is generated
 * on-device and stored only in wallet-core's vault, encrypted with a key
 * derived from the password (PBKDF2 + AES-GCM); it is decrypted into memory
 * on unlock and dropped on lock.
 *
 * Balances, fees, sends and transaction status go straight from the device to
 * the chain's RPC endpoint for the selected network (mainnet, or Sepolia /
 * Solana Devnet for testing); transactions are signed on the device. Prices
 * come from CoinGecko.
 */
type Status = 'loading' | 'none' | 'locked' | 'unlocked';

type Session = { walletId: string; wallet: Wallet; backedUp: boolean };

/** A transaction sent from this device in this session, followed until it settles. */
export type SentTx = {
  chain: ChainId;
  network: Network;
  hash: string;
  to: string;
  amount: string;
  status: TransactionStatus;
};

type Balances = Record<ChainId, string | null>;

type WalletState = {
  status: Status;
  mnemonic: string[];
  /** Real receive addresses, derived from the seed phrase (account 0). */
  addresses: Record<ChainId, string>;
  backedUp: boolean;
  network: Network;
  setNetwork: (network: Network) => Promise<void>;
  /** Exact balances as decimal strings; null until loaded. */
  balances: Balances;
  /** Why the last balance refresh failed, if it did. */
  balanceError: string | null;
  refreshing: boolean;
  refreshBalances: () => Promise<void>;
  /** Mainnet market prices; null until loaded or if unavailable. */
  prices: Record<ChainId, Spot> | null;
  /** Transactions sent in this session, newest first. */
  sent: SentTx[];
  estimateFee: (chain: ChainId, to: string, amount: string) => Promise<string>;
  /** Signs on the device and submits; resolves with the transaction hash/signature once accepted. */
  send: (chain: ChainId, to: string, amount: string) => Promise<string>;
  /** Free test SOL from the Devnet faucet (testnet only). */
  requestAirdrop: () => Promise<void>;
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
};

const WALLET_NAME = 'Main';
// Backup status is not secret, so it lives outside the encrypted vault.
const backedUpKey = (walletId: string) => `anthea.backedUp.${walletId}`;
// The earlier prototype kept a demo phrase here in plain text. Never read; removed on startup.
const LEGACY_MOCK_VAULT_KEY = 'anthea.vault.v1';
const NETWORK_KEY = 'anthea.network';

const NO_ADDRESSES: Record<ChainId, string> = { ethereum: '', solana: '' };
const NO_BALANCES: Balances = { ethereum: null, solana: null };

/** Balances for one account on one network (`key`); anything under another key is stale. */
type BalanceState = { key: string; balances: Balances; error: string | null; refreshing: boolean };
const NO_BALANCE_STATE: BalanceState = { key: '', balances: NO_BALANCES, error: null, refreshing: false };
const BALANCE_POLL_MS = 30_000;
const TX_POLL_MS = 4_000;

/** Turns RPC and provider errors into something a person can act on. */
export function friendlyError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/insufficient funds|insufficient lamports|exceeds the balance|debit an account but found no record/i.test(msg)) {
    return 'Not enough balance to cover the amount and network fee.';
  }
  if (/429|too many requests|rate limit/i.test(msg)) return 'The network is busy (rate limited). Try again in a minute.';
  if (/network request failed|failed to fetch|fetch failed|timed? ?out|HTTP request failed/i.test(msg)) {
    return "Couldn't reach the network. Check your connection and try again.";
  }
  if (/first transfer to it must be at least/i.test(msg)) return msg.replace(/^Error: /, '') + '.';
  if (/nonce too low|already known|replacement transaction underpriced/i.test(msg)) {
    return 'A previous transaction is still pending. Wait for it to confirm, then try again.';
  }
  const firstLine = msg.split('\n')[0].replace(/^Error: /, '');
  return firstLine.length > 160 ? 'The network rejected the transaction.' : firstLine;
}

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
  const [network, setNetworkState] = useState<Network>(DEFAULT_NETWORK);
  const [balanceState, setBalanceState] = useState<BalanceState>(NO_BALANCE_STATE);
  const [prices, setPrices] = useState<Record<ChainId, Spot> | null>(null);
  const [sent, setSent] = useState<SentTx[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Vault writes take a moment (key derivation); a double tap must not start a second one.
  const saving = useRef<Promise<void> | null>(null);

  useEffect(() => {
    AsyncStorage.removeItem(LEGACY_MOCK_VAULT_KEY).catch(() => {});
    Promise.all([
      AsyncStorage.getItem(NETWORK_KEY)
        .then((saved) => {
          if (saved === 'mainnet' || saved === 'testnet') setNetworkState(saved);
        })
        .catch(() => {}),
      WalletManager.exists().catch(() => false),
    ]).then(([, exists]) => setStatus(exists ? 'locked' : 'none'));
    return () => clearTimeout(timer.current);
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const account = status === 'unlocked' && session ? session.wallet.account(0) : null;

  // Balances for the unlocked account on the selected network. Only the
  // latest request may write, so a slow response from before a network
  // switch never lands.
  const balanceKey = account ? `${network}:${account.ethereum.address}` : '';
  const balanceGen = useRef(0);
  const loadBalances = useCallback(async () => {
    if (!account) return;
    const gen = ++balanceGen.current;
    const results = await Promise.allSettled(CHAINS.map((c) => account.chain(c).getNativeBalance(rpcConfig(c, network))));
    if (gen !== balanceGen.current) return;
    const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    setBalanceState((prev) => {
      const balances = prev.key === balanceKey ? { ...prev.balances } : { ...NO_BALANCES };
      results.forEach((r, i) => {
        if (r.status === 'fulfilled') balances[CHAINS[i]] = r.value;
      });
      return { key: balanceKey, balances, error: failed ? friendlyError(failed.reason) : null, refreshing: false };
    });
  }, [account, network, balanceKey]);
  const refreshBalances = useCallback(async () => {
    setBalanceState((prev) => (prev.key === balanceKey ? { ...prev, refreshing: true } : prev));
    await loadBalances();
  }, [balanceKey, loadBalances]);
  const current = balanceState.key === balanceKey ? balanceState : NO_BALANCE_STATE;

  useEffect(() => {
    if (!account) return;
    loadBalances();
    const poll = setInterval(loadBalances, BALANCE_POLL_MS);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && loadBalances());
    return () => {
      clearInterval(poll);
      sub.remove();
    };
  }, [account, loadBalances]);

  // Prices: once on unlock and then every few minutes; the last good quote is kept on failure.
  useEffect(() => {
    if (status !== 'unlocked') return;
    const load = () => fetchSpot().then(setPrices).catch(() => {});
    load();
    const poll = setInterval(load, 120_000);
    return () => clearInterval(poll);
  }, [status]);

  // Follow sent transactions until they confirm or fail.
  const pending = sent.filter((t) => t.status === 'pending');
  const pendingKey = pending.map((t) => t.hash).join(',');
  useEffect(() => {
    if (!account || !pendingKey) return;
    const check = async () => {
      for (const tx of pending) {
        const status = await account
          .chain(tx.chain)
          .getTransactionStatus(tx.hash, rpcConfig(tx.chain, tx.network))
          .catch(() => 'pending' as const);
        if (status === 'pending') continue;
        setSent((list) => list.map((t) => (t.hash === tx.hash ? { ...t, status } : t)));
        flash(status === 'confirmed' ? 'Transaction confirmed' : 'Transaction failed');
        refreshBalances();
      }
    };
    const poll = setInterval(check, TX_POLL_MS);
    return () => clearInterval(poll);
    // `pending` is derived from `sent`; pendingKey captures its identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, pendingKey, flash, refreshBalances]);

  const value = useMemo<WalletState>(() => {
    return {
      status,
      mnemonic: account && session ? session.wallet.mnemonic.split(' ') : [],
      addresses: account ? { ethereum: account.ethereum.address, solana: account.solana.address } : NO_ADDRESSES,
      backedUp: session?.backedUp ?? false,
      network,
      setNetwork: async (n) => {
        setNetworkState(n);
        await AsyncStorage.setItem(NETWORK_KEY, n).catch(() => {});
      },
      balances: current.balances,
      balanceError: current.error,
      refreshing: current.refreshing,
      refreshBalances,
      prices,
      sent,
      estimateFee: async (chain, to, amount) => {
        if (!account) throw new Error('Wallet is locked');
        return account.chain(chain).estimateNativeFee(to, amount, rpcConfig(chain, network));
      },
      send: async (chain, to, amount) => {
        if (!account) throw new Error('Wallet is locked');
        const hash = await account.chain(chain).sendNative(to, amount, rpcConfig(chain, network));
        setSent((list) => [{ chain, network, hash, to, amount, status: 'pending' as const }, ...list]);
        return hash;
      },
      requestAirdrop: async () => {
        if (!account) throw new Error('Wallet is locked');
        await account.solana.requestTestnetAirdrop('1', rpcConfig('solana', network));
        // The faucet transfer lands within a few seconds.
        setTimeout(refreshBalances, 3000);
        setTimeout(refreshBalances, 10000);
      },
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
          setSent([]);
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
        setSent([]);
        setStatus('locked');
      },
      markBackedUp: async () => {
        if (!session) return;
        await AsyncStorage.setItem(backedUpKey(session.walletId), '1');
        setSession({ ...session, backedUp: true });
      },
    };
  }, [status, session, account, network, current, refreshBalances, prices, sent, toast, flash, draft]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider');
  return ctx;
}
