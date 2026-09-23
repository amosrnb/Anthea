import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ChainId } from "@anthea/wallet-core";
import { useWalletContext } from "./WalletContext";

/**
 * UI-only selection state (which account index / chain is in view). Separate
 * from `WalletContext` because wallet-core has no notion of "how many
 * accounts a wallet has" — accounts are derived on demand, so the app just
 * tracks how many the user has chosen to reveal, per active wallet.
 */
interface SessionContextValue {
  accountIndex: number;
  setAccountIndex: (index: number) => void;
  revealedAccounts: number;
  addAccount: () => void;
  chain: ChainId;
  setChain: (chain: ChainId) => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { activeWalletId } = useWalletContext();
  const [accountIndex, setAccountIndex] = useState(0);
  const [revealedByWallet, setRevealedByWallet] = useState<Record<string, number>>({});
  const [chain, setChain] = useState<ChainId>("ethereum");

  const revealedAccounts = (activeWalletId && revealedByWallet[activeWalletId]) || 1;

  const addAccount = () => {
    if (!activeWalletId) return;
    setRevealedByWallet((prev) => ({
      ...prev,
      [activeWalletId]: (prev[activeWalletId] || 1) + 1,
    }));
  };

  const value = useMemo<SessionContextValue>(
    () => ({ accountIndex, setAccountIndex, revealedAccounts, addAccount, chain, setChain }),
    [accountIndex, revealedAccounts, chain, activeWalletId],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
