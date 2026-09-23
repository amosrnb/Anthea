import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { BackupFlow } from "../components/BackupFlow";
import { useWalletContext } from "../context/WalletContext";
import { markBackedUp } from "../lib/backup";

type Step = "form" | "generating" | "secure" | "backup";

export function CreateWallet() {
  const { status, wallets, initializeVault, createWallet, error, clearError } = useWalletContext();
  const navigate = useNavigate();
  const isFirstWallet = status === "no-vault";

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState(wallets.length === 0 ? "Main" : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (isFirstWallet && password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return;
    }
    if (isFirstWallet && password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      if (isFirstWallet) {
        await initializeVault(password);
      }
      const result = await createWallet(name.trim() || "Wallet");
      setWalletId(result.id);
      setMnemonic(result.mnemonic);
      setStep("generating");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (step === "generating") {
    return <GeneratingStep onDone={() => setStep("secure")} />;
  }

  if (step === "secure" && mnemonic) {
    return (
      <div className="stack">
        <h2>Secure your wallet</h2>
        <p className="muted text-sm" style={{ lineHeight: 1.6 }}>
          A recovery phrase protects your wallet if this device is lost. It only takes a minute — but
          your wallet works fine even if you skip it for now.
        </p>
        <Button onClick={() => setStep("backup")}>Back up now</Button>
        <Button
          variant="secondary"
          onClick={() => navigate("/home")}
        >
          Skip for now
        </Button>
      </div>
    );
  }

  if (step === "backup" && mnemonic && walletId) {
    return (
      <BackupFlow
        mnemonic={mnemonic}
        onDone={() => {
          markBackedUp(walletId);
          navigate("/home");
        }}
      />
    );
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2>Create a new wallet</h2>
      <TextField
        label="Wallet name"
        placeholder="Main"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      {isFirstWallet && (
        <>
          <TextField
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <TextField
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <p className="faint text-xs">
            This password unlocks Anthea on this device. Anthea cannot reset it.
          </p>
        </>
      )}
      {(localError || error) && <p className="error-text">{localError || error}</p>}
      <Button type="submit" disabled={submitting}>
        {submitting ? "Creating…" : "Create wallet"}
      </Button>
    </form>
  );
}

function GeneratingStep({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="stack" style={{ alignItems: "center", textAlign: "center", marginTop: "var(--space-8)" }}>
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "3px solid rgba(109,94,252,0.25)",
          borderTopColor: "var(--color-brand)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <h2>Generating your keys</h2>
      <Card>
        <p className="muted text-sm">On this device, never shared.</p>
      </Card>
    </div>
  );
}
