import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./ScreenHeader.module.css";

interface ScreenHeaderProps {
  title?: string | undefined;
  back?: boolean | string;
  actions?: ReactNode;
}

/** Per-screen header: back arrow + optional title + right-side action icons (Receive/Settings). */
export function ScreenHeader({ title, back, actions }: ScreenHeaderProps) {
  const navigate = useNavigate();
  return (
    <div className={styles.header}>
      {back ? (
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
          aria-label="Back"
        >
          <BackIcon />
        </button>
      ) : (
        <span className={styles.spacer} />
      )}
      {title && <span className={styles.title}>{title}</span>}
      <span className={styles.actions}>{actions ?? <span className={styles.spacer} />}</span>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="17" height="15" viewBox="0 0 18 16" fill="none">
      <path d="M17 8H1M1 8 7 2M1 8l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
