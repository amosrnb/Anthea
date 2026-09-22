import { useState, type FormEvent } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { TextField } from "../components/TextField";
import { useWalletContext } from "../context/WalletContext";

export function Unlock() {
  const { unlock, error, clearError } = useWalletContext();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await unlock(password);
    } catch {
      // error already surfaced via context
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack" style={{ marginTop: "var(--space-6)" }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center" }}>
        <h1 style={{ fontSize: "var(--text-2xl)" }}>Anthea</h1>
        <p className="muted">Enter your password to unlock your wallets.</p>
      </div>
      <Card>
        <form className="stack" onSubmit={handleSubmit}>
          <TextField
            label="Password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <p className="error-text">{error}</p>}
          <Button type="submit" disabled={submitting || password.length === 0}>
            {submitting ? "Unlocking…" : "Unlock"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
