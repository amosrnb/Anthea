import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  WalletManager,
  type Wallet,
  type WalletSummary,
} from "@anthea/wallet-core";

/**
 * Session-only wallet state. `WalletManager`/`Wallet` never persist anything
 * beyond wallet-core's own encrypted IndexedDB vault, so nothing here is
 * kept outside memory — locking is just dropping these references (see
 * wallet-core's README: there is no separate lock() call).
 */
interface WalletContextValue {
  status: "loading" | "no-vault" | "locked" | "unlocked";
  wallets: WalletSummary[];
  activeWalletId: string | null;
  activeWallet: Wallet | null;
  error: string | null;
  clearError: () => void;
  initializeVault: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => void;
  createWallet: (name: string) => Promise<{ id: string; mnemonic: string }>;
  importWallet: (name: string, mnemonic: string) => Promise<{ id: string }>;
  selectWallet: (id: string) => void;
  renameWallet: (id: string, name: string) => Promise<void>;
  removeWallet: (id: string) => Promise<void>;
  removeVault: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [manager, setManagerState] = useState<WalletManager | null>(null);
  // `handleSubmit`-style callers do `await initializeVault(...)` then
  // immediately call `createWallet(...)` in the same async function. That
  // second call closes over whatever `manager` was at the *previous* render
  // — React state updates don't rewind an already-executing closure — so a
  // plain `useState` here is one render late. The ref is always current the
  // instant `initializeVault`/`unlock` resolve, regardless of render timing.
  const managerRef = useRef<WalletManager | null>(null);
  const setManager = useCallback((m: WalletManager | null) => {
    managerRef.current = m;
    setManagerState(m);
  }, []);
  const [status, setStatus] = useState<WalletContextValue["status"]>("loading");
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null);
  const [activeWallet, setActiveWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    WalletManager.exists()
      .then((exists) => setStatus(exists ? "locked" : "no-vault"))
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const refreshWallets = useCallback((m: WalletManager) => {
    setWallets(m.list());
  }, []);

  const selectWallet = useCallback((id: string) => {
    const m = managerRef.current;
    if (!m) return;
    try {
      setActiveWallet(m.getWallet(id));
      setActiveWalletId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const initializeVault = useCallback(async (password: string) => {
    setError(null);
    const m = await WalletManager.initialize(password);
    setManager(m);
    refreshWallets(m);
    setStatus("unlocked");
  }, [refreshWallets]);

  const unlock = useCallback(
    async (password: string) => {
      setError(null);
      try {
        const m = await WalletManager.unlock(password);
        setManager(m);
        refreshWallets(m);
        setStatus("unlocked");
        const list = m.list();
        const first = list[0];
        if (first) {
          setActiveWallet(m.getWallet(first.id));
          setActiveWalletId(first.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Incorrect password");
        throw err;
      }
    },
    [refreshWallets],
  );

  const lock = useCallback(() => {
    setManager(null);
    setWallets([]);
    setActiveWallet(null);
    setActiveWalletId(null);
    setStatus("locked");
  }, []);

  const createWallet = useCallback(
    async (name: string) => {
      const m = managerRef.current;
      if (!m) throw new Error("Vault is locked");
      setError(null);
      const { id, wallet } = await m.createWallet(name);
      refreshWallets(m);
      setActiveWallet(wallet);
      setActiveWalletId(id);
      return { id, mnemonic: wallet.mnemonic };
    },
    [refreshWallets],
  );

  const importWallet = useCallback(
    async (name: string, mnemonic: string) => {
      const m = managerRef.current;
      if (!m) throw new Error("Vault is locked");
      setError(null);
      const { id, wallet } = await m.importWallet(name, mnemonic);
      refreshWallets(m);
      setActiveWallet(wallet);
      setActiveWalletId(id);
      return { id };
    },
    [refreshWallets],
  );

  const renameWallet = useCallback(
    async (id: string, name: string) => {
      const m = managerRef.current;
      if (!m) throw new Error("Vault is locked");
      await m.renameWallet(id, name);
      refreshWallets(m);
    },
    [refreshWallets],
  );

  const removeWallet = useCallback(
    async (id: string) => {
      const m = managerRef.current;
      if (!m) throw new Error("Vault is locked");
      await m.removeWallet(id);
      refreshWallets(m);
      if (activeWalletId === id) {
        const next = m.list()[0];
        if (next) {
          setActiveWallet(m.getWallet(next.id));
          setActiveWalletId(next.id);
        } else {
          setActiveWallet(null);
          setActiveWalletId(null);
        }
      }
    },
    [refreshWallets, activeWalletId],
  );

  const removeVault = useCallback(async () => {
    await WalletManager.removeAll();
    setManager(null);
    setWallets([]);
    setActiveWallet(null);
    setActiveWalletId(null);
    setStatus("no-vault");
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      status,
      wallets,
      activeWalletId,
      activeWallet,
      error,
      clearError,
      initializeVault,
      unlock,
      lock,
      createWallet,
      importWallet,
      selectWallet,
      renameWallet,
      removeWallet,
      removeVault,
    }),
    [
      status,
      wallets,
      activeWalletId,
      activeWallet,
      error,
      clearError,
      initializeVault,
      unlock,
      lock,
      createWallet,
      importWallet,
      selectWallet,
      renameWallet,
      removeWallet,
      removeVault,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used within a WalletProvider");
  return ctx;
}
