import { useNavigate } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { Button } from "../components/Button";
import { useWalletContext } from "../context/WalletContext";
import { isBackedUp } from "../lib/backup";
import styles from "./Settings.module.css";

export function Settings() {
  const { activeWallet, activeWalletId, wallets, lock } = useWalletContext();
  const navigate = useNavigate();
  const name = wallets.find((w) => w.id === activeWalletId)?.name ?? "Wallet";
  const backedUp = activeWalletId ? isBackedUp(activeWalletId) : false;

  if (!activeWallet) {
    return <p className="muted">No wallet selected yet.</p>;
  }

  return (
    <div className="stack">
      <ScreenHeader title="Settings" back="/home" />

      <div className={styles.section}>
        <button type="button" className={styles.row} onClick={() => navigate("/settings/backup")}>
          <span>
            <span className={styles.rowLabel}>Backup &amp; Recovery</span>
            <div className={styles.rowSub}>{name}</div>
          </span>
          <span className={`${styles.badge} ${backedUp ? styles.badgeOk : styles.badgeWarn}`}>
            {backedUp ? "Backed up" : "Not backed up"}
          </span>
        </button>
      </div>

      <div className={styles.section}>
        <div className={styles.row} style={{ cursor: "default" }}>
          <span>
            <span className={styles.rowLabel}>Non-custodial by design</span>
            <div className={styles.rowSub}>Your keys stay on this device — Anthea never sees them.</div>
          </span>
        </div>
      </div>

      <Button variant="secondary" onClick={lock}>
        Lock wallet
      </Button>
    </div>
  );
}
