import { useCallback, useRef, useState } from "react";
import styles from "./HoldToConfirmButton.module.css";

const HOLD_MS = 700;

interface HoldToConfirmButtonProps {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  variant?: "primary" | "danger";
}

/**
 * Replaces tap-to-confirm for anything irreversible (send, swap, seed
 * reveal) per the wallet-ux design doc: a single, consistent gesture the
 * user learns once and trusts everywhere, so a mis-tap can't trigger an
 * irreversible action.
 */
export function HoldToConfirmButton({ label, onConfirm, disabled, variant = "primary" }: HoldToConfirmButtonProps) {
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const doneRef = useRef(false);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    startRef.current = null;
    if (!doneRef.current) setProgress(0);
  }, []);

  const start = useCallback(() => {
    if (disabled) return;
    doneRef.current = false;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now);
      const pct = Math.min(100, (elapsed / HOLD_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        doneRef.current = true;
        frameRef.current = null;
        onConfirm();
        return;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
  }, [disabled, onConfirm]);

  return (
    <button
      type="button"
      disabled={disabled}
      className={`${styles.button} ${variant === "danger" ? styles.danger : ""}`}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
    >
      <span className={styles.fill} style={{ width: `${progress}%`, transitionDuration: progress === 0 ? "0.15s" : "0s" }} />
      <span className={styles.label}>{label}</span>
      {progress === 0 && <span className={styles.hint}>Hold</span>}
    </button>
  );
}
