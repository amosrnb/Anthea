import type { ReactNode } from "react";
import styles from "./ReviewSheet.module.css";

export interface ReviewRow {
  key: string;
  value: ReactNode;
}

interface ReviewSheetProps {
  title: string;
  rows: ReviewRow[];
  children: ReactNode;
}

/**
 * Bottom sheet for irreversible actions (send/swap/seed-reveal review).
 * Deliberately not dismissable by tapping the backdrop — the wallet-ux doc
 * calls this out explicitly so a stray tap can never silently discard a
 * confirmation step the user is mid-way through.
 */
export function ReviewSheet({ title, rows, children }: ReviewSheetProps) {
  return (
    <div className={styles.backdrop}>
      <div className={styles.sheet}>
        <div className={styles.grabber} />
        <div className={styles.title}>{title}</div>
        <div className={styles.rows}>
          {rows.map((row) => (
            <div className={styles.row} key={row.key}>
              <span className={styles.rowKey}>{row.key}</span>
              <span className={`${styles.rowValue} tabular-nums`}>{row.value}</span>
            </div>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
