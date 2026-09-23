import { useMemo, useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { HoldToConfirmButton } from "./HoldToConfirmButton";
import { MnemonicGrid } from "./MnemonicGrid";
import { StatusScreen } from "./StatusScreen";

type Step = "why" | "reveal" | "confirm" | "done";

interface BackupFlowProps {
  mnemonic: string;
  onDone: () => void;
  /** Onboarding's soft-prompt lets the user skip; Settings entry (already backed up or not) doesn't offer this. */
  onSkip?: () => void;
}

/**
 * Flow 4 (Key backup) from the wallet-ux doc: why this matters, hold-to-reveal,
 * a numbered word grid, re-enter a handful of words to confirm a real backup
 * happened, then done. Shared between the onboarding soft-prompt and
 * Settings -> Backup & Recovery (re-entrant at any time).
 */
export function BackupFlow({ mnemonic, onDone, onSkip }: BackupFlowProps) {
  const [step, setStep] = useState<Step>("why");
  const words = useMemo(() => mnemonic.trim().split(/\s+/), [mnemonic]);
  const checkIndices = useMemo(() => {
    const last = words.length - 1;
    return [Math.min(2, last), Math.min(6, last), Math.min(10, last)].filter(
      (v, i, arr) => arr.indexOf(v) === i,
    );
  }, [words.length]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [confirmError, setConfirmError] = useState<string | null>(null);

  if (step === "why") {
    return (
      <div className="stack">
        <h2>Why this matters</h2>
        <p className="muted text-sm" style={{ lineHeight: 1.6 }}>
          Your recovery phrase is the only way to restore your funds if this device is lost, stolen, or
          reset. Anthea never sees it and cannot recover it for you — losing it means losing access to
          your wallet.
        </p>
        <Card>
          <p className="text-sm" style={{ lineHeight: 1.6 }}>
            You&rsquo;ll see {words.length} words. Write them down in order and store them somewhere
            offline and safe. Never share them or type them into a website.
          </p>
        </Card>
        <Button onClick={() => setStep("reveal")}>Continue</Button>
        {onSkip && (
          <Button variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    );
  }

  if (step === "reveal") {
    return <RevealStep mnemonic={mnemonic} onRevealed={() => setStep("confirm")} />;
  }

  if (step === "confirm") {
    return (
      <div className="stack">
        <h2>Confirm you saved it</h2>
        <p className="muted text-sm">Enter the following words from your recovery phrase.</p>
        <Card className="stack">
          {checkIndices.map((idx) => (
            <label key={idx} className="stack" style={{ gap: "var(--space-1)" }}>
              <span className="text-xs muted" style={{ fontWeight: 800 }}>
                Word #{idx + 1}
              </span>
              <input
                value={answers[idx] ?? ""}
                onChange={(e) => setAnswers((a) => ({ ...a, [idx]: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
                style={{
                  background: "var(--color-surface-raised)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 14px",
                  color: "var(--color-text)",
                  fontWeight: 700,
                }}
              />
            </label>
          ))}
        </Card>
        {confirmError && <p className="error-text">{confirmError}</p>}
        <Button
          onClick={() => {
            const ok = checkIndices.every(
              (idx) => (answers[idx] ?? "").trim().toLowerCase() === (words[idx] ?? "").toLowerCase(),
            );
            if (!ok) {
              setConfirmError("That doesn't match your recovery phrase. Double-check and try again.");
              return;
            }
            setConfirmError(null);
            setStep("done");
          }}
        >
          Confirm
        </Button>
      </div>
    );
  }

  return (
    <StatusScreen kind="success" title="Backup complete" subtitle="Your wallet is backed up. You can restore it on any device with this phrase.">
      <Button onClick={onDone}>Done</Button>
    </StatusScreen>
  );
}

function RevealStep({ mnemonic, onRevealed }: { mnemonic: string; onRevealed: () => void }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="stack">
      <h2>Reveal your phrase</h2>
      <p className="muted text-sm">Make sure no one can see your screen before you continue.</p>
      {revealed ? (
        <>
          <Card>
            <MnemonicGrid mnemonic={mnemonic} revealed />
          </Card>
          <Button onClick={onRevealed}>I&rsquo;ve written it down</Button>
        </>
      ) : (
        <HoldToConfirmButton label="Hold to reveal" onConfirm={() => setRevealed(true)} />
      )}
    </div>
  );
}
