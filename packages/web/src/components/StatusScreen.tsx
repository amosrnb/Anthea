import type { ReactNode } from "react";
import styles from "./StatusScreen.module.css";

type Kind = "pending" | "success" | "error";

interface StatusScreenProps {
  kind: Kind;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

/**
 * One shared layout for pending/success/error across send, swap, and backup
 * — same structure, different icon/copy, per the wallet-ux doc. Error copy
 * passed in by the caller should always be specific (insufficient funds,
 * network error, rejected) rather than a bare "something went wrong".
 */
export function StatusScreen({ kind, title, subtitle, children }: StatusScreenProps) {
  return (
    <div className={styles.wrap}>
      <div className={`${styles.icon} ${styles[kind]}`}>
        {kind === "pending" && <span className={styles.spinner} />}
        {kind === "success" && <SuccessIcon />}
        {kind === "error" && <ErrorIcon />}
      </div>
      <div className={styles.title}>{title}</div>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {children && <div className={styles.actions}>{children}</div>}
    </div>
  );
}

function SuccessIcon() {
  return (
    <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
      <path d="M2 11 10 19 26 2" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 3 21 21M21 3 3 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
