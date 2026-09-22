import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ChainId } from "@anthea/wallet-core";
import { ScreenHeader } from "../components/ScreenHeader";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { AmountInput } from "../components/AmountInput";
import { ReviewSheet } from "../components/ReviewSheet";
import { HoldToConfirmButton } from "../components/HoldToConfirmButton";
import { StatusScreen } from "../components/StatusScreen";
import { CHAIN_META } from "../lib/chains";
import { getMockAsset, getMockAssets, getSwapQuote, simulateBroadcast, formatUsd } from "../lib/mock";

type Step = "form" | "review" | "signing" | "success" | "error";

const QUOTE_TTL = 15;

export function Swap() {
  const navigate = useNavigate();
  const assets = getMockAssets();

  const [fromChain, setFromChain] = useState<ChainId>("solana");
  const [toChain, setToChain] = useState<ChainId>("ethereum");
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QUOTE_TTL);
  const [quoteStale, setQuoteStale] = useState(false);

  const fromAsset = getMockAsset(fromChain);
  const toAsset = getMockAsset(toChain);
  const amountNum = parseFloat(amount || "0");
  const quote = useMemo(() => getSwapQuote(fromAsset.symbol, toAsset.symbol, amountNum), [fromAsset.symbol, toAsset.symbol, amountNum]);
  const canContinue = amountNum > 0 && amountNum <= fromAsset.balance;

  useEffect(() => {
    if (amountNum <= 0) return;
    setSecondsLeft(QUOTE_TTL);
    setQuoteStale(false);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setQuoteStale(true);
          return QUOTE_TTL;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountNum, fromChain, toChain]);

  function swapDirection() {
    setFromChain(toChain);
    setToChain(fromChain);
  }

  function refreshQuote() {
    setQuoteStale(false);
    setSecondsLeft(QUOTE_TTL);
  }

  async function confirmSwap() {
    setStep("signing");
    try {
      const hash = await simulateBroadcast();
      setTxHash(hash);
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Swap failed");
      setStep("error");
    }
  }

  if (step === "signing") {
    return <StatusScreen kind="pending" title="Signing…" subtitle="Signing on this device — your key never leaves it." />;
  }

  if (step === "success" && txHash) {
    return (
      <StatusScreen
        kind="success"
        title="Swap complete"
        subtitle={`Sent ${amount} ${fromAsset.symbol}, received ${quote.toAmount.toFixed(4)} ${toAsset.symbol}.`}
      >
        <Card className="stack">
          <p className="mono text-sm" style={{ wordBreak: "break-all" }}>
            {txHash}
          </p>
        </Card>
        <Button onClick={() => navigate("/home")}>Done</Button>
      </StatusScreen>
    );
  }

  if (step === "error") {
    return (
      <StatusScreen kind="error" title="Swap failed" subtitle={errorMsg ?? "Something specific went wrong. Try again."}>
        <Button onClick={() => setStep("form")}>Try again</Button>
      </StatusScreen>
    );
  }

  return (
    <div className="stack">
      <ScreenHeader title="Swap" back="/home" />

      <Card className="stack">
        <AmountInput
          label="From"
          symbol={fromAsset.symbol}
          value={amount}
          onChange={setAmount}
          balanceLabel={`Balance ${fromAsset.balance} ${fromAsset.symbol}`}
          onMax={() => setAmount(String(fromAsset.balance))}
        />
        <div className="row">
          {assets.map((a) => (
            <button
              key={a.chainId}
              type="button"
              onClick={() => setFromChain(a.chainId)}
              disabled={a.chainId === toChain}
              style={{
                flex: 1,
                padding: "var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${a.chainId === fromChain ? "var(--color-brand)" : "var(--color-border)"}`,
                background: "var(--color-surface-raised)",
                color: "var(--color-text)",
                cursor: a.chainId === toChain ? "not-allowed" : "pointer",
                opacity: a.chainId === toChain ? 0.4 : 1,
                fontWeight: 800,
              }}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          type="button"
          onClick={swapDirection}
          aria-label="Swap direction"
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            border: "3px solid var(--color-bg)",
            background: "var(--color-surface-raised)",
            color: "var(--color-brand)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            marginTop: -14,
            marginBottom: -14,
            zIndex: 1,
          }}
        >
          ↓
        </button>
      </div>

      <Card className="stack">
        <div className="row-between">
          <span className="text-xs muted" style={{ fontWeight: 800, letterSpacing: "0.06em" }}>
            TO (ESTIMATED)
          </span>
          <span className="text-xs muted" style={{ fontWeight: 700 }}>
            Balance {toAsset.balance} {toAsset.symbol}
          </span>
        </div>
        <div className="row-between">
          <span className="tabular-nums" style={{ fontWeight: 900, fontSize: "2.2rem", color: "var(--color-brand-strong)" }}>
            {amountNum > 0 ? quote.toAmount.toFixed(4) : "0.0"}
          </span>
          <span style={{ fontWeight: 800 }}>{toAsset.symbol}</span>
        </div>
        {amountNum > 0 && <span className="text-sm muted tabular-nums">{formatUsd(quote.toAmount * toAsset.usdPrice)}</span>}
      </Card>

      {amountNum > 0 && (
        <div className="row-between text-xs muted" style={{ fontWeight: 700 }}>
          <span>
            1 {fromAsset.symbol} ≈ {quote.rate.toFixed(4)} {toAsset.symbol}
          </span>
          <span>Quote refreshes in {secondsLeft}s</span>
        </div>
      )}

      <Button disabled={!canContinue} onClick={() => setStep("review")}>
        Review swap
      </Button>

      {step === "review" && !quoteStale && (
        <ReviewSheet
          title="Review swap"
          rows={[
            { key: "Rate", value: `1 ${fromAsset.symbol} = ${quote.rate.toFixed(4)} ${toAsset.symbol}` },
            { key: "Network fee", value: quote.fee },
            { key: "Minimum received", value: `${quote.minReceived.toFixed(4)} ${toAsset.symbol}` },
          ]}
        >
          <HoldToConfirmButton label="Confirm swap" onConfirm={confirmSwap} />
        </ReviewSheet>
      )}

      {step === "review" && quoteStale && (
        <ReviewSheet title="Quote expired" rows={[{ key: "Reason", value: "Rates moved — review before confirming." }]}>
          <Button onClick={refreshQuote}>Refresh quote</Button>
        </ReviewSheet>
      )}
    </div>
  );
}
