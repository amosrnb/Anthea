import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isChainId, type ChainId } from "@anthea/wallet-core";
import { ScreenHeader } from "../components/ScreenHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { AmountInput } from "../components/AmountInput";
import { ReviewSheet } from "../components/ReviewSheet";
import { HoldToConfirmButton } from "../components/HoldToConfirmButton";
import { StatusScreen } from "../components/StatusScreen";
import { useWalletContext } from "../context/WalletContext";
import { useSession } from "../context/SessionContext";
import { CHAIN_META, CHAIN_ORDER } from "../lib/chains";
import { getMockAsset, estimateNetworkFee, simulateBroadcast, formatUsd, usdValue } from "../lib/mock";
import { truncateAddress } from "../lib/format";

type Step = "form" | "review" | "signing" | "success" | "error";

export function Send() {
  const { activeWallet } = useWalletContext();
  const { accountIndex } = useSession();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const requestedChain = searchParams.get("chain");
  const initialChain: ChainId = requestedChain && isChainId(requestedChain) ? requestedChain : "ethereum";

  const [chainId, setChainId] = useState<ChainId>(initialChain);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const account = useMemo(() => activeWallet?.account(accountIndex) ?? null, [activeWallet, accountIndex]);
  const chainAccount = account?.chain(chainId) ?? null;
  const meta = CHAIN_META[chainId];
  const asset = getMockAsset(chainId);
  const amountNum = parseFloat(amount || "0");
  const canContinue = to.trim().length > 6 && amountNum > 0 && amountNum <= asset.balance;

  async function confirmSend() {
    setStep("signing");
    try {
      await simulateBroadcast();
      setTxHash(
        "0x" + Array.from({ length: 64 }, () => "0123456789abcdef"[Math.floor(Math.random() * 16)]).join(""),
      );
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  }

  if (!account || !chainAccount) {
    return <p className="muted">No wallet selected yet.</p>;
  }

  if (step === "signing") {
    return <StatusScreen kind="pending" title="Signing…" subtitle="Signing on this device — your key never leaves it." />;
  }

  if (step === "success" && txHash) {
    return (
      <StatusScreen kind="success" title="Sent" subtitle={`${amount} ${meta.symbol} is on its way.`}>
        <Card className="stack">
          <p className="mono text-sm" style={{ wordBreak: "break-all" }}>
            {txHash}
          </p>
          <a href={meta.explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
            View on {chainId === "ethereum" ? "Etherscan" : "Solscan"} ↗
          </a>
        </Card>
        <Button onClick={() => navigate("/home")}>Done</Button>
      </StatusScreen>
    );
  }

  if (step === "error") {
    return (
      <StatusScreen kind="error" title="Transaction failed" subtitle={errorMsg ?? "Something specific went wrong. Try again."}>
        <Button onClick={() => setStep("form")}>Try again</Button>
      </StatusScreen>
    );
  }

  return (
    <div className="stack">
      <ScreenHeader title="Send" back="/home" />

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
            {CHAIN_META[id].symbol}
          </button>
        ))}
      </div>

      <TextField
        label={`Recipient address (${meta.label})`}
        placeholder={chainId === "ethereum" ? "0x…" : "Base58 address"}
        value={to}
        onChange={(e) => setTo(e.target.value)}
        spellCheck={false}
        autoComplete="off"
      />

      <Card>
        <AmountInput
          label="Amount"
          symbol={meta.symbol}
          value={amount}
          onChange={setAmount}
          balanceLabel={`Balance ${asset.balance} ${meta.symbol}`}
          onMax={() => setAmount(String(asset.balance))}
          fiatLabel={amountNum > 0 ? formatUsd(amountNum * asset.usdPrice) : undefined}
        />
      </Card>

      <Button disabled={!canContinue} onClick={() => setStep("review")}>
        Review
      </Button>

      {step === "review" && (
        <ReviewSheet
          title="Review send"
          rows={[
            { key: "To", value: to.trim() },
            { key: "Amount", value: `${amount} ${meta.symbol}` },
            { key: "Network fee", value: estimateNetworkFee(chainId) },
            { key: "Total value", value: formatUsd(usdValue({ ...asset, balance: amountNum })) },
          ]}
        >
          <HoldToConfirmButton label={`Send ${meta.symbol}`} onConfirm={confirmSend} />
        </ReviewSheet>
      )}
    </div>
  );
}
