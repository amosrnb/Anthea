import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isChainId, type ChainId } from "@anthea/wallet-core";
import { ScreenHeader } from "../components/ScreenHeader";
import { Card } from "../components/Card";
import { QrCode } from "../components/QrCode";
import { CopyButton } from "../components/CopyButton";
import { ChainBadge } from "../components/ChainBadge";
import { useWalletContext } from "../context/WalletContext";
import { useSession } from "../context/SessionContext";
import { CHAIN_ORDER } from "../lib/chains";

export function Receive() {
  const { activeWallet } = useWalletContext();
  const { accountIndex } = useSession();
  const [searchParams] = useSearchParams();

  const requestedChain = searchParams.get("chain");
  const initialChain: ChainId = requestedChain && isChainId(requestedChain) ? requestedChain : "ethereum";
  const [chainId, setChainId] = useState<ChainId>(initialChain);

  const account = useMemo(() => activeWallet?.account(accountIndex) ?? null, [activeWallet, accountIndex]);

  if (!account) {
    return <p className="muted">No wallet selected yet.</p>;
  }

  const chainAccount = account.chain(chainId);

  return (
    <div className="stack">
      <ScreenHeader title="Receive" back="/home" />

      <div className="row">
        {CHAIN_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setChainId(id)}
            style={{
              flex: 1,
              padding: "var(--space-2)",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${id === chainId ? "var(--color-brand)" : "var(--color-border)"}`,
              background: "var(--color-surface-raised)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {id === "ethereum" ? "ETH" : "SOL"}
          </button>
        ))}
      </div>

      <Card className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        <ChainBadge chainId={chainId} />
        <QrCode value={chainAccount.address} />
        <p className="mono text-sm" style={{ wordBreak: "break-all" }}>
          {chainAccount.address}
        </p>
        <p className="faint text-xs">
          Only send {chainId === "ethereum" ? "ETH or Ethereum-based" : "SOL or Solana-based"} assets to this
          address. Sending assets from other networks may result in permanent loss.
        </p>
        <CopyButton value={chainAccount.address} label="Copy address" />
      </Card>
    </div>
  );
}
