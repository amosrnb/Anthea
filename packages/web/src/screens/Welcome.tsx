import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";

export function Welcome() {
  const navigate = useNavigate();
  return (
    <div className="stack" style={{ minHeight: "100%", justifyContent: "space-between", paddingTop: "var(--space-8)", paddingBottom: "var(--space-6)" }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center", marginTop: "var(--space-8)" }}>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "var(--color-brand)",
            display: "grid",
            placeItems: "center",
            fontWeight: 900,
            fontSize: "1.6rem",
            color: "var(--color-brand-contrast)",
          }}
        >
          A
        </span>
        <h1 style={{ fontSize: "var(--text-2xl)", marginTop: "var(--space-4)" }}>Anthea</h1>
        <p className="muted" style={{ maxWidth: 300 }}>
          Your keys. Your crypto. No middleman.
        </p>
      </div>
      <div className="stack">
        <Button onClick={() => navigate("/onboarding/create")}>Create a new wallet</Button>
        <Button variant="secondary" onClick={() => navigate("/onboarding/import")}>
          I already have a wallet
        </Button>
      </div>
    </div>
  );
}
