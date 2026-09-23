import styles from "./InlineWarningBanner.module.css";

interface InlineWarningBannerProps {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
}

/** Persistent-but-dismissable banner, e.g. "Wallet not backed up" on Home. */
export function InlineWarningBanner({ text, actionLabel, onAction, onDismiss }: InlineWarningBannerProps) {
  return (
    <div className={styles.banner}>
      <span className={styles.icon}>!</span>
      <span className={styles.text}>{text}</span>
      {actionLabel && onAction && (
        <button type="button" className={styles.action} onClick={onAction}>
          {actionLabel}
        </button>
      )}
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
