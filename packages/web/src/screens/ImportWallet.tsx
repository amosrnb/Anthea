import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { useWalletContext } from "../context/WalletContext";

export function ImportWallet() {
  const { status, wallets, initializeVault, importWallet, error, clearError } = useWalletContext();
  const navigate = useNavigate();
  const isFirstWallet = status === "no-vault";

  const [name, setName] = useState(wallets.length === 0 ? "Main" : "");
  const [mnemonic, setMnemonic] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      await importWallet(name.trim() || "Wallet", mnemonic.trim());
      navigate("/home");
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <h2>Import an existing wallet</h2>
      <TextField
        label="Wallet name"
        placeholder="Main"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <div className="stack" style={{ gap: "var(--space-2)" }}>
        <label className="text-sm muted" htmlFor="mnemonic">
          Recovery phrase
        </label>
        <textarea
          id="mnemonic"
          rows={3}
          placeholder="12 or 24 words separated by spaces"
          value={mnemonic}
          onChange={(e) => setMnemonic(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          style={{
            background: "var(--color-surface-raised)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
            color: "var(--color-text)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
            resize: "vertical",
          }}
        />
      </div>
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
            This password encrypts your wallets on this device. Anthea cannot reset it.
          </p>
        </>
      )}
      {(localError || error) && <p className="error-text">{localError || error}</p>}
      <Button type="submit" disabled={submitting || mnemonic.trim().length === 0}>
        {submitting ? "Importing…" : "Import wallet"}
      </Button>
    </form>
  );
}
