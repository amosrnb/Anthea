import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ScreenHeader } from "../components/ScreenHeader";
import { InlineWarningBanner } from "../components/InlineWarningBanner";
import { AssetRow } from "../components/AssetRow";
import { useWalletContext } from "../context/WalletContext";
import { getMockAssets, formatUsd, totalUsdValue } from "../lib/mock";
import { isBackedUp } from "../lib/backup";
import styles from "./Home.module.css";

export function Home() {
  const { activeWallet, activeWalletId } = useWalletContext();
  const navigate = useNavigate();
  const backedUp = activeWalletId ? isBackedUp(activeWalletId) : true;
  const [bannerDismissed, setBannerDismissed] = useState(false);

  if (!activeWallet) {
    return <p className="muted">No wallet selected yet.</p>;
  }

  const assets = getMockAssets();

  return (
    <div className="stack">
      <ScreenHeader
        title={activeWallet ? "Anthea" : undefined}
        actions={
          <>
            <button type="button" className="icon-btn" onClick={() => navigate("/receive")} aria-label="Receive">
              <ReceiveIcon />
            </button>
            <button type="button" className="icon-btn" onClick={() => navigate("/settings")} aria-label="Settings">
              <SettingsIcon />
            </button>
          </>
        }
      />

      {!backedUp && !bannerDismissed && (
        <InlineWarningBanner
          text="Wallet not backed up"
          actionLabel="Back up"
          onAction={() => navigate("/settings/backup")}
          onDismiss={() => setBannerDismissed(true)}
        />
      )}

      <div className={styles.balance}>
        <div className={styles.balanceLabel}>Total balance</div>
        <div className={`${styles.balanceValue} tabular-nums`}>{formatUsd(totalUsdValue())}</div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={`${styles.actionButton} ${styles.send}`} onClick={() => navigate("/send")}>
          <span className={styles.actionIcon}>
            <SendIcon />
          </span>
          Send
        </button>
      </div>

      <div className={styles.sectionLabel}>Assets</div>
      <div className={styles.assetList}>
        {assets.map((asset) => (
          <AssetRow key={asset.chainId} asset={asset} onClick={() => navigate(`/send?chain=${asset.chainId}`)} />
        ))}
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ReceiveIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <path d="M12 4v14M12 19l-6-6M12 19l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
